# VPS Deployment (Production)

This repo contains:
- `frontend/` (Vite/React)
- `backend/` (Node/Express + WhatsApp worker + Postgres)

## Option A (Recommended): Single VPS, backend serves frontend

### 1) Requirements on the VPS
- Node.js 20+
- PostgreSQL (or use Supabase Postgres)
- A process manager (systemd or pm2)

### 2) Clone and install
```bash
git clone https://github.com/ecommerco/ecommerco-wsender.git
cd ecommerco-wsender
cd backend && npm ci
cd ../frontend && npm ci && npm run build
```

### 3) Environment variables (backend)
Set these in your process manager environment (do not commit `.env`):

Required:
- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=postgresql://...` (Supabase or local Postgres)
- `JWT_SECRET=...`
- `ADMIN_EMAILS=you@domain.com` (comma-separated, admin-only access)
- `FRONTEND_ORIGIN=https://YOUR_DOMAIN` (or your frontend domain)
- `APP_BASE_URL=https://YOUR_DOMAIN`
- `FREE_MONTHLY_LIMIT=200`
- `PRO_MONTHLY_LIMIT=5000`
- `MAX_MESSAGES_PER_HOUR=50`
- `MAX_MESSAGES_PER_MINUTE=5` (optional, 0 disables)
- `MIN_DELAY_SECONDS=20`
- `MAX_DELAY_SECONDS=90`
- `MAX_RETRIES=3`

Persistence (important for WhatsApp sessions and uploads):
- `UPLOADS_DIR=/var/lib/whatsapp-sender/uploads`
- `WHATSAPP_SESSION_PATH=/var/lib/whatsapp-sender/wa_sessions`

Browser notes (WhatsApp Web):
- The website (UI) works in any browser (Safari/Firefox/Edge).
- The backend uses a headless Chromium engine to keep WhatsApp logged in.
- You can control this with:
  - `WHATSAPP_HEADLESS=true` (default)
  - `WHATSAPP_EXECUTABLE_PATH=/usr/bin/chromium` (if you install system Chromium)

If you use Supabase:
- `PGSSLMODE=require`

Optional:
- AI:
  - `AI_PROVIDER=openai` or `gemini`
  - `OPENAI_API_KEY=...` or `GEMINI_API_KEY=...`
  - `OPENAI_MODEL=gpt-4o-mini` (optional)
  - `GEMINI_MODEL=gemini-1.5-flash` (optional)
- Stripe:
  - `STRIPE_SECRET_KEY=...`
  - `STRIPE_WEBHOOK_SECRET=...`
  - `STRIPE_PRICE_ID_PRO=...`

### 4) Run migrations
```bash
cd backend
DATABASE_URL=postgresql://... npm run migrate
```

### 5) Start backend (example with pm2)
```bash
npm i -g pm2
cd backend
pm2 start server.js --name whatsapp-sender --time
pm2 save
pm2 startup
```

### 6) Reverse proxy (Nginx)
Configure your domain to proxy to `http://127.0.0.1:4000`.

Basic example:
```nginx
server {
  server_name YOUR_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 7) Health check
```bash
curl https://YOUR_DOMAIN/api/health
```

## Option B: Docker (single VPS)
This repo includes a `Dockerfile` and `docker-compose.yml`.

If you use Supabase Postgres, you typically run only the app container and set `DATABASE_URL` to Supabase.

## Notes
- Do not store any secrets in GitHub.
- Do not commit `uploads/` or WhatsApp sessions.
