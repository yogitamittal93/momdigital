## MomDigital API

### Environment

Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://user:password@host:5432/neondb?sslmode=require
JWT_ACCESS_SECRET=replace-with-long-random-secret
JWT_REFRESH_SECRET=replace-with-long-random-secret
CLIENT_URLS=http://localhost:3000,https://your-frontend-domain.com
REDIS_URL=redis://localhost:6379
```

### Run locally

```bash
npm install
npx prisma generate
npm run start:dev
```

### Deployment checklist

- Set `NODE_ENV=production`.
- Set strong JWT secrets in env manager.
- Configure `CLIENT_URLS` and `FRONTEND_URL` with deployed frontend origins (e.g. `https://momdigital.live`, `https://www.momdigital.live`).
- **Railway API service**: set `ML_SERVICE_URL` to the **public Railway URL** of the ML service (e.g. `https://ml-service-production-xxxx.up.railway.app`). Do **not** use `http://127.0.0.1:5000` — that only works locally.
- **Railway API service**: set `API_PUBLIC_ORIGIN` to the API's public origin **without** `/api` (e.g. `https://api-production-xxxx.up.railway.app`) so avatar URLs use HTTPS behind Railway's proxy.
- **Preferred for low-memory Railway plans**: prefetch `matrny_db` during CI/Docker build so the image already contains the knowledge base. This avoids 60-120s runtime cold starts and prevents `502 Bad Gateway` while the public ML URL is waking up.
- **Fallback only**: if you do not prebundle `matrny_db`, set `HF_REPO_ID` and `HF_TOKEN` so ChromaDB can download on cold start. This is slower and less reliable on low-memory plans.
- **Railway ML service**: set `GROQ_API_KEY` for LLM responses.
- **Vercel**: set `NEXT_PUBLIC_API_URL` to the Railway API URL ending in `/api` (baked at build time).
- Ensure persistent storage for `SCAN_UPLOAD_DIR` / avatars or move to S3-compatible object storage (Railway filesystem is ephemeral — avatars are lost on redeploy).
- Apply Prisma migrations from `prisma/migrations` before boot.
