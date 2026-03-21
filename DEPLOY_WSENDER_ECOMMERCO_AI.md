# WSender.ecommerco.ai (Production) + Test Sending Checklist

This project is designed for:
- Frontend UI (web)
- Backend (API + WhatsApp worker) that must run 24/7
- PostgreSQL database

For WhatsApp sending you must run the backend on a virtual private server (recommended) or a long-running service. Vercel is only for the frontend UI.

## A) Quick Local Test (Register + QR + Send)

1) Open the app:
- `http://localhost:4000/`

2) Register a user:
- `http://localhost:4000/register`

3) Connect WhatsApp:
- Go to `App → WhatsApp` (or `http://localhost:4000/app/whatsapp`)
- If QR does not show, press **Reconnect**
- Phone: WhatsApp → Linked Devices → Link a device → scan QR

4) Add one test contact:
- Go to `App → Contacts`
- Add a phone in international format (example `+9715xxxxxxxx`)

5) Create a test campaign:
- Go to `App → Campaigns`
- Create a campaign
- Use **Preview AI** to confirm per-contact message generation

6) Start sending:
- Press **Start sending**
- Monitor logs in campaign detail page
- Download CSV report: **Download CSV** in campaign detail

Health Endpoints:
- `GET /api/health`
- `GET /api/campaigns/:id/report`
- `GET /api/campaigns/:id/report.csv`

## B) Publish to https://wsender.ecommerco.ai (Virtual Private Server)

### 1) DNS
Set `A` record:
- Host: `wsender`
- Value: your server public IP

### 2) Server Install (Ubuntu/Debian)
Install Nginx + Let's Encrypt + Git:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx git
```

Install Node 20 (NVM):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3) PostgreSQL Database
Recommended: Supabase Postgres (managed).
- Use the Supabase connection string as `DATABASE_URL`
- Usually also set `PGSSLMODE=require`

### 4) Clone + Build
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/ecommerco/ecommerco-wsender.git wsender
cd wsender

cd backend && npm ci
cd ../frontend && npm ci && npm run build
```

### 5) Backend Environment (Server-Only)
Create a server environment file:
```bash
sudo mkdir -p /etc/wsender
sudo nano /etc/wsender/env
```

Paste and fill:
```
NODE_ENV=production
PORT=4000

DATABASE_URL=postgresql://...
PGSSLMODE=require
PG_POOL_MAX=10

JWT_SECRET=CHANGE_ME_TO_LONG_RANDOM
ADMIN_EMAILS=you@domain.com
FRONTEND_ORIGIN=https://wsender.ecommerco.ai
APP_BASE_URL=https://wsender.ecommerco.ai

FREE_MONTHLY_LIMIT=200
PRO_MONTHLY_LIMIT=5000
MAX_MESSAGES_PER_HOUR=50
MAX_MESSAGES_PER_MINUTE=5
MIN_DELAY_SECONDS=20
MAX_DELAY_SECONDS=90
MAX_RETRIES=3

UPLOADS_DIR=/var/lib/wsender/uploads
WHATSAPP_SESSION_PATH=/var/lib/wsender/wa_sessions
WHATSAPP_HEADLESS=true

AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

Create persistent folders:
```bash
sudo mkdir -p /var/lib/wsender/uploads /var/lib/wsender/wa_sessions
sudo chown -R $USER:$USER /var/lib/wsender
```

### 6) Run Migrations
```bash
cd /var/www/wsender/backend
set -a
source /etc/wsender/env
set +a
npm run migrate
```

### 7) Start Backend (PM2)
```bash
sudo npm i -g pm2
cd /var/www/wsender/backend
set -a
source /etc/wsender/env
set +a
pm2 start server.js --name wsender --time
pm2 save
pm2 startup
```

### 8) Nginx Reverse Proxy + SSL
Create a site file:
```bash
sudo nano /etc/nginx/sites-available/wsender
```

Use:
```nginx
server {
  server_name wsender.ecommerco.ai;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable + Reload:
```bash
sudo ln -sf /etc/nginx/sites-available/wsender /etc/nginx/sites-enabled/wsender
sudo nginx -t
sudo systemctl reload nginx
```

SSL:
```bash
sudo certbot --nginx -d wsender.ecommerco.ai
```

### 9) Verify Production
```bash
curl -s https://wsender.ecommerco.ai/api/health
```

Then login/register on:
- `https://wsender.ecommerco.ai/`

Go to WhatsApp page and scan QR once.
