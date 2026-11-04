import { z } from 'zod';
import type {
  ClaimVerification, DocumentAnalysis, DocumentClaim, DocumentPageInput, ExternalSource, PdfCitation, ResearchReport,
  ResearchRequest, ResearchStreamEvent, SearchLogEntry, StatisticalResult, Synthesis,
} from './types.ts';
import { cleanDoi, extractKeywords, findDois, jaccard, quoteAppearsIn, splitSentences, tokenize, truncate } from './text.ts';
import { enrichWebResult, lookupCrossrefDoi, mergeAndRank, runLogged, searchCrossref, searchEuropePmc, searchPubMed, searchWho } from './retrieval.ts';
import { generateJson, researchAiProvider, webSearch } from './ai.ts';

type Emit = (event: ResearchStreamEvent) => void;
const MAX_DOC_CHARS = 400_000;

const SECTION_PATTERNS: [string, RegExp][] = [
  ['Abstract', /^\s*(abstract|summary)\b/im],
  ['Introduction', /^\s*(\d\.?\s*)?(introduction|background)\b/im],
  ['Methods', /^\s*(\d\.?\s*)?(materials and methods|methods|methodology|study design)\b/im],
  ['Results', /^\s*(\d\.?\s*)?results\b/im],
  ['Discussion', /^\s*(\d\.?\s*)?discussion\b/im],
  ['Limitations', /^\s*(\d\.?\s*)?(limitations|strengths and limitations)\b/im],
  ['Conclusions', /^\s*(\d\.?\s*)?conclusions?\b/im],
  ['References', /^\s*(references|bibliography|literature cited)\b/im],
];

function detectSections(pages: DocumentPageInput[]) {
  const hits: { name: string; page: number }[] = [];
  for (const p of pages) for (const [name, re] of SECTION_PATTERNS) if (re.test(p.text) && !hits.some((h) => h.name === name)) hits.push({ name, page: p.page });
  hits.sort((a, b) => a.page - b.page);
  const last = pages[pages.length - 1]?.page || 1;
  return hits.map((h, i) => ({ name: h.name, startPage: h.page, endPage: hits[i + 1] ? Math.max(h.page, hits[i + 1].page) : last }));
}

