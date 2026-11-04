/**
 * End-to-end research analyst check against a real PDF and live scholarly APIs.
 * Usage: npx tsx scripts/test-research-pipeline.ts <paper.pdf> [mode]
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { runResearchPipeline, validateVerification } from '../src/research/pipeline.ts';
import type { DocumentPageInput, ExternalSource } from '../src/research/types.ts';

const [file, mode = 'combined'] = process.argv.slice(2);

// Citation guardrail unit check: unknown ids dropped, unverifiable excerpts downgrade the verdict.
{
  const source = { id: 'S1', abstract: 'Time-restricted eating reduced body weight by 3 percent over 12 weeks in adults with metabolic syndrome.', contentOrigin: 'abstract' } as ExternalSource;
  const out = validateVerification({
    verifications: [
      { claimId: 'C1', verdict: 'supported', confidence: 'high', rationale: 'r', evidence: [{ sourceId: 'S1', stance: 'supports', excerpt: 'reduced body weight by 3 percent over 12 weeks in adults' }] },
      { claimId: 'C2', verdict: 'supported', confidence: 'high', rationale: 'r', evidence: [{ sourceId: 'S9', stance: 'supports', excerpt: 'fabricated study text that does not exist' }] },
    ],
    synthesis: { currentConsensus: '', evidenceStrength: { grade: 'low', rationale: '' }, comparisons: [{ sourceId: 'S9', relationship: 'agrees', summary: '' }], outdatedConclusions: [], methodologicalWeaknesses: [], researchGaps: [] },
  }, [{ id: 'C1', text: 'a', origin: 'pdf', citations: [] }, { id: 'C2', text: 'b', origin: 'pdf', citations: [] }], [source], true);
  assert.equal(out.verifications[0].verdict, 'supported');
  assert.equal(out.verifications[0].externalEvidence[0].excerptVerified, true);
  assert.equal(out.verifications[1].verdict, 'insufficient');
  assert.equal(out.verifications[1].externalEvidence.length, 0);
  assert.equal(out.synthesis.comparisons.length, 0);
  console.log('PASS citation guardrails');
}

if (!file) process.exit(0);

const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
const pages: DocumentPageInput[] = [];
for (let i = 1; i <= doc.numPages; i++) {
  const content = await (await doc.getPage(i)).getTextContent();
  const lines: { y: number; parts: string[] }[] = [];
  for (const item of content.items as any[]) {
    if (!('str' in item) || !item.str.trim()) continue;
    const y = Math.round(item.transform[5]);
    const line = lines.find((l) => Math.abs(l.y - y) <= 2);
    if (line) line.parts.push(item.str); else lines.push({ y, parts: [item.str] });
  }
  pages.push({ page: i, method: 'text', text: lines.sort((a, b) => b.y - a.y).map((l) => l.parts.join(' ')).join('\n') });
}
console.log(`Extracted ${pages.length} pages, ${pages.reduce((n, p) => n + p.text.length, 0)} chars`);

const report = await runResearchPipeline(
  { mode: mode as any, document: { filename: file.split('/').pop()!, pageCount: pages.length, pages } },
  (e) => { if (e.type === 'progress') console.log(`  [${e.percent}%] ${e.message}`); }
);
const d = report.document!;
console.log('\nTITLE:', d.title, '|', d.journal, d.year, '| DOI', d.doi, '| verified by', d.metadataVerifiedBy);
console.log('Sections:', d.sections.map((s) => `${s.name} p${s.startPage}-${s.endPage}`).join(', '));
console.log('Stats:', d.statistics.length, d.statistics.slice(0, 4).map((s) => `p${s.page} ${s.value}`).join(' | '));
console.log('Tables:', d.tables.map((t) => `${t.label}@p${t.page}`).join(', '), '| refs', d.references.count, 'newest', d.references.newestYear);
console.log('Claims:', d.claims.length, '| engine', d.analysisEngine);
console.log('\nSOURCES:', report.sources.length);
for (const s of report.sources.slice(0, 10)) console.log(` ${s.id} [${s.evidenceType}] ${s.year} ${s.title.slice(0, 80)} | ${s.url} | ${s.contentOrigin} | ${s.providers.join('+')}`);
console.log('\nSearch log:', report.searchLog.map((l) => `${l.provider}:${l.status}:${l.returned}`).join(' '));
console.log('Verdicts:', report.verifications.map((v) => `${v.claimId}=${v.verdict}`).join(' '));
console.log('Warnings:', report.warnings);
console.log('Duration ms:', report.durationMs, '| heap MB', Math.round(process.memoryUsage().heapUsed / 1e6));

assert.ok(d.statistics.length > 0, 'expected page-cited statistics');
if (mode !== 'pdf') {
  assert.ok(report.sources.length >= 5, 'expected live external sources');
  for (const s of report.sources) assert.match(s.url, /^https:\/\//);
  // Spot-check one PubMed record resolves to the same title (no fabricated citations).
  const pm = report.sources.find((s) => s.pmid);
  if (pm) {
    const r = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pm.pmid}&retmode=json`).then((x) => x.json());
    assert.ok(r.result[pm.pmid].title.toLowerCase().includes(pm.title.toLowerCase().slice(0, 30)), 'PubMed title mismatch');
    console.log(`PASS PubMed record ${pm.pmid} independently verified`);
  }
}
console.log('PASS research pipeline');
