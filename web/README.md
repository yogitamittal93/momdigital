## MomDigital Web

### Environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Run locally

```bash
npm install
npm run dev
```

### Production notes

- Frontend expects cookie-based auth from API (`access_token`, `refresh_token`).
- Ensure API CORS includes this frontend origin.
- Set `NEXT_PUBLIC_API_URL` to deployed API URL ending with `/api`.
