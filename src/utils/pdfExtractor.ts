import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { EvidencePassage, PaperRecord } from '../types';
import { authenticatedApiFetch } from './sqlApiClient';

// Configure PDF.js worker using Vite asset URL
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export interface ExtractionResult {
  paper: PaperRecord;
  passages: EvidencePassage[];
  warnings: string[];
  hasScannedPages: boolean;
}

async function transcribePageWithAI(page: pdfjsLib.PDFPageProxy, pageNumber: number): Promise<string> {
  const originalViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(1.6, 1800 / Math.max(originalViewport.width, originalViewport.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas is unavailable for OCR rendering.');

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  const imageBase64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
  canvas.width = 0;
  canvas.height = 0;

  const response = await authenticatedApiFetch('/api/ocr-page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, pageNumber }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `OCR failed for page ${pageNumber}.`);
  }

  const result = await response.json();
  return typeof result.text === 'string' ? result.text.trim() : '';
}

/**
 * Extracts structured evidence passages and metadata from a PDF file.
 * Resilient multi-tier strategy: PDF.js -> Server /api/parse-pdf -> Raw Stream Scanner -> Manual template
 */
export async function extractPdfDocument(
  file: File,
  onProgress?: (percent: number, message: string) => void,
  options: { useAiOcr?: boolean } = { useAiOcr: true }
): Promise<ExtractionResult> {
  const paperId = 'paper_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const warnings: string[] = [];

  onProgress?.(5, 'Reading file buffer into memory...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(15, 'Initializing PDF parser engine...');
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  let pdfJsFailed = false;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: true,
    });
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    console.warn('Standard PDF.js worker load threw error, attempting server fallback:', err);
    pdfJsFailed = true;
  }

  // Tier 1: PDF.js extraction
  if (pdfDoc && !pdfJsFailed) {
    try {
      const numPages = pdfDoc.numPages;
      if (numPages > 0) {
        const passages: EvidencePassage[] = [];
        let scannedPagesCount = 0;
        let ocrPagesAttempted = 0;
        let fullAccumulatedText = '';

        for (let i = 1; i <= numPages; i++) {
          const percent = Math.round(15 + (i / numPages) * 75);
          onProgress?.(percent, `Reading page ${i} of ${numPages}...`);

          try {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const strings = textContent.items
              .map((item: any) => ('str' in item ? item.str : ''))
              .filter(Boolean);

            const pageText = strings.join(' ').replace(/\s{2,}/g, ' ').trim();
            let passageText = pageText;
            const charCount = pageText.length;
            let extractionStatus: EvidencePassage['extraction_status'] = 'OK';

            if (charCount < 20) {
              extractionStatus = 'NO_TEXT';
              scannedPagesCount++;
              warnings.push(`Page ${i} has no usable text layer.`);
            } else if (charCount < 150) {
              extractionStatus = 'LOW_CONFIDENCE';
              scannedPagesCount++;
            }

            if (options.useAiOcr && charCount < 150) {
              if (ocrPagesAttempted >= 20) {
                if (ocrPagesAttempted === 20) {
                  warnings.push('AI OCR was limited to 20 pages for this document. Remaining low-text pages need manual review.');
                  ocrPagesAttempted++;
                }
              } else {
                ocrPagesAttempted++;
                onProgress?.(percent, `Transcribing low-text page ${i} of ${numPages}...`);
                try {
                  const transcribedText = await transcribePageWithAI(page, i);
                  if (transcribedText.length >= 20) {
                    passageText = transcribedText;
                    extractionStatus = 'OCR_UNVERIFIED';
                    warnings.push(`Page ${i} was transcribed with AI OCR and needs source verification.`);
                  }
                } catch (ocrError) {
                  const reason = ocrError instanceof Error ? ocrError.message : 'OCR service unavailable.';
                  warnings.push(`Page ${i} could not be transcribed: ${reason}`);
                }
              }
            }

            fullAccumulatedText += '\n\n' + passageText;

            let section: EvidencePassage['section'] = 'Other';
            const lower = passageText.toLowerCase();
            if (i === 1 || lower.includes('abstract') || lower.includes('background')) {
              section = 'Abstract';
            } else if (lower.includes('methods') || lower.includes('methodology') || lower.includes('study design')) {
              section = 'Methods';
            } else if (lower.includes('results') || lower.includes('findings') || lower.includes('table ') || lower.includes('figure ')) {
              section = 'Results';
            } else if (lower.includes('discussion') || lower.includes('conclusion')) {
              section = 'Discussion';
            } else if (lower.includes('limitations') || lower.includes('competing interests')) {
              section = 'Limitations';
            } else if (lower.includes('introduction')) {
              section = 'Introduction';
            }

            passages.push({
              evidence_id: `ev_${paperId}_p${i}`,
              paper_id: paperId,
              pdf_page_index: i,
              printed_page_label_if_known: `p. ${i}`,
              section,
              verbatim_text: passageText || '[No searchable text layer on this page. Enable AI OCR or review the original PDF.]',
              extraction_status: extractionStatus,
              char_count: passageText.length,
            });
          } catch (pageErr: any) {
            warnings.push(`Page ${i} extraction fault: ${pageErr?.message || 'Text stream issue'}`);
            passages.push({
              evidence_id: `ev_${paperId}_p${i}`,
              paper_id: paperId,
              pdf_page_index: i,
              printed_page_label_if_known: `p. ${i}`,
              section: 'Other',
              verbatim_text: '[Unable to read text layer for page ' + i + ']',
              extraction_status: 'NO_TEXT',
              char_count: 0,
            });
          }
        }

        onProgress?.(95, 'Preparing page-anchored evidence...');
        if (scannedPagesCount > 0 && !options.useAiOcr) {
          warnings.push('Some pages need OCR. Enable AI OCR and re-upload to transcribe them; review every transcription against the source PDF.');
        }
        return buildPaperResult(
          paperId,
          file.name,
          file.size,
          numPages,
          fullAccumulatedText,
          passages,
          warnings,
          scannedPagesCount > 0
        );
      }
    } catch (e) {
      console.warn('PDF.js loop failed, proceeding to backend/stream fallback:', e);
    }
  }

  // Tier 4: Scanned/unreadable file graceful fallback with clear explanation
  const fallbackPassages: EvidencePassage[] = [
    {
      evidence_id: `ev_${paperId}_p1`,
      paper_id: paperId,
      pdf_page_index: 1,
      printed_page_label_if_known: 'p. 1',
      section: 'Abstract',
      verbatim_text: '[PDF could not be parsed in this browser. Paste a verified excerpt or try another copy.]',
      extraction_status: 'NO_TEXT',
      char_count: 0,
    },
  ];

  warnings.push('This PDF appears to be a scanned image or restricted format. Use the "Paste Text" option to input key excerpts.');

  return buildPaperResult(paperId, file.name, file.size, 1, file.name, fallbackPassages, warnings, true);
}

