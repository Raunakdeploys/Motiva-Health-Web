import type { EvidenceType, ExternalSource, SearchLogEntry, SourceProvider } from './types.ts';
import { cleanDoi, decodeXmlEntities, findDois, stripHtml, titleSimilarity, tokenize, jaccard, truncate } from './text.ts';

const UA = 'SteerHealthResearchAnalyst/1.0 (mailto:research@steerhealth.app)';
const MAX_BODY_BYTES = 2_000_000;

type Draft = Omit<ExternalSource, 'id' | 'relevance' | 'isNewerThanDocument'>;

/** Fetch with timeout and a hard response-size cap to stay inside Render's 512 MB budget. */
export async function boundedFetch(url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<{ ok: boolean; status: number; text: string; url: string; headers: Headers }> {
  const response = await fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, Accept: '*/*', ...(init.headers || {}) },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: init.redirect ?? 'follow',
  });
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); break; }
      chunks.push(value);
    }
  }
  return { ok: response.ok, status: response.status, text: Buffer.concat(chunks).toString('utf8'), url: response.url, headers: response.headers };
}

/** Serialises requests per host (NCBI allows ~3/s without a key) and retries once on 429/503. */
const hostQueues = new Map<string, Promise<unknown>>();
const HOST_GAP_MS: Record<string, number> = { 'eutils.ncbi.nlm.nih.gov': process.env.NCBI_API_KEY ? 120 : 380, 'www.ebi.ac.uk': 250, 'api.crossref.org': 150 };

function throttled<T>(url: string, task: () => Promise<T>): Promise<T> {
  const host = new URL(url).hostname;
  const gap = HOST_GAP_MS[host] ?? 0;
  const previous = hostQueues.get(host) || Promise.resolve();
  const run = previous.catch(() => undefined).then(async () => {
    try { return await task(); } finally { if (gap) await new Promise((r) => setTimeout(r, gap)); }
  });
  hostQueues.set(host, run);
  return run;
}

export async function politeFetch(url: string, init: RequestInit = {}, timeoutMs?: number) {
  for (let attempt = 0; ; attempt++) {
    const res = await throttled(url, () => boundedFetch(url, init, timeoutMs));
    if ((res.status === 429 || res.status === 503) && attempt < 2) { await new Promise((r) => setTimeout(r, 1200 * (attempt + 1))); continue; }
    return res;
  }
}

async function fetchJson(url: string, timeoutMs?: number): Promise<any> {
  const res = await politeFetch(url, { headers: { Accept: 'application/json' } }, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return JSON.parse(res.text);
}

export function classifyEvidence(types: string[], title: string): EvidenceType {
  const t = `${types.join(' ')} ${title}`.toLowerCase();
  if (/meta-analy|meta analy/.test(t)) return 'meta_analysis';
  if (/systematic review|umbrella review/.test(t)) return 'systematic_review';
  if (/guideline|practice guideline|recommendation|consensus statement/.test(t)) return 'guideline';
  if (/randomi[sz]ed controlled trial|randomi[sz]ed|clinical trial, phase/.test(t)) return 'rct';
  if (/cohort|prospective|longitudinal/.test(t)) return 'cohort';
  if (/case-control|case control/.test(t)) return 'case_control';
  if (/cross-sectional|survey/.test(t)) return 'cross_sectional';
  if (/review/.test(t)) return 'review';
  return 'other';
}

const xmlTag = (xml: string, tag: string) => {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decodeXmlEntities(m[1].replace(/<[^>]+>/g, '')).trim() : '';
};
const xmlAll = (xml: string, tag: string) =>
  [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => decodeXmlEntities(m[1].replace(/<[^>]+>/g, '')).trim());

/** PubMed: esearch for ids, then efetch XML for full abstracts and publication types. */
export async function searchPubMed(query: string, opts: { max?: number; minYear?: number } = {}): Promise<Draft[]> {
  const params = new URLSearchParams({ db: 'pubmed', term: query, retmax: String(opts.max ?? 8), retmode: 'json', sort: 'relevance' });
  if (opts.minYear) { params.set('mindate', String(opts.minYear)); params.set('maxdate', '3000'); params.set('datetype', 'pdat'); }
  if (process.env.NCBI_API_KEY) params.set('api_key', process.env.NCBI_API_KEY);
  const search = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`);
  const ids: string[] = search.esearchresult?.idlist || [];
  if (!ids.length) return [];
  return fetchPubMedRecords(ids);
}

export async function fetchPubMedRecords(ids: string[]): Promise<Draft[]> {
  const key = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : '';
  const res = await politeFetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml${key}`, {}, 20_000);
  if (!res.ok) throw new Error(`efetch HTTP ${res.status}`);
  const articles = res.text.split('<PubmedArticle>').slice(1);
  return articles.map((xml) => {
    const pmid = xmlTag(xml, 'PMID');
    const title = xmlTag(xml, 'ArticleTitle');
    const abstract = xmlAll(xml, 'AbstractText').join(' ').replace(/\s+/g, ' ');
    const lastNames = xmlAll(xml, 'LastName');
    const year = Number(xmlTag(xml.split('<PubDate>')[1] || '', 'Year') || (xmlTag(xml, 'MedlineDate').match(/\d{4}/)?.[0] ?? '')) || null;
    const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
    const pmcMatch = xml.match(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/);
    const pubTypes = xmlAll(xml, 'PublicationType');
    return {
      title, abstract,
      authors: lastNames.slice(0, 3).join(', ') + (lastNames.length > 3 ? ' et al.' : ''),
      journal: xmlTag(xml, 'Title') || xmlTag(xml, 'ISOAbbreviation'),
      year, publicationDate: year ? String(year) : '',
      doi: doiMatch ? cleanDoi(doiMatch[1]) : '', pmid, pmcid: pmcMatch?.[1] || '',
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      contentOrigin: abstract.length > 80 ? 'abstract' : 'metadata_only',
      evidenceType: classifyEvidence(pubTypes, title), publicationTypes: pubTypes,
      providers: ['pubmed'] as SourceProvider[], citedByCount: null,
    };
  }).filter((d) => d.title);
}

