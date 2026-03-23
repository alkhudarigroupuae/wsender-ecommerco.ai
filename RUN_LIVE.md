# Run live (production checklist)

Order: **database → backend (Render) → frontend (Vercel)** → then wire URLs.

## 1) PostgreSQL

- Create a project on [Supabase](https://supabase.com) (or Neon, etc.).
- Copy the **connection string** → you will use it as `DATABASE_URL`.
- If the host requires SSL, set `PGSSLMODE=require` on the backend.

## 2) Backend on Render

1. [Render](https://render.com) → **New** → **Blueprint** (or Web Service) → connect this GitHub repo.
2. Render reads `render.yaml` — service name `whatsapp-sender`, disk for uploads + WhatsApp session.
3. In Render → **Environment**, set at least:

| Variable | Example / note |
|----------|------------------|
| `DATABASE_URL` | From Supabase (or your Postgres URL) |
| `PGSSLMODE` | `require` if your DB needs SSL |
| `JWT_SECRET` | Long random string |
| `FRONTEND_ORIGIN` | Your **Vercel** URL, e.g. `https://your-app.vercel.app` |
| `APP_BASE_URL` | Same as `FRONTEND_ORIGIN` (Stripe links) |
| `FREE_MONTHLY_LIMIT` | e.g. `200` |
| `PRO_MONTHLY_LIMIT` | e.g. `5000` |
| `MAX_MESSAGES_PER_HOUR` | e.g. `50` |
| `MIN_DELAY_SECONDS` | e.g. `20` |
| `MAX_DELAY_SECONDS` | e.g. `90` |
| `MAX_RETRIES` | e.g. `3` |
| `AI_PROVIDER` | `openai` or `gemini` or `mock` |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | If not using `mock` |

Optional: `ADMIN_EMAILS`, Stripe keys, `STRIPE_*`, etc.

4. **Deploy.** First deploy runs build + `npm run migrate` (see `render.yaml`).
5. Verify: open `https://<your-render-service>.onrender.com/api/health`  
   Expected: JSON with `"ok": true`.

**Note:** After you know your **final** Vercel URL, update `FRONTEND_ORIGIN` and `APP_BASE_URL` on Render and redeploy if you had placeholders.

## 3) Frontend on Vercel

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import the same repo.
2. **Root Directory:** leave **empty** (repo root) so root `vercel.json` builds `frontend/` and deploys `api/` proxy — **or** set Root to `frontend` if you prefer (then `frontend/api` is used).
3. Choose **one** API mode:

### Mode A — Browser → backend directly (simplest)

- **Environment variables:**  
  `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com` (no trailing slash)  
- Do **not** set `BACKEND_URL` for this mode.

### Mode B — Same-origin `/api` on Vercel (proxy)

- **Do not** set `VITE_API_BASE_URL` (or remove it).
- Set `BACKEND_URL` = `https://<your-render-service>.onrender.com` (origin only, no `/api`).

4. **Deploy** (Production). Wait until the build finishes.

5. Set **Render** `FRONTEND_ORIGIN` / `APP_BASE_URL` to your real `https://xxx.vercel.app` and **redeploy Render** if they were wrong.

## 4) CORS

Backend allows `FRONTEND_ORIGIN` only. It must **exactly** match your Vercel URL (scheme + host, no path).

## 5) Smoke test

- Open your Vercel URL → register / login.
- Campaigns / API calls should return JSON, not HTML errors.

### If you see `404 NOT_FOUND` (Vercel)

- Wrong deployment URL or failed deploy → check **Deployments** on Vercel.
- API 404: confirm Mode A or B env vars; test Render `/api/health` directly.
- Stripe webhooks must point to **Render**, not Vercel (see `DEPLOYMENT_AR.md`).

## Local dev

See root `README.md`: `backend/.env` from `backend/.env.example`, then `npm run migrate` + `npm run start`; `frontend` with `npm run dev` (proxy to `:4000`).