const STAT_PATTERNS: [StatisticalResult['kind'], RegExp][] = [
  ['p_value', /\bp\s*[<=>≤≥]\s*0?\.\d+/gi],
  ['confidence_interval', /\b95\s*%\s*(?:CI|confidence interval)[,:]?\s*[-−–]?\d+(?:\.\d+)?\s*(?:to|[-−–,])\s*[-−–]?\d+(?:\.\d+)?/gi],
  ['effect_size', /\b(?:HR|OR|RR|IRR|aOR|aHR|SMD|Cohen'?s d|hazard ratio|odds ratio|relative risk)\s*[=:,]?\s*[-−–]?\d+(?:\.\d+)?/gi],
  ['mean_difference', /\b(?:mean difference|MD|WMD|difference)\s*[=:,]?\s*[-−–]?\d+(?:\.\d+)?\s*(?:kg|%|mg\/dl|mmhg|cm|points)?/gi],
  ['sample_size', /\b[nN]\s*=\s*\d{2,6}\b|\b(?!(?:19|20)\d{2}\b)\d{2,6}\s+(?:participants|patients|subjects|adults|individuals|women|men)\b/g],
];

function extractStatistics(pages: DocumentPageInput[], referencesStart: number | null): StatisticalResult[] {
  const out: StatisticalResult[] = [];
  for (const p of pages) {
    if (referencesStart && p.page >= referencesStart) break;
    const flat = p.text.replace(/\s+/g, ' ');
    for (const [kind, re] of STAT_PATTERNS) {
      for (const m of flat.matchAll(re)) {
        const start = Math.max(0, (m.index || 0) - 110);
        const context = flat.slice(start, (m.index || 0) + m[0].length + 90).trim();
        if (out.some((s) => s.page === p.page && s.value === m[0].trim())) continue;
        out.push({ page: p.page, kind, value: m[0].trim(), context: `${start > 0 ? '…' : ''}${context}…` });
        if (out.length >= 80) return out;
      }
    }
  }
  return out;
}

function findQuotePage(quote: string, pages: DocumentPageInput[], hint?: number): PdfCitation {
  const ordered = hint ? [...pages].sort((a, b) => Math.abs(a.page - hint) - Math.abs(b.page - hint)) : pages;
  for (const p of ordered) if (quoteAppearsIn(quote, p.text)) return { page: p.page, quote, verified: true };
  return { page: hint || 0, quote, verified: false };
}

/** Deterministic baseline analysis — always runs, so page-cited statistics never depend on an LLM. */
function baselineAnalysis(input: NonNullable<ResearchRequest['document']>): DocumentAnalysis {
  const pages = input.pages;
  const sections = detectSections(pages);
  const refStart = sections.find((s) => s.name === 'References')?.startPage ?? null;
  const fullText = pages.map((p) => p.text).join('\n');
  const bodyText = pages.filter((p) => !refStart || p.page < refStart).map((p) => p.text).join('\n');
  const refText = refStart ? pages.filter((p) => p.page >= refStart).map((p) => p.text).join('\n') : '';
  const refYears = (refText.match(/\b(19[5-9]\d|20[0-4]\d)\b/g) || []).map(Number);
  const firstPage = pages[0]?.text || '';
  const titleLine = firstPage.split('\n').map((l) => l.trim()).filter((l) => l.length > 25 && l.length < 220 && !/journal|doi|vol\.|issn|http|copyright|received|article/i.test(l))[0] || input.filename.replace(/\.pdf$/i, '');
  const docDoi = findDois(firstPage + '\n' + (pages[1]?.text || ''))[0] || '';
  const yearMatch = firstPage.match(/\b(19[89]\d|20[0-4]\d)\b/);

  const tableCaptions: DocumentAnalysis['tables'] = [];
  for (const p of pages) for (const m of p.text.matchAll(/^\s*(Table\s+\d+[A-Za-z]?)[.:]?\s*(.{0,160})/gim)) {
    if (!tableCaptions.some((t) => t.label.toLowerCase() === m[1].toLowerCase())) tableCaptions.push({ label: m[1], page: p.page, caption: m[2].trim() });
  }

  const limitationPage = sections.find((s) => s.name === 'Limitations') || null;
  const limitationSentences = pages
    .flatMap((p) => splitSentences(p.text).filter((s) => /\b(limitation|limited by|small sample|short duration|lack of|not powered|generaliz|bias|confound)/i.test(s)).map((s) => ({ s, page: p.page })))
    .filter((x) => !refStart || x.page < refStart)
    .slice(0, 6);

  const abstractPage = pages.slice(0, 2).map((p) => p.text).join(' ');
  const claimSentences = pages
    .filter((p) => !refStart || p.page < refStart)
    .flatMap((p) => splitSentences(p.text).map((s) => ({ s, page: p.page })))
    .filter(({ s }) => s.length < 400 && /\b(significantly|associated with|reduced|improved|increased|decreased|resulted in|led to|conclude|suggest|demonstrate)\b/i.test(s))
    .slice(0, 8);

  const claims: DocumentClaim[] = claimSentences.map(({ s, page }, i) => ({ id: `C${i + 1}`, text: s, origin: 'pdf', citations: [{ page, quote: s, verified: true }] }));
  const sampleSize = (bodyText.match(/\b[nN]\s*=\s*\d{2,6}\b|\b\d{2,6}\s+(?:participants|patients|subjects|adults)\b/) || [''])[0];

  return {
    title: titleLine, authors: 'Not extracted', journal: '', year: yearMatch?.[0] || '', doi: docDoi, metadataVerifiedBy: null,
    pageCount: input.pageCount, ocrPages: pages.filter((p) => p.method === 'ocr').map((p) => p.page),
    emptyPages: pages.filter((p) => p.text.trim().length < 20).map((p) => p.page), sections,
    summary: truncate(splitSentences(abstractPage).slice(0, 4).join(' '), 900), studyDesign: '',
    methodology: { population: '', sampleSize, intervention: '', comparator: '', outcomes: '', duration: '', setting: '', statisticalMethods: '', citations: [] },
    keyFindings: [], statistics: extractStatistics(pages, refStart), tables: tableCaptions,
    limitations: limitationSentences.map(({ s, page }) => ({ statement: s, source: limitationPage && page >= limitationPage.startPage && page <= limitationPage.endPage ? 'author_stated' : 'analyst_identified', citations: [{ page, quote: s, verified: true }] })),
    methodologicalConcerns: [], references: { count: (refText.match(/^\s*\[?\d{1,3}[.\]]\s+\S/gm) || []).length, dois: findDois(refText).slice(0, 200), newestYear: refYears.length ? Math.max(...refYears) : null },
    claims, analysisEngine: 'deterministic',
  };
  void fullText;
}

const cite = z.object({ page: z.number().int(), quote: z.string() });
const DocSchema = z.object({
  title: z.string(), authors: z.string(), journal: z.string(), year: z.string(), doi: z.string(),
  summary: z.string(), studyDesign: z.string(),
  methodology: z.object({ population: z.string(), sampleSize: z.string(), intervention: z.string(), comparator: z.string(), outcomes: z.string(), duration: z.string(), setting: z.string(), statisticalMethods: z.string(), citations: z.array(cite) }),
  keyFindings: z.array(z.object({ statement: z.string(), citations: z.array(cite) })),
  limitations: z.array(z.object({ statement: z.string(), source: z.enum(['author_stated', 'analyst_identified']), citations: z.array(cite) })),
  methodologicalConcerns: z.array(z.object({ concern: z.string(), severity: z.enum(['low', 'moderate', 'high']), citations: z.array(cite) })),
  claims: z.array(z.object({ text: z.string(), citations: z.array(cite) })),
  searchQueries: z.array(z.string()),
});

async function aiDocumentAnalysis(base: DocumentAnalysis, pages: DocumentPageInput[], focus: string) {
  let budget = MAX_DOC_CHARS;
  const corpus = pages.map((p) => {
    const text = p.text.slice(0, Math.max(0, budget));
    budget -= text.length;
    return `<<<PAGE ${p.page}${p.method === 'ocr' ? ' (OCR)' : ''}>>>\n${text}`;
  }).join('\n\n');
  const prompt = `You are a senior research methodologist. Analyse the ENTIRE paper below (page-tagged). ${focus ? `User focus: ${focus}.` : ''}
Rules:
- Use only the paper text. Every citation must give the PDF page number and a VERBATIM quote (10-40 words) copied exactly from that page.
- keyFindings: 4-8 primary results including effect sizes, CIs and p-values as reported. Read tables.
- claims: 4-8 central claims the authors make (conclusions, causal or clinical statements) that should be checked against external literature.
- limitations: author-stated ones plus ones you identify (e.g. sample size, duration, blinding, attrition, confounding, multiplicity).
- methodologicalConcerns: risk-of-bias issues with severity.
- searchQueries: 4 concise PubMed-style keyword queries (3-7 words) to find related and newer trials, systematic reviews and meta-analyses on the same question.
- Use "" for unknown fields. Never invent numbers.

PAPER:
${corpus}`;
  const ai = await generateJson(DocSchema, prompt, 120_000);
  const verify = (cs: { page: number; quote: string }[]) => cs.slice(0, 3).map((c) => findQuotePage(c.quote, pages, c.page));
  const doc: DocumentAnalysis = {
    ...base,
    title: ai.title || base.title, authors: ai.authors || base.authors, journal: ai.journal || base.journal, year: ai.year || base.year,
    doi: cleanDoi(base.doi || ai.doi || ''), summary: ai.summary || base.summary, studyDesign: ai.studyDesign,
    methodology: { ...ai.methodology, citations: verify(ai.methodology.citations) },
    keyFindings: ai.keyFindings.map((f) => ({ statement: f.statement, citations: verify(f.citations) })),
    limitations: ai.limitations.length ? ai.limitations.map((l) => ({ ...l, citations: verify(l.citations) })) : base.limitations,
    methodologicalConcerns: ai.methodologicalConcerns.map((m) => ({ ...m, citations: verify(m.citations) })),
    claims: ai.claims.length ? ai.claims.map((c, i) => ({ id: `C${i + 1}`, text: c.text, origin: 'pdf', citations: verify(c.citations) })) : base.claims,
    analysisEngine: 'ai',
  };
  return { doc, queries: ai.searchQueries.filter(Boolean).slice(0, 4) };
}

const VerifySchema = z.object({
  verifications: z.array(z.object({
    claimId: z.string(), verdict: z.enum(['supported', 'partially_supported', 'contradicted', 'insufficient']),
    confidence: z.enum(['low', 'moderate', 'high']), rationale: z.string(),
    evidence: z.array(z.object({ sourceId: z.string(), stance: z.enum(['supports', 'contradicts', 'qualifies']), excerpt: z.string() })),
  })),
  synthesis: z.object({
    currentConsensus: z.string(),
    evidenceStrength: z.object({ grade: z.enum(['high', 'moderate', 'low', 'very_low']), rationale: z.string() }),
    comparisons: z.array(z.object({ sourceId: z.string(), relationship: z.enum(['agrees', 'disagrees', 'extends', 'supersedes', 'context']), summary: z.string() })),
    outdatedConclusions: z.array(z.object({ statement: z.string(), rationale: z.string(), sourceIds: z.array(z.string()) })),
    methodologicalWeaknesses: z.array(z.object({ weakness: z.string(), rationale: z.string(), sourceIds: z.array(z.string()) })),
    researchGaps: z.array(z.object({ gap: z.string(), type: z.enum(['population', 'methodology', 'outcome', 'duration', 'mechanism', 'replication', 'other']), rationale: z.string(), sourceIds: z.array(z.string()) })),
  }),
});

function sourceBlock(s: ExternalSource) {
  return `[${s.id}] ${s.title} | ${s.journal} ${s.year ?? ''} | ${s.evidenceType}${s.pmid ? ` | PMID ${s.pmid}` : ''}${s.doi ? ` | DOI ${s.doi}` : ''}\n${s.contentOrigin === 'metadata_only' ? '(no abstract available — do not use as evidence)' : s.abstract}`;
}

/** Drop any citation to an unknown source, verify excerpts against retrieved text, and downgrade unsupported verdicts. */
export function validateVerification(raw: z.infer<typeof VerifySchema>, claims: DocumentClaim[], sources: ExternalSource[], external: boolean) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const usable = (id: string) => { const s = byId.get(id); return s && s.contentOrigin !== 'metadata_only' ? s : null; };
  const verifications: ClaimVerification[] = claims.map((claim) => {
    const r = raw.verifications.find((v) => v.claimId === claim.id);
    if (!r) return { claimId: claim.id, claim: claim.text, verdict: 'insufficient', confidence: 'low', rationale: 'The analyst did not return an assessment for this claim.', pdfEvidence: claim.citations, externalEvidence: [], engine: 'ai' };
    const evidence = external ? r.evidence.filter((e) => usable(e.sourceId)).map((e) => ({ ...e, excerptVerified: quoteAppearsIn(e.excerpt, usable(e.sourceId)!.abstract) })) : [];
    let verdict = r.verdict;
    let rationale = r.rationale;
    if (external && verdict !== 'insufficient' && !evidence.some((e) => e.excerptVerified)) {
      verdict = 'insufficient';
      rationale = `${rationale} [Downgraded: no cited excerpt could be verified in a retrieved abstract.]`;
    }
    return { claimId: claim.id, claim: claim.text, verdict, confidence: verdict === r.verdict ? r.confidence : 'low', rationale, pdfEvidence: claim.citations, externalEvidence: evidence, engine: 'ai' };
  });
  const ids = (list: string[]) => list.filter((id) => byId.has(id));
  const s = raw.synthesis;
  const synthesis: Synthesis = {
    currentConsensus: s.currentConsensus, evidenceStrength: s.evidenceStrength,
    comparisons: s.comparisons.filter((c) => byId.has(c.sourceId)),
    outdatedConclusions: s.outdatedConclusions.map((o) => ({ ...o, sourceIds: ids(o.sourceIds) })).filter((o) => !external || o.sourceIds.length),
    methodologicalWeaknesses: s.methodologicalWeaknesses.map((m) => ({ ...m, sourceIds: ids(m.sourceIds) })),
    researchGaps: s.researchGaps.map((g) => ({ ...g, sourceIds: ids(g.sourceIds) })),
    engine: 'ai',
  };
  return { verifications, synthesis };
}

function deterministicVerification(claims: DocumentClaim[], sources: ExternalSource[]): ClaimVerification[] {
  return claims.map((claim) => {
    const ct = tokenize(claim.text);
    const related = sources.filter((s) => s.contentOrigin !== 'metadata_only').map((s) => ({ s, score: jaccard(ct, tokenize(s.abstract)) })).sort((a, b) => b.score - a.score).slice(0, 3).filter((x) => x.score > 0.04);
    return {
      claimId: claim.id, claim: claim.text, verdict: 'insufficient', confidence: 'low',
      rationale: `Automated reasoning was unavailable, so no verdict was assigned. ${related.length ? `Most topically related retrieved sources: ${related.map((r) => r.s.id).join(', ')} — review them manually.` : 'No closely related retrieved abstracts were found.'}`,
      pdfEvidence: claim.citations, externalEvidence: [], engine: 'deterministic',
    };
  });
}

export async function runResearchPipeline(request: ResearchRequest, emit: Emit): Promise<ResearchReport> {
  const started = Date.now();
  const warnings: string[] = [];
  const searchLog: SearchLogEntry[] = [];
  const warn = (message: string) => { warnings.push(message); emit({ type: 'warning', message }); };
  const useDoc = request.mode !== 'web' && !!request.document?.pages.length;
  const useWeb = request.mode !== 'pdf';
  const focus = (request.query || '').trim().slice(0, 500);
  let aiAvailable = true;
  let document: DocumentAnalysis | null = null;
  let queries: string[] = [];

  if (useDoc) {
    emit({ type: 'progress', stage: 'document', message: `Analysing ${request.document!.pages.length} pages…`, percent: 8 });
    document = baselineAnalysis(request.document!);
    try {
      const ai = await aiDocumentAnalysis(document, request.document!.pages, focus);
      document = ai.doc; queries = ai.queries;
      const unverified = [...document.keyFindings, ...document.claims].flatMap((x) => x.citations).filter((c) => !c.verified).length;
      if (unverified) warn(`${unverified} AI-proposed PDF quote(s) could not be located in the extracted text and are marked unverified.`);
    } catch (error) {
      aiAvailable = false;
      warn(`AI document analysis unavailable (${error instanceof Error ? error.message.slice(0, 140) : 'error'}). Showing deterministic page-cited extraction only.`);
    }
    emit({ type: 'progress', stage: 'metadata', message: 'Verifying bibliographic metadata with Crossref…', percent: 30 });
    if (document.doi) {
      const cr = await lookupCrossrefDoi(document.doi);
      if (cr) Object.assign(document, { title: cr.title || document.title, authors: cr.authors || document.authors, journal: cr.journal || document.journal, year: cr.year ? String(cr.year) : document.year, metadataVerifiedBy: 'crossref' });
    } else {
      const cr = (await searchCrossref(document.title, { max: 1 }).catch(() => []))[0];
      if (cr && jaccard(tokenize(cr.title), tokenize(document.title)) > 0.6) Object.assign(document, { title: cr.title, authors: cr.authors, journal: cr.journal, year: String(cr.year ?? document.year), doi: cr.doi, metadataVerifiedBy: 'crossref' });
    }
  }

  const userClaims: DocumentClaim[] = (request.claims || []).map((c) => c.trim()).filter((c) => c.length > 8).slice(0, 10).map((text, i) => ({ id: `U${i + 1}`, text, origin: 'user', citations: [] }));
  const claims = [...(document?.claims || []), ...userClaims].slice(0, 12);

  let sources: ExternalSource[] = [];
  if (useWeb) {
    emit({ type: 'progress', stage: 'queries', message: 'Building literature search strategy…', percent: 36 });
    const topicSeed = [focus, document?.title, document?.summary].filter(Boolean).join(' ');
    if (!queries.length) {
      const titleTerms = tokenize(document?.title || '').filter((t) => !['pilot', 'clinical', 'randomized', 'randomised', 'controlled'].includes(t)).slice(0, 6).join(' ');
      const kw = extractKeywords(topicSeed || claims.map((c) => c.text).join(' '), 6);
      queries = [focus, titleTerms, kw.slice(0, 3).join(' ')].filter((q) => q && q.length > 3);
    }
    if (focus && !queries.includes(focus)) queries.unshift(focus);
    queries = [...new Set(queries)].slice(0, 4);
    const docYear = Number(document?.year) || null;
    const primary = queries[0];

    emit({ type: 'progress', stage: 'search', message: 'Searching PubMed, Europe PMC, Crossref, WHO and the web…', percent: 45 });
    const tasks: Promise<any>[] = [];
    for (const q of queries.slice(0, 3)) {
      tasks.push(runLogged(searchLog, 'pubmed', `${q} AND (systematic review[pt] OR meta-analysis[pt])`, () => searchPubMed(`${q} AND (systematic review[pt] OR meta-analysis[pt])`, { max: 5 })));
      tasks.push(runLogged(searchLog, 'pubmed', q, () => searchPubMed(q, { max: 5, minYear: docYear || undefined })));
      tasks.push(runLogged(searchLog, 'europepmc', q, () => searchEuropePmc(q, { max: 6 })));
    }
    tasks.push(runLogged(searchLog, 'crossref', primary, () => searchCrossref(primary, { max: 5, minYear: docYear || undefined })));
    tasks.push(runLogged(searchLog, 'who', primary, () => searchWho(primary, { max: 3 })));
    tasks.push((async () => {
      try {
        const hits = await webSearch(`Find peer-reviewed research, systematic reviews, meta-analyses and WHO guidance relevant to: ${topicSeed.slice(0, 600) || primary}${docYear ? `, especially published after ${docYear}` : ''}.`, queries, ['pubmed.ncbi.nlm.nih.gov', 'europepmc.org', 'who.int', 'nejm.org', 'thelancet.com', 'bmj.com', 'jamanetwork.com', 'nature.com', 'cochranelibrary.com', 'mdpi.com', 'frontiersin.org', 'sciencedirect.com', 'springer.com', 'wiley.com']);
        const enriched = (await Promise.all(hits.slice(0, 8).map((h) => enrichWebResult(h.url, h.title).catch(() => null)))).filter(Boolean);
        searchLog.push({ provider: 'web', query: primary, returned: enriched.length, status: 'ok', detail: `${hits.length} hits, ${enriched.length} resolved to real records` });
        return enriched;
      } catch (error) {
        searchLog.push({ provider: 'web', query: primary, returned: 0, status: 'error', detail: error instanceof Error ? error.message.slice(0, 120) : 'failed' });
        return [];
      }
    })());
    const drafts = (await Promise.all(tasks)).flat();
    emit({ type: 'progress', stage: 'abstracts', message: `Merging ${drafts.length} records and ranking by evidence level…`, percent: 62 });
    sources = mergeAndRank(drafts, { topicText: `${topicSeed} ${claims.map((c) => c.text).join(' ')}`, documentYear: docYear, documentDoi: document?.doi || '', documentTitle: document?.title || '', limit: 18 });
    if (!sources.length) warn('No external records were retrieved. Check connectivity or broaden the query.');
    if (searchLog.some((l) => l.status === 'error')) warn(`Some searches failed: ${searchLog.filter((l) => l.status === 'error').map((l) => `${l.provider} (${l.detail})`).join('; ')}`);
  }

  emit({ type: 'progress', stage: 'verification', message: `Cross-checking ${claims.length} claims…`, percent: 72 });
  let verifications: ClaimVerification[] = [];
  let synthesis: Synthesis | null = null;
  if (claims.length || sources.length) {
    try {
      if (!aiAvailable && useDoc) throw new Error('AI unavailable earlier in this run');
      const docContext = document ? `PAPER: ${document.title} (${document.year}). Design: ${document.studyDesign}. Population: ${document.methodology.population}. n: ${document.methodology.sampleSize}. Duration: ${document.methodology.duration}.\nKey findings:\n${document.keyFindings.map((f) => `- ${f.statement} (p.${f.citations[0]?.page ?? '?'})`).join('\n')}\nLimitations:\n${document.limitations.map((l) => `- ${l.statement}`).join('\n')}\n` : `RESEARCH QUESTION: ${focus}\n`;
      const prompt = `You are an independent evidence reviewer. ${useWeb ? 'Cross-check each claim against the EXTERNAL SOURCES below (retrieved live from PubMed, Europe PMC, Crossref, WHO and the web).' : 'PDF-only mode: judge each claim ONLY against the paper\'s own reported data (are conclusions justified by its results/methods?). Leave evidence arrays empty and sourceIds empty.'}
Verdicts: supported | partially_supported | contradicted | insufficient. Prefer higher evidence levels (meta-analyses, systematic reviews, RCTs, guidelines) and newer work. If sources do not address a claim, use "insufficient".
For each evidence item copy a VERBATIM excerpt (10-40 words) from that source's abstract. Cite only listed source ids. Never invent studies.
Synthesis: what the current literature actually indicates, GRADE-style evidence strength, per-source comparisons with the paper, conclusions that newer evidence has made outdated, methodological weaknesses, and concrete research gaps.

${docContext}
CLAIMS:
${claims.map((c) => `[${c.id}] ${c.text}`).join('\n')}

EXTERNAL SOURCES:
${sources.map(sourceBlock).join('\n\n') || '(none)'}`;
      const raw = await generateJson(VerifySchema, prompt, 120_000);
      ({ verifications, synthesis } = validateVerification(raw, claims, sources, useWeb));
      emit({ type: 'progress', stage: 'synthesis', message: 'Validating citations and building report…', percent: 92 });
    } catch (error) {
      aiAvailable = false;
      if (!warnings.some((w) => w.startsWith('AI'))) warn(`AI verification unavailable (${error instanceof Error ? error.message.slice(0, 140) : 'error'}). Claims are listed without verdicts.`);
      verifications = deterministicVerification(claims, sources);
    }
  }

  emit({ type: 'progress', stage: 'complete', message: 'Report ready.', percent: 100 });
  return {
    id: `rr_${Date.now().toString(36)}`, mode: request.mode, query: focus, createdAt: new Date().toISOString(), document, sources, searchLog,
    verifications, synthesis, warnings, aiProvider: researchAiProvider, aiAvailable, durationMs: Date.now() - started,
  };
}
