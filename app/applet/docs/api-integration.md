# MOTIVA Evidence Studio - API Integration & Gemini AI

## Server-Side Gemini API Integration
All AI operations are routed through secure server-side endpoints in `server.ts` using the official `@google/genai` TypeScript SDK. 

### Security Architecture
- **API Key Management**: `GEMINI_API_KEY` is loaded securely via `process.env` on the backend server. The key is never exposed to the browser or Vite bundle.
- **Automated Workflows**:
  - `/api/audit-claims`: Analyzes scientific claim ledgers, verifies methodological robustness, and detects clinical or statistical risk factors using structured JSON generation.
  - PDF Paper Intake & Extraction: Server-side PDF text extraction and chunked semantic summarization.

### Error Handling & Resiliency
- Automatic retry mechanism with exponential backoff for rate limits.
- Graceful fallback schemas ensuring zero client-side crashes when AI quotas or connectivity fluctuate.
