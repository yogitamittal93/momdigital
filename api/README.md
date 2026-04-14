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
- Configure `CLIENT_URLS` with deployed frontend origins.
- Ensure persistent storage for `SCAN_UPLOAD_DIR` or move to S3-compatible object storage.
- Apply Prisma migrations from `prisma/migrations` before boot.
