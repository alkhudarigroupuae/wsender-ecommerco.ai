# نشر حقيقي (Vercel + Render + Supabase)

هذا المشروع يتكوّن من:
- Frontend (Vite/React): ينشر على Vercel.
- Backend (Node/Express + WhatsApp worker): ينشر على Render كخدمة طويلة التشغيل.
- Database: PostgreSQL على Supabase.

## 1) تجهيز قاعدة البيانات على Supabase
1) افتح Supabase → أنشئ مشروع جديد.
2) من Settings → Database → Connection string خذ رابط PostgreSQL.
3) استخدمه كقيمة `DATABASE_URL` في Render.

ملاحظة SSL:
- إذا رابط Supabase يتطلب SSL، فعّل `PGSSLMODE=require` داخل Render.

## 2) نشر الـ Backend على Render
أفضل طريقة: استخدم `render.yaml` الموجود في جذر المشروع.

### خطوات Render
1) Render → New → Blueprint → اختر هذا الريبو.
2) Render سيقرأ `render.yaml` ويجهز Web Service.
3) أضف القيم الحساسة من Environment داخل Render (sync: false):
   - `DATABASE_URL` (من Supabase)
   - `PGSSLMODE=require` (إذا لزم)
   - `JWT_SECRET` (قيمة قوية وعشوائية)
   - `FRONTEND_ORIGIN` = رابط Vercel النهائي مثل `https://your-app.vercel.app`
   - `APP_BASE_URL` = نفس رابط Vercel (لازم لروابط Stripe)
   - `FREE_MONTHLY_LIMIT`, `PRO_MONTHLY_LIMIT`
   - `MAX_MESSAGES_PER_HOUR`, `MIN_DELAY_SECONDS`, `MAX_DELAY_SECONDS`, `MAX_RETRIES`
   - Stripe:
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `STRIPE_PRICE_ID_PRO`
   - AI (اختياري حسب اختيارك):
     - `AI_PROVIDER` = `openai` أو `gemini`
     - `OPENAI_API_KEY` أو `GEMINI_API_KEY`

### التحقق
افتح:
- `https://<render-service-url>/api/health`
لازم يرجع:
`{ "ok": true, "service": "whatsapp-sender-api" }`

إذا ظهر لك اسم خدمة مختلف (مثل `woo-dashboard-api`) أنت على رابط غلط.

## 3) نشر الـ Frontend على Vercel
1) Vercel → New Project → Import repo
2) اختر Root Directory: `frontend`
3) عندك خيارين لربط الـ API:

### الخيار A (مباشر من المتصفح إلى Render)
- أضف Environment Variable في Vercel:
  - `VITE_API_BASE_URL` = رابط Render مثل `https://<render-service-url>`

### الخيار B (Proxy على Vercel: المتصفح ينادي Vercel فقط)
- لا تضف `VITE_API_BASE_URL` (اتركه فارغ).
- أضف Environment Variable في Vercel:
  - `BACKEND_URL` = رابط Render مثل `https://<render-service-url>`
- المتصفح سيستدعي `/api/...` على نفس دومين Vercel، وVercel سيعمل proxy إلى Render.

ملاحظة مهمة:
- Stripe webhook لا يمر عبر Vercel proxy بسبب توقيع Stripe. لازم webhook يضرب Render مباشرة.
4) Deploy

## 4) إعداد CORS بشكل صحيح
في Render اجعل:
- `FRONTEND_ORIGIN = https://your-app.vercel.app`

وفي Vercel اجعل:
- `VITE_API_BASE_URL = https://your-render-service.onrender.com`

## 5) ملاحظة واتساب (مهم)
واتساب يحتاج سيرفر شغال دائمًا + تخزين جلسة.
في Render تم إعداد:
- `UPLOADS_DIR=/app/backend/uploads`
- `WHATSAPP_SESSION_PATH=/app/backend/uploads/wa_sessions`
وهذا المسار مربوط بـ Disk دائم داخل Render.
