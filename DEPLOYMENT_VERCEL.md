# Vercel Publishing + Database (Production)

This project needs:
- Frontend hosting (Vercel is great)
- A long-running backend server (VPS/Render) for WhatsApp sessions + queue worker
- PostgreSQL database (Supabase / Neon / Vercel Postgres)

## 1) Deploy frontend on Vercel
1) Vercel → New Project → Import GitHub repo
2) Root Directory: `frontend`
3) Build Command: `npm run build` (Vercel usually detects this)
4) Output Directory: `dist`

### Frontend env (Vercel)
Add **one** env var:
- `VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN`

Example:
- `VITE_API_BASE_URL=https://wsender.ecommerco.ai`

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
