const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves
  study studies patient patients participants subjects group groups result results method methods conclusion conclusions background objective objectives aim aims however therefore thus using used use based may might significant significantly compared comparison versus vs among within total respectively including included associated association effect effects data analysis analyses trial trials paper article research evidence found showed show shows observed per et al fig figure table tables mean median sd ci p n years year weeks week day days months month baseline difference differences level levels high low higher lower increased decreased increase decrease reduced reduction rate rates two three one four five six first second new`
    .split(/\s+/)
    .filter(Boolean)
);

export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    .toLowerCase()
    .replace(/[^a-z0-9%.<>=±+\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  return normalizeForMatch(input)
    .split(' ')
    .map((token) => token.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token) && !/^\d+(\.\d+)?%?$/.test(token));
}

/**
 * Locates a quote inside a haystack. Exact normalised containment passes; otherwise we accept
 * a contiguous window whose token overlap is >= 85%, which tolerates hyphenation and OCR spacing
 * but rejects paraphrases.
 */
export function quoteAppearsIn(quote: string, haystack: string): boolean {
  const q = normalizeForMatch(quote);
  if (q.length < 12) return false;
  const h = normalizeForMatch(haystack);
  if (h.includes(q)) return true;

  const qTokens = q.split(' ');
  const hTokens = h.split(' ');
  if (qTokens.length < 4 || hTokens.length < qTokens.length) return false;

  const qSet = new Map<string, number>();
  for (const token of qTokens) qSet.set(token, (qSet.get(token) || 0) + 1);
  const window = qTokens.length;
  const counts = new Map<string, number>();
  let matched = 0;

  const add = (token: string) => {
    const need = qSet.get(token);
    if (!need) return;
    const have = counts.get(token) || 0;
    if (have < need) matched += 1;
    counts.set(token, have + 1);
  };
  const remove = (token: string) => {
    const need = qSet.get(token);
    if (!need) return;
    const have = counts.get(token) || 0;
    if (have <= need) matched -= 1;
    counts.set(token, have - 1);
  };

  for (let i = 0; i < hTokens.length; i++) {
    add(hTokens[i]);
    if (i >= window) remove(hTokens[i - window]);
    if (i >= window - 1 && matched / window >= 0.85) return true;
  }
  return false;
}

export function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
}

export function titleSimilarity(a: string, b: string): number {
  return jaccard(tokenize(a), tokenize(b));
}

/** Top distinctive keywords, weighting repeated multi-character tokens and bigrams. */
export function extractKeywords(text: string, limit = 8): string[] {
  const tokens = tokenize(text).filter((token) => token.length > 3);
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    counts.set(bigram, (counts.get(bigram) || 0) + 1.5);
  }
  const ranked = [...counts.entries()]
    .filter(([term, count]) => count >= (term.includes(' ') ? 3 : 2))
    .sort((a, b) => b[1] - a[1]);

  const selected: string[] = [];
  for (const [term] of ranked) {
    if (selected.some((existing) => existing.includes(term) || term.includes(existing))) continue;
    selected.push(term);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z(\[])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer|aside|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function decodeXmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');
}

export function cleanDoi(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/[.,;)\]}>]+$/, '')
    .toLowerCase();
}

export function findDois(text: string): string[] {
  const matches = text.match(/\b10\.\d{4,9}\/[^\s"<>,;]+/g) || [];
  return [...new Set(matches.map(cleanDoi))];
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
