import { generateText, Output } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const gatewayModel = 'google/gemini-3.8-flash';
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const researchAiProvider = genai ? `Google Gemini (${geminiModel})` : `Vercel AI Gateway (${gatewayModel})`;

/** Structured JSON generation through Gemini (server key) or AI Gateway. Throws when unavailable. */
export async function generateJson<T>(schema: z.ZodType<T>, prompt: string, timeoutMs = 90_000): Promise<T> {
  if (genai) {
    const response = await genai.models.generateContent({
      model: geminiModel,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json', responseJsonSchema: z.toJSONSchema(schema), temperature: 0.1, abortSignal: AbortSignal.timeout(timeoutMs) },
    });
    return schema.parse(JSON.parse(response.text || '{}'));
  }
  const result = await generateText({
    model: gateway(gatewayModel),
    prompt,
    output: Output.object({ schema }),
    temperature: 0.1,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return result.output as T;
}

export interface WebHit { url: string; title: string }

/**
 * Live web discovery. Gemini uses Google Search grounding; AI Gateway uses Parallel search.
 * Only URLs/titles are returned — content is fetched and verified separately.
 */
export async function webSearch(objective: string, queries: string[], domains: string[]): Promise<WebHit[]> {
  if (genai) {
    const response = await genai.models.generateContent({
      model: geminiModel,
      contents: [{ role: 'user', parts: [{ text: `${objective}\nSearch queries: ${queries.join('; ')}\nPrefer: ${domains.join(', ')}. List the most relevant peer-reviewed papers, systematic reviews, meta-analyses and WHO documents.` }] }],
      config: { tools: [{ googleSearch: {} }], abortSignal: AbortSignal.timeout(45_000) },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const hits: WebHit[] = [];
    for (const chunk of chunks.slice(0, 10)) {
      const uri = chunk.web?.uri;
      if (!uri) continue;
      let resolved = uri;
      try {
        const head = await fetch(uri, { redirect: 'manual', signal: AbortSignal.timeout(8_000) });
        resolved = head.headers.get('location') || uri;
      } catch { /* keep redirect uri */ }
      hits.push({ url: resolved, title: chunk.web?.title || '' });
    }
    return hits;
  }
  const result = await generateText({
    model: gateway(gatewayModel),
    tools: { search: gateway.tools.parallelSearch({ mode: 'basic', maxResults: 10, sourcePolicy: { includeDomains: domains } }) },
    toolChoice: { type: 'tool', toolName: 'search' },
    prompt: `${objective}\nSearch queries: ${queries.join('; ')}`,
    abortSignal: AbortSignal.timeout(60_000),
  });
  const outputs = result.steps.flatMap((s) => s.content).filter((c: any) => c.type === 'tool-result').map((c: any) => c.output);
  return outputs.flatMap((o: any) => (o?.results || []).map((r: any) => ({ url: r.url, title: r.title || '' })));
}
