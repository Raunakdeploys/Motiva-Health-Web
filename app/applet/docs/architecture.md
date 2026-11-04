# MOTIVA Evidence Studio - Architecture & System Design

## Overview
MOTIVA Evidence Studio helps researchers turn scientific papers into traceable evidence records, claims for human review, and responsible content drafts. AI-assisted extraction and deterministic checks support review; they do not replace clinical judgment or independently verify a paper.

## Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript (`server.ts`)
- **AI Integration**: Vercel AI Gateway and Google GenAI for selected multimodal workflows
- **Authentication**: Firebase Auth with Firebase ID tokens verified by the Express API; no synthetic session tokens
- **Database**: Neon PostgreSQL with Drizzle ORM; account data is queried by the verified Firebase UID
- **Deployment**: Vite static frontend plus a shared Express Vercel Function for `/api/*`; the same Express app supports local Vite middleware and self-hosted deployments
- **Audit scope**: Server-recorded, user-scoped activity history; not a tamper-proof or regulatory audit system
