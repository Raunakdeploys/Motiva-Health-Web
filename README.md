# MOTIVA — Evidence-to-Publishing Studio

MOTIVA helps health researchers and clinical teams move from a research paper to responsible, reviewable content without losing the evidence trail.

## The problem

Research summaries are easy to generate and hard to trust: a polished sentence can hide a missing quote, a mismatched population, or a claim stronger than its source. Manual review is safer, but tracing every statement through a paper and rebuilding it for each format is slow.

## The solution

MOTIVA makes the claim—not the summary—the unit of work. It extracts or accepts passages, drafts claims linked to those passages, runs deterministic validation checks, and holds content generation behind human approval. Generated deliverables retain their claim and evidence references so reviewers can inspect the path back to the source.

**The differentiator:** AI can help draft and organize evidence; it cannot approve a claim. Only claims with human approval are eligible for content generation.

## Product workflow

1. **Add research** — upload a paper or start from the included synthetic benchmark.
2. **Inspect source text** — review extracted passages and OCR status against the original pages.
3. **Draft and validate claims** — keep each claim connected to supporting passages and surface validation findings.
4. **Make a human decision** — approve, flag, edit, or reject each claim; edits trigger re-validation and downstream invalidation where needed.
5. **Create and plan** — generate social content from approved claims, review provenance, and organize deliverables in the publishing calendar.

The workspace also includes a research library, evidence radar, provenance graph, claim review, evidence report, audit log, and media studio.

## Demo safety

The built-in benchmark is **synthetic teaching data**. Its source excerpts, claims, approvals, and planned posts are illustrative—not verified clinical evidence, real clinician sign-off, or medical advice. The app labels the sample throughout the workspace. Do not use its sample content for care decisions or publication.

MOTIVA is a research communication tool, not a diagnostic or treatment system. A qualified professional remains responsible for clinical interpretation and approval.

## Stack

- React 19, TypeScript, Vite 8, Tailwind CSS 4
- Express API, Firebase Authentication, and Neon PostgreSQL with Drizzle
- Vercel AI SDK with Vercel AI Gateway for AI features in Vercel previews and deployments
- Optional server-side Google GenAI key support for external hosting such as the included Render blueprint

AI credentials belong on the server. Never commit a key, place one in a `VITE_` variable, or paste one into source code. The API key shared in chat should be revoked and replaced before use.

## Run locally

```bash
npm install
npm run dev
```

The server starts the Express API and Vite development middleware together. Sign-in and cloud sync require the project’s Firebase configuration and a reachable Neon `DATABASE_URL`. The sample workspace can be explored without signing in; guest changes use the app’s browser storage, while signed-in account data syncs through the authenticated API.

## AI configuration

- **Vercel:** use the connected Vercel AI Gateway integration; it supplies runtime authentication, so a Gemini key is not required for the Vercel preview or deployment.
- **External host / Render:** the current blueprint exposes `GEMINI_API_KEY` as a server-side environment variable. Keep it in the host’s secret settings, not in the repository or browser bundle. The existing Render service hostname is retained for deployment continuity; changing it requires a separate host/domain update.

The project environment inventory checked for this update did not include a `GEMINI_API_KEY`. A key pasted in chat is not used by the app.

## Quality checks

```bash
npm run lint
npm run build
npx tsx scripts/test-validation-engine.ts
npx tsx scripts/test-radar-adversarial.ts
```

`/api/health` reports API, AI-provider, and Neon readiness without returning credentials. It is a service-health check, not proof that an individual model request will succeed.

## Project resources

- [Existing hosted deployment](https://steer-health-web.onrender.com/) — the app is MOTIVA-branded; the legacy service URL has not been renamed.
- [Walkthrough video](https://drive.google.com/file/d/10ek6yR_LQW4aoPN_WIHWp2vCTQa_USsX/view?usp=drive_link)
- [Source repository](https://github.com/Raunakdeploys/Steer-health-web)

## Research and clinical references

The sample benchmark includes references to published research for demonstration, but its embedded excerpts and derived sample claims are synthetic. Always verify source documents, population, endpoints, limitations, and claim wording before real-world use.