/** Europe PMC core results include abstracts, publication types, and citation counts. */
export async function searchEuropePmc(query: string, opts: { max?: number; minYear?: number } = {}): Promise<Draft[]> {
  const q = opts.minYear ? `(${query}) AND PUB_YEAR:[${opts.minYear} TO 3000]` : query;
  const data = await fetchJson(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&resultType=core&pageSize=${opts.max ?? 8}&sort=RELEVANCE`, 20_000);
  return (data.resultList?.result || []).map((r: any) => {
    const pubTypes: string[] = r.pubTypeList?.pubType || [];
    const abstract = stripHtml(r.abstractText || '');
    const url = r.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/` : r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/${r.source}/${r.id}`;
    return {
      title: stripHtml(r.title || '').replace(/\.$/, ''), abstract,
      authors: truncate(r.authorString || '', 120), journal: r.journalInfo?.journal?.title || r.bookOrReportDetails?.publisher || '',
      year: Number(r.pubYear) || null, publicationDate: r.firstPublicationDate || r.pubYear || '',
      doi: r.doi ? cleanDoi(r.doi) : '', pmid: r.pmid || '', pmcid: r.pmcid || '', url,
      contentOrigin: abstract.length > 80 ? 'abstract' : 'metadata_only',
      evidenceType: classifyEvidence(pubTypes, r.title || ''), publicationTypes: pubTypes,
      providers: ['europepmc'] as SourceProvider[], citedByCount: typeof r.citedByCount === 'number' ? r.citedByCount : null,
    };
  });
}

function crossrefToDraft(item: any): Draft {
  const title = (item.title?.[0] || '').replace(/<[^>]+>/g, '');
  const year = item.issued?.['date-parts']?.[0]?.[0] || item.published?.['date-parts']?.[0]?.[0] || null;
  const abstract = item.abstract ? stripHtml(item.abstract).replace(/^abstract\s*/i, '') : '';
  const authors = (item.author || []).map((a: any) => a.family || a.name).filter(Boolean);
  return {
    title, abstract, authors: authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : ''),
    journal: item['container-title']?.[0] || item.publisher || '', year,
    publicationDate: (item.issued?.['date-parts']?.[0] || []).join('-'), doi: cleanDoi(item.DOI || ''), pmid: '', pmcid: '',
    url: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || '',
    contentOrigin: abstract.length > 80 ? 'abstract' : 'metadata_only',
    evidenceType: classifyEvidence([item.type || ''], title), publicationTypes: [item.type || ''].filter(Boolean),
    providers: ['crossref'], citedByCount: item['is-referenced-by-count'] ?? null,
  };
}

export async function searchCrossref(query: string, opts: { max?: number; minYear?: number } = {}): Promise<Draft[]> {
  const filter = ['type:journal-article', opts.minYear ? `from-pub-date:${opts.minYear}` : ''].filter(Boolean).join(',');
  const data = await fetchJson(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=${opts.max ?? 6}&filter=${filter}&select=DOI,title,author,issued,container-title,publisher,abstract,type,is-referenced-by-count,URL`, 20_000);
  return (data.message?.items || []).map(crossrefToDraft).filter((d: Draft) => d.title);
}

