# Vercel Publishing + Database (Production)

This project needs:
- **Frontend on Vercel** (this folder)
- **A long-running backend** elsewhere (VPS, Railway, Fly.io, Render, etc.) — **not** Vercel serverless — for WhatsApp + queue + API
- **PostgreSQL** (Supabase / Neon / etc.)

## 1) Deploy frontend on Vercel
1) Vercel → New Project → Import GitHub repo
2) You can leave **Root Directory** empty (repo root). Root `vercel.json` builds `frontend/` and deploys `/api` proxy from `api/[...path].js`.
3) Or set Root Directory to `frontend` and keep `frontend/vercel.json` — then copy `api/` to repo root anyway, or use only `VITE_API_BASE_URL` (Option A).

### Frontend env (Vercel)

**Option A — Browser calls backend directly**
- `VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN` (no trailing slash)

Example:
- `VITE_API_BASE_URL=https://wsender.ecommerco.ai`

**Option B — Same-origin `/api` on Vercel (proxy)**
- Do **not** set `VITE_API_BASE_URL` (build must resolve requests to `/api/...`).
- Set `BACKEND_URL=https://YOUR_BACKEND_DOMAIN` (origin only, no `/api` suffix).
- The serverless route `api/[...path].js` at the **repository root** forwards to your backend. Stripe webhooks must still target the backend URL directly, not Vercel.

## 2) Backend hosting (required)
WhatsApp sending cannot run reliably on Vercel serverless. Run the backend on:
- VPS (recommended), or
- Render (web service)

Backend must always be running to keep WhatsApp logged in.

## 3) Database (PostgreSQL)
You have 3 good choices:

### Option A: Supabase Postgres (recommended)
- Create a Supabase project
- Copy the connection string and set it as `DATABASE_URL` on the backend
- Usually also set `PGSSLMODE=require`

### Option B: Neon Postgres
- Same idea: use Neon connection string as `DATABASE_URL` on the backend

### Option C: Vercel Postgres
- Vercel Postgres is still PostgreSQL (managed)
- Use the generated connection string as `DATABASE_URL` on the backend

## 4) Where to store database credentials
- Do NOT put DB credentials in the frontend (Vercel env for frontend)
- Put `DATABASE_URL` only in the backend environment (VPS/Render)

## 5) Backend env (VPS/Render)
Required:
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `ADMIN_EMAILS=you@domain.com` (comma-separated)
- `FRONTEND_ORIGIN=https://YOUR_VERCEL_DOMAIN`
- `APP_BASE_URL=https://YOUR_VERCEL_DOMAIN`

Limits:
- `FREE_MONTHLY_LIMIT=200`
- `PRO_MONTHLY_LIMIT=5000`
- `MAX_MESSAGES_PER_HOUR=50`
- `MAX_MESSAGES_PER_MINUTE=5` (optional, 0 disables)
- `MIN_DELAY_SECONDS=20`
- `MAX_DELAY_SECONDS=90`
- `MAX_RETRIES=3`

WhatsApp persistence:
- `UPLOADS_DIR=/var/lib/whatsapp-sender/uploads`
- `WHATSAPP_SESSION_PATH=/var/lib/whatsapp-sender/wa_sessions`

AI (optional):
- `AI_PROVIDER=openai` + `OPENAI_API_KEY=...` (+ `OPENAI_MODEL=...`)
or
- `AI_PROVIDER=gemini` + `GEMINI_API_KEY=...` (+ `GEMINI_MODEL=...`)

## 6) Final wiring checklist
- Vercel frontend calls backend via `VITE_API_BASE_URL`
- Backend CORS allows `FRONTEND_ORIGIN` (your Vercel domain)
- Database connection string exists in backend only
