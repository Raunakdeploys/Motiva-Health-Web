/**
 * Shared contract between the research analyst backend and the workspace UI.
 * Every external statement carries a source id that resolves to a retrieved record;
 * every PDF statement carries a page number and, where possible, a verified quote.
 */

export type ResearchMode = 'pdf' | 'web' | 'combined';

export type PageExtractionMethod = 'text' | 'ocr' | 'library';

export interface DocumentPageInput {
  page: number;
  text: string;
  method: PageExtractionMethod;
}

export interface ResearchDocumentInput {
  filename: string;
  pageCount: number;
  pages: DocumentPageInput[];
}

export interface ResearchRequest {
  mode: ResearchMode;
  /** Research question; required for web mode, optional focus for the others. */
  query?: string;
  /** User-supplied claims to verify, one per entry (web mode, or extra claims for PDF modes). */
  claims?: string[];
  document?: ResearchDocumentInput;
}

export interface PdfCitation {
  page: number;
  quote: string;
  /** True only when the quote was located in the extracted page text. */
  verified: boolean;
}

export interface StatisticalResult {
  page: number;
  kind: 'p_value' | 'confidence_interval' | 'effect_size' | 'sample_size' | 'percentage' | 'mean_difference';
  value: string;
  context: string;
}

export interface DocumentSection {
  name: string;
  startPage: number;
  endPage: number;
}

export interface DocumentFinding {
  statement: string;
  citations: PdfCitation[];
}

export interface DocumentClaim {
  id: string;
  text: string;
  origin: 'pdf' | 'user';
  citations: PdfCitation[];
}

export interface DocumentAnalysis {
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi: string;
  metadataVerifiedBy: 'crossref' | 'europepmc' | null;
  pageCount: number;
  ocrPages: number[];
  emptyPages: number[];
  sections: DocumentSection[];
  summary: string;
  studyDesign: string;
  methodology: {
    population: string;
    sampleSize: string;
    intervention: string;
    comparator: string;
    outcomes: string;
    duration: string;
    setting: string;
    statisticalMethods: string;
    citations: PdfCitation[];
  };
  keyFindings: DocumentFinding[];
  statistics: StatisticalResult[];
  tables: { label: string; page: number; caption: string }[];
  limitations: { statement: string; source: 'author_stated' | 'analyst_identified'; citations: PdfCitation[] }[];
  methodologicalConcerns: { concern: string; severity: 'low' | 'moderate' | 'high'; citations: PdfCitation[] }[];
  references: { count: number; dois: string[]; newestYear: number | null };
  claims: DocumentClaim[];
  analysisEngine: 'ai' | 'deterministic';
}

export type EvidenceType =
  | 'meta_analysis'
  | 'systematic_review'
  | 'guideline'
  | 'rct'
  | 'cohort'
  | 'case_control'
  | 'cross_sectional'
  | 'review'
  | 'other';

export type SourceProvider = 'pubmed' | 'europepmc' | 'crossref' | 'who' | 'web';

export interface ExternalSource {
  /** Stable id used in citations, e.g. S3. */
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number | null;
  publicationDate: string;
  doi: string;
  pmid: string;
  pmcid: string;
  url: string;
  abstract: string;
  /** Where the abstract/content came from. Snippet-only records are never used for verification. */
  contentOrigin: 'abstract' | 'page_content' | 'metadata_only';
  evidenceType: EvidenceType;
  publicationTypes: string[];
  providers: SourceProvider[];
  citedByCount: number | null;
  isNewerThanDocument: boolean;
  relevance: number;
}

export type ClaimVerdict = 'supported' | 'partially_supported' | 'contradicted' | 'insufficient';

export interface SourceEvidence {
  sourceId: string;
  stance: 'supports' | 'contradicts' | 'qualifies';
  excerpt: string;
  /** True only when the excerpt was found verbatim (normalised) in the retrieved abstract/content. */
  excerptVerified: boolean;
}

export interface ClaimVerification {
  claimId: string;
  claim: string;
  verdict: ClaimVerdict;
  confidence: 'low' | 'moderate' | 'high';
  rationale: string;
  pdfEvidence: PdfCitation[];
  externalEvidence: SourceEvidence[];
  engine: 'ai' | 'deterministic';
}

export interface EvidenceComparison {
  sourceId: string;
  relationship: 'agrees' | 'disagrees' | 'extends' | 'supersedes' | 'context';
  summary: string;
}

export interface ResearchGap {
  gap: string;
  type: 'population' | 'methodology' | 'outcome' | 'duration' | 'mechanism' | 'replication' | 'other';
  rationale: string;
  sourceIds: string[];
}

export interface Synthesis {
  currentConsensus: string;
  evidenceStrength: {
    grade: 'high' | 'moderate' | 'low' | 'very_low';
    rationale: string;
  };
  comparisons: EvidenceComparison[];
  outdatedConclusions: { statement: string; rationale: string; sourceIds: string[] }[];
  methodologicalWeaknesses: { weakness: string; rationale: string; sourceIds: string[] }[];
  researchGaps: ResearchGap[];
  engine: 'ai' | 'deterministic';
}

export interface SearchLogEntry {
  provider: SourceProvider;
  query: string;
  returned: number;
  status: 'ok' | 'error' | 'skipped';
  detail?: string;
}

export interface ResearchReport {
  id: string;
  mode: ResearchMode;
  query: string;
  createdAt: string;
  document: DocumentAnalysis | null;
  sources: ExternalSource[];
  searchLog: SearchLogEntry[];
  verifications: ClaimVerification[];
  synthesis: Synthesis | null;
  warnings: string[];
  aiProvider: string;
  aiAvailable: boolean;
  durationMs: number;
}

export type ResearchStage =
  | 'document'
  | 'metadata'
  | 'queries'
  | 'search'
  | 'abstracts'
  | 'verification'
  | 'synthesis'
  | 'complete';

export type ResearchStreamEvent =
  | { type: 'progress'; stage: ResearchStage; message: string; percent: number }
  | { type: 'warning'; message: string }
  | { type: 'report'; report: ResearchReport }
  | { type: 'error'; message: string };