export async function lookupCrossrefDoi(doi: string): Promise<Draft | null> {
  try {
    const data = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, 12_000);
    return data.message ? crossrefToDraft(data.message) : null;
  } catch { return null; }
}

/** WHO Institutional Repository (IRIS, DSpace 7) — official WHO documents with abstracts. */
export async function searchWho(query: string, opts: { max?: number } = {}): Promise<Draft[]> {
  const data = await fetchJson(`https://iris.who.int/server/api/discover/search/objects?query=${encodeURIComponent(query)}&size=${opts.max ?? 4}&dsoType=ITEM`, 20_000);
  const objects = data._embedded?.searchResult?._embedded?.objects || [];
  return objects.map((o: any) => {
    const m = o._embedded?.indexableObject?.metadata || {};
    const v = (k: string) => (m[k] || []).map((x: any) => x.value);
    const title = v('dc.title')[0] || '';
    const abstract = (v('dc.description.abstract')[0] || '').replace(/\s+/g, ' ');
    const issued = v('dc.date.issued')[0] || '';
    const types = [...v('dc.type'), ...v('dc.subject')];
    return {
      title, abstract, authors: v('dc.contributor.author').slice(0, 2).join('; ') || 'World Health Organization',
      journal: v('dc.publisher')[0] || 'World Health Organization', year: Number(issued.slice(0, 4)) || null, publicationDate: issued,
      doi: '', pmid: '', pmcid: '', url: v('dc.identifier.uri')[0] || `https://iris.who.int/handle/${o._embedded?.indexableObject?.handle}`,
      contentOrigin: abstract.length > 80 ? 'abstract' : 'metadata_only',
      evidenceType: types.join(' ').toLowerCase().includes('guideline') ? 'guideline' : classifyEvidence(types, title),
      publicationTypes: types.slice(0, 4), providers: ['who'] as SourceProvider[], citedByCount: null,
    } as Draft;
  }).filter((d: Draft) => d.title);
}

/**
 * Turns a web search hit into a real record: resolve DOI -> Europe PMC/Crossref abstract, otherwise
 * read the page's citation meta tags and body text. Search snippets are never stored as content.
 */
export async function enrichWebResult(url: string, fallbackTitle: string): Promise<Draft | null> {
  let finalUrl = url;
  let html = '';
  try {
    const res = await boundedFetch(url, { headers: { Accept: 'text/html' } }, 12_000);
    finalUrl = res.url || url;
    if (res.ok && (res.headers.get('content-type') || '').includes('html')) html = res.text;
  } catch { /* fall through to DOI-in-URL */ }

  const meta = (name: string) => {
    const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, 'i');
    const m = html.match(re);
    return m ? decodeXmlEntities(m[1] || m[2]).trim() : '';
  };
  const doi = cleanDoi(meta('citation_doi') || meta('dc.identifier') || findDois(finalUrl)[0] || '');
  if (doi.startsWith('10.')) {
    try {
      const epmc = await searchEuropePmc(`DOI:"${doi}"`, { max: 1 });
      if (epmc[0]?.abstract) return { ...epmc[0], providers: ['web', 'europepmc'] };
    } catch { /* try crossref */ }
    const cr = await lookupCrossrefDoi(doi);
    if (cr && cr.contentOrigin === 'abstract') return { ...cr, providers: ['web', 'crossref'] };
    if (cr && !html) return { ...cr, providers: ['web', 'crossref'] };
  }
  if (!html) return null;
  const body = stripHtml(html);
  const title = meta('citation_title') || meta('og:title') || (html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? fallbackTitle);
  const date = meta('citation_publication_date') || meta('citation_date') || meta('article:published_time') || meta('dc.date');
  const pageText = (meta('citation_abstract') || meta('description') + '\n' + body).slice(0, 5000);
  const host = new URL(finalUrl).hostname;
  return {
    title: decodeXmlEntities(title).trim(), abstract: pageText, authors: meta('citation_author') || host,
    journal: meta('citation_journal_title') || (host.endsWith('who.int') ? 'World Health Organization' : host),
    year: Number((date.match(/\d{4}/) || [])[0]) || null, publicationDate: date, doi: doi.startsWith('10.') ? doi : '',
    pmid: '', pmcid: '', url: finalUrl, contentOrigin: pageText.length > 200 ? 'page_content' : 'metadata_only',
    evidenceType: host.endsWith('who.int') ? 'guideline' : classifyEvidence([], title), publicationTypes: [],
    providers: [host.endsWith('who.int') ? 'who' : 'web'], citedByCount: null,
  };
}

