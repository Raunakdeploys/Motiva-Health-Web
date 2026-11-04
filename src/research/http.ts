const CONTACT = process.env.RESEARCH_CONTACT_EMAIL || 'research@motiva.health';
export const RESEARCH_USER_AGENT = `SteerHealthResearchAnalyst/1.0 (mailto:${CONTACT})`;

interface FetchOptions {
  timeoutMs?: number;
  /** Hard cap on bytes read from the body; protects the 512 MB Render instance from huge pages. */
  maxBytes?: number;
  headers?: Record<string, string>;
  redirect?: RequestRedirect;
}

export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<{ text: string; finalUrl: string; contentType: string }> {
  const { timeoutMs = 12_000, maxBytes = 2_000_000, headers = {}, redirect = 'follow' } = options;
  const response = await fetch(url, {
    headers: { 'User-Agent': RESEARCH_USER_AGENT, Accept: '*/*', ...headers },
    redirect,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new HttpError(`HTTP ${response.status} from ${new URL(url).hostname}`, response.status);

  const contentType = response.headers.get('content-type') || '';
  if (!response.body) return { text: '', finalUrl: response.url, contentType };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      await reader.cancel().catch(() => undefined);
      break;
    }
  }
  text += decoder.decode();
  return { text, finalUrl: response.url, contentType };
}

export async function fetchJson<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { text } = await fetchText(url, { ...options, headers: { Accept: 'application/json', ...options.headers } });
  return JSON.parse(text) as T;
}

/** Runs async work with a fixed concurrency so parallel fetches never pile up in memory. */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}
