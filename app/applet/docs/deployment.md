# MOTIVA Evidence Studio - Render Deployment Guide

## Render Optimization & Production Architecture
To deploy successfully on Render (including free tier 512MB RAM constraints and standard Web Services):

### 1. Render Web Service Settings
- **Environment**: Node
- **Build Command**: `npm run build`
- **Start Command**: `npm start` (executes `node server.ts` natively)
- **Health Check Path**: `/api/health`
- **Node Version**: `>=20.0.0` (specified in `package.json` engines)

### 2. Automated Blueprint Deployment
This repository includes a `render.yaml` configuration. When creating a new Web Service or Blueprint on Render:
1. Connect repository `Raunakdeploys/MOTIVA-health-web`.
2. Render will automatically detect `render.yaml` with build and start settings.
3. Configure environment variables in the Render Dashboard:
   - `GEMINI_API_KEY`: Google GenAI API key for medical claim extraction and content remixing.
   - `DATABASE_URL` (optional): PostgreSQL database URL if connecting to an external database.
   - `NODE_ENV`: Set to `production` (handled automatically by `render.yaml`).

### 3. Memory & Static Asset Optimization
- `vite.config.ts` utilizes `rollupOptions` manual chunking (`vendor`, `firebase`, `pdf`) to isolate large libraries, keep peak memory well under 512MB, and prevent Out-Of-Memory (OOM) failures during production builds.
- Express serves pre-compressed static assets from `dist/` with single-page app (SPA) fallback routing for non-API requests.
- Full offline fallback mode: If external database or AI services are unavailable, the studio gracefully runs on the embedded synthetic clinical trial dataset (GLP-1 muscle preservation, South Asian metabolic phenotype, and adaptive thermogenesis).
