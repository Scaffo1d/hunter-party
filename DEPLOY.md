# Deploying Hunter Party Online

Two services: **Vercel** (Next.js frontend) + **Render** (Socket.IO game server).

## Prerequisites

1. Push this repo to GitHub
2. Free accounts on [Vercel](https://vercel.com) and [Render](https://render.com)

## 1. Deploy game server (Render)

1. Render Dashboard → **New +** → **Blueprint** (or **Web Service**)
2. Connect your GitHub repo
3. If using the included [`render.yaml`](render.yaml), approve the blueprint
4. Or configure manually:
   - **Root Directory**: (repo root)
   - **Build Command**: `npm ci && npm run build:server`
   - **Start Command**: `npm run start:server`
   - **Health Check Path**: `/health`
5. Add environment variable:
   - `CORS_ORIGIN` = your Vercel URL (set after step 2, then redeploy)
6. Copy the Render service URL, e.g. `https://hunter-party-api.onrender.com`

**Free tier note:** the server sleeps after ~15 minutes idle. First visit may take 30–60 seconds to wake.

## 2. Deploy frontend (Vercel)

1. Vercel Dashboard → **Add New Project** → import the GitHub repo
2. **Root Directory**: `apps/web`
3. Framework: Next.js (auto-detected; [`vercel.json`](apps/web/vercel.json) handles monorepo install)
4. Environment variables:
   - `NEXT_PUBLIC_WS_URL` = `https://<your-render-service>.onrender.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://<your-vercel-domain>.vercel.app` (optional, for OG tags)
5. Deploy

Card art (`public/assets/`, ~580MB) is excluded via [`.vercelignore`](apps/web/.vercelignore). The board game works with `board-sketch.png` only until card UI ships.

## 3. Wire CORS

After Vercel deploy, set on Render:

```
CORS_ORIGIN=https://your-app.vercel.app
```

Redeploy the Render service.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_WS_URL` | Vercel | Socket.IO server URL |
| `NEXT_PUBLIC_SITE_URL` | Vercel | Canonical URL for metadata |
| `CORS_ORIGIN` | Render | Allowed frontend origin(s), comma-separated |
| `PORT` | Render | Set automatically by Render |

## Local production test

```bash
npm ci
npm run build:server
npm run build:web
CORS_ORIGIN=http://localhost:3000 npm run start:server   # terminal 1
cd apps/web && npm start                                    # terminal 2
```

## Redeploy after board changes

1. Export `board.graph.json` from `/board-trace` (dev only)
2. Copy to `packages/game-engine/data/board.graph.json` and `apps/web/public/board-sketch-import.json`
3. Commit and push — both hosts redeploy automatically

## Known limitations (v1)

- Rooms are in-memory (lost on server restart or sleep)
- No custom domain configured by default
- Card art not on CDN yet (`npm run copy-assets` for local dev)