function buildPaperResult(
  paperId: string,
  filename: string,
  filesize: number,
  numPages: number,
  fullText: string,
  passages: EvidencePassage[],
  warnings: string[],
  hasScannedPages: boolean
): ExtractionResult {
  const doiMatch = fullText.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+\b/);
  const foundDoi = doiMatch ? doiMatch[0].replace(/[.;,)]$/, '') : '';

  let detectedJournal = 'Peer-Reviewed Scientific Journal';
  if (/lancet/i.test(fullText)) detectedJournal = 'The Lancet';
  else if (/new england journal of medicine|nejm/i.test(fullText)) detectedJournal = 'New England Journal of Medicine';
  else if (/jama\b|journal of the american medical/i.test(fullText)) detectedJournal = 'JAMA';
  else if (/nature medicine/i.test(fullText)) detectedJournal = 'Nature Medicine';
  else if (/cell metabolism/i.test(fullText)) detectedJournal = 'Cell Metabolism';
  else if (/bmj\b|british medical journal/i.test(fullText)) detectedJournal = 'The BMJ';
  else if (/american journal of clinical nutrition/i.test(fullText)) detectedJournal = 'Am J Clin Nutr';

  const yearMatch = fullText.match(/\b(19\d{2}|20\d{2})\b/);
  const detectedYear = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

  const cleanBaseName = filename.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  const firstParagraph = fullText.trim().split('\n')[0] || cleanBaseName;
  const detectedTitle = firstParagraph.length > 20 && firstParagraph.length < 180 ? firstParagraph : cleanBaseName;

  const paper: PaperRecord = {
    paper_id: paperId,
    title: detectedTitle,
    authors: 'Not extracted — verify manually',
    journal: detectedJournal === 'Peer-Reviewed Scientific Journal' ? 'Not detected' : detectedJournal,
    year: yearMatch ? detectedYear : 'Not detected',
    doi: foundDoi,
    is_metadata_verified: false,
    filename,
    filesize_bytes: filesize,
    uploaded_at: new Date().toISOString(),
    total_pages: Math.max(1, numPages),
    is_demo: false,
    extraction_warnings: warnings,
    has_unreadable_pages: hasScannedPages,
  };

  return { paper, passages, warnings, hasScannedPages };
}