const EVIDENCE_WEIGHT: Record<EvidenceType, number> = {
  meta_analysis: 1, systematic_review: 0.9, guideline: 0.85, rct: 0.8, cohort: 0.6, case_control: 0.5, cross_sectional: 0.45, review: 0.5, other: 0.35,
};

/** Merge duplicates across providers (DOI, PMID, or near-identical title), then rank. */
export function mergeAndRank(drafts: Draft[], ctx: { topicText: string; documentYear: number | null; documentDoi: string; documentTitle: string; limit: number }): ExternalSource[] {
  const merged: Draft[] = [];
  for (const d of drafts) {
    const existing = merged.find((m) => (d.doi && m.doi === d.doi) || (d.pmid && m.pmid === d.pmid) || titleSimilarity(m.title, d.title) > 0.85);
    if (!existing) { merged.push({ ...d }); continue; }
    existing.providers = [...new Set([...existing.providers, ...d.providers])];
    if (d.abstract.length > existing.abstract.length && d.contentOrigin !== 'metadata_only') { existing.abstract = d.abstract; existing.contentOrigin = d.contentOrigin; }
    existing.doi ||= d.doi; existing.pmid ||= d.pmid; existing.pmcid ||= d.pmcid; existing.citedByCount ??= d.citedByCount;
    if (existing.evidenceType === 'other' || EVIDENCE_WEIGHT[d.evidenceType] > EVIDENCE_WEIGHT[existing.evidenceType]) existing.evidenceType = d.evidenceType;
    existing.publicationTypes = [...new Set([...existing.publicationTypes, ...d.publicationTypes])];
  }
  const topic = tokenize(ctx.topicText);
  const nowYear = new Date().getFullYear();
  return merged
    .filter((d) => !(ctx.documentDoi && d.doi === ctx.documentDoi) && !(ctx.documentTitle && titleSimilarity(d.title, ctx.documentTitle) > 0.8))
    .map((d) => {
      const overlap = jaccard(topic, tokenize(`${d.title} ${d.title} ${d.abstract.slice(0, 1500)}`));
      const recency = d.year ? Math.max(0, 1 - (nowYear - d.year) / 15) : 0.2;
      const content = d.contentOrigin === 'metadata_only' ? 0 : 1;
      const relevance = Math.round((overlap * 4 + EVIDENCE_WEIGHT[d.evidenceType] * 0.9 + recency * 0.5 + content * 0.6) * 100) / 100;
      return { ...d, relevance, isNewerThanDocument: !!(ctx.documentYear && d.year && d.year > ctx.documentYear) };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, ctx.limit)
    .map((d, i) => ({ ...d, id: `S${i + 1}`, abstract: truncate(d.abstract, 3500) }));
}

export async function runLogged(log: SearchLogEntry[], provider: SourceProvider, query: string, fn: () => Promise<Draft[]>): Promise<Draft[]> {
  try {
    const results = await fn();
    log.push({ provider, query, returned: results.length, status: 'ok' });
    return results;
  } catch (error) {
    log.push({ provider, query, returned: 0, status: 'error', detail: error instanceof Error ? error.message : 'failed' });
    return [];
  }
}
