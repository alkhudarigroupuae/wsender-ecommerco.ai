# Run live (production checklist)

## Architecture (read this first)

| Piece | Where it runs | This repo |
|-------|----------------|-----------|
| **Web UI** | **Vercel** (static React + optional `/api` proxy) | `frontend/` |
| **API + WhatsApp worker** | **Not on Vercel** — must be a **long‑running Node** process | `backend/` |
| **Database** | PostgreSQL anywhere (e.g. Supabase, Neon) | migrations in `backend/` |

**Vercel does not replace the backend.** WhatsApp sessions and the queue need a server that stays up. You choose **any** host for the API: **your VPS**, **Railway**, **Fly.io**, **Render**, Docker on a VM, etc. The docs below use **`YOUR_API_ORIGIN`** (e.g. `https://api.yourdomain.com`) — **not** tied to Render.

Optional: `render.yaml` in this repo is **only** if you want to deploy the backend using [Render](https://render.com) Blueprints. Skip it if you host the backend elsewhere.

---

Order: **database → deploy backend (your host) → Vercel (frontend)** → wire URLs.

## 1) PostgreSQL

- Create a project on [Supabase](https://supabase.com) (or Neon, etc.).
- Copy the **connection string** → `DATABASE_URL` on the backend.
- If SSL is required, set `PGSSLMODE=require` on the backend.

## 2) Backend (your Node host — not Vercel)

1. Run `backend` with Node 20+, with `DATABASE_URL`, `JWT_SECRET`, limits, `FRONTEND_ORIGIN`, `APP_BASE_URL`, etc. — see **`backend/.env.example`**.
2. Run migrations once: `cd backend && npm run migrate` (or your deploy pipeline).
3. `FRONTEND_ORIGIN` and `APP_BASE_URL` must be your **final Vercel URL**, e.g. `https://your-app.vercel.app`.
4. Verify in a browser: **`YOUR_API_ORIGIN/api/health`** → JSON with `"ok": true`.

**Examples of API hosts (pick one):**

- **VPS** — follow `DEPLOYMENT_VPS.md` / Docker.
- **Render** — optional Blueprint via `render.yaml` in this repo.
- **Railway / Fly.io / other PaaS** — same env vars as `backend/.env.example`; run `node server.js` (or `cd backend && node server.js`).

Stripe webhooks and WhatsApp must hit **`YOUR_API_ORIGIN`**, not Vercel.

## 3) Frontend on Vercel

1. [Vercel](https://vercel.com) → **New Project** → import this GitHub repo.
2. **Root Directory:** leave **empty** (repo root) so root `vercel.json` builds `frontend/` — **or** set to `frontend` if you only deploy the UI from that folder.
3. Choose **one** way to reach the API:

### Mode A — Browser calls the API directly (simplest)

- In Vercel → **Environment Variables:**  
  `VITE_API_BASE_URL` = `YOUR_API_ORIGIN` (no trailing slash), e.g. `https://api.example.com`  
- Do **not** set `BACKEND_URL`.

### Mode B — Same-origin `/api` on Vercel (proxy serverless)

- Do **not** set `VITE_API_BASE_URL` (or remove it).
- Set **`BACKEND_URL`** = `YOUR_API_ORIGIN` only (no `/api` suffix).

4. **Deploy** production.

5. If you changed the Vercel URL, update **`FRONTEND_ORIGIN` / `APP_BASE_URL`** on the backend and restart/redeploy the API.

## 4) CORS

`FRONTEND_ORIGIN` on the backend must **exactly** match your Vercel URL (scheme + host).

## 5) Smoke test

- Open your **Vercel** URL → register / login.
- Network tab: API calls should go to `YOUR_API_ORIGIN` (Mode A) or `/api/...` on Vercel (Mode B).

### If you see `404 NOT_FOUND` on Vercel

- Failed or wrong deployment → check Vercel **Deployments**.
- Wrong API wiring → recheck Mode A/B env vars; test **`YOUR_API_ORIGIN/api/health`** directly first.

## Local dev

See **`README.md`**: `backend/.env` from `backend/.env.example`, `npm run migrate` + `npm run start`; `frontend` with `npm run dev` (proxies `/api` to port 4000).