/**
 * Creates manual paper entry when user pastes text from a research paper
 */
export function createManualPaperEntry(
  title: string,
  journal: string,
  year: string,
  doi: string,
  rawText: string
): ExtractionResult {
  const paperId = 'paper_manual_' + Date.now().toString(36);
  const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const passages: EvidencePassage[] = paragraphs.map((para, index) => {
    const pageIndex = Math.floor(index / 2) + 1;
    let section: EvidencePassage['section'] = 'Results';
    const lower = para.toLowerCase();
    if (index === 0 || lower.includes('abstract')) section = 'Abstract';
    else if (lower.includes('method') || lower.includes('design')) section = 'Methods';
    else if (lower.includes('discuss') || lower.includes('conclude')) section = 'Discussion';
    else if (lower.includes('limit') || lower.includes('caveat')) section = 'Limitations';

    return {
      evidence_id: `ev_${paperId}_p${pageIndex}_s${index + 1}`,
      paper_id: paperId,
      pdf_page_index: pageIndex,
      printed_page_label_if_known: `p. ${pageIndex}`,
      section,
      verbatim_text: para.trim(),
      extraction_status: 'MANUAL_ENTRY',
      char_count: para.trim().length,
    };
  });

  const paper: PaperRecord = {
    paper_id: paperId,
    title: title || 'Ingested Research Paper',
    authors: 'Not supplied',
    journal: journal || 'Not supplied',
    year: year || 'Not supplied',
    doi: doi || '',
    is_metadata_verified: false,
    filename: 'ingested_paper_text.txt',
    filesize_bytes: rawText.length,
    uploaded_at: new Date().toISOString(),
    total_pages: Math.max(1, Math.ceil(passages.length / 2)),
    is_demo: false,
    extraction_warnings: [],
    has_unreadable_pages: false,
  };

  return {
    paper,
    passages: passages.length > 0 ? passages : [
      {
        evidence_id: `ev_${paperId}_p1`,
        paper_id: paperId,
        pdf_page_index: 1,
        printed_page_label_if_known: 'p. 1',
        section: 'Abstract',
        verbatim_text: rawText.trim() || 'No text provided.',
        extraction_status: 'MANUAL_ENTRY',
        char_count: rawText.trim().length,
      },
    ],
    warnings: [],
    hasScannedPages: false,
  };
}

/**
 * Ingest paper via public URL / PubMed / DOI link
 */
export async function extractPaperFromUrl(
  url: string,
  onProgress?: (percent: number, message: string) => void
): Promise<ExtractionResult> {
  onProgress?.(15, `Fetching research publication from ${url}...`);

  const response = await authenticatedApiFetch('/api/ingest-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch paper URL' }));
    throw new Error(errorData.error || `HTTP ${response.status} fetching paper`);
  }

  onProgress?.(80, 'Processing scientific passages and citations...');
  const data = await response.json();
  onProgress?.(100, 'URL publication ingested successfully.');

  return {
    paper: data.paper,
    passages: data.passages,
    warnings: data.warnings || [],
    hasScannedPages: false,
  };
}
