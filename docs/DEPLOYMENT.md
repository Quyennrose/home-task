# HomeTask Deployment

The frontend is already deployed on Vercel:

```text
https://home-task-fawn.vercel.app/
```

To make the demo use a real backend and PostgreSQL database, deploy the API separately and then point Vercel at that API.

## Recommended Free/Low-Cost Setup

- Frontend: Vercel
- Backend API: Render web service
- PostgreSQL: Neon or Supabase free tier

## 1. Create PostgreSQL

Create a PostgreSQL project in Neon or Supabase and copy the connection string.

Use a direct connection string if the provider offers both pooled and direct URLs. It should look like:

```text
postgresql://user:password@host/database?sslmode=require
```

## 2. Deploy Backend On Render

1. Open Render and create a new web service from the GitHub repo.
2. Use these settings:
   - Build command: `npm ci`
   - Start command: `npm start`
   - Health check path: `/health`
3. Add environment variables:

```env
NODE_VERSION=22
HOMETASK_DB_DRIVER=postgres
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PGSSL=true
HOMETASK_TOKEN_SECRET=replace-with-a-long-random-secret
```

The repository includes `render.yaml`, so Render can also create the service from the blueprint. Keep `DATABASE_URL` private in the Render dashboard.

After deploy, open:

```text
https://your-render-service.onrender.com/health
```

Expected response:

```json
{
  "ok": true,
  "mode": "local-api",
  "database": "postgres"
}
```

## 3. Connect Vercel Frontend

In the Vercel project, set:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
VITE_ENABLE_DEMO_TOOLS=true
VITE_ENABLE_LOCAL_RESET=false
```

Redeploy the frontend after saving environment variables.

## 4. Test Live Demo

Use these seed accounts after the backend initializes:

- Admin: `admin@hometask.vn` / `admin123`
- Helper: `helper.demo@hometask.vn` / `helper123`

Recommended smoke test:

1. Open the Vercel URL.
2. Log in as admin and confirm admin pages load.
3. Log in as helper and confirm jobs page loads.
4. Create a customer booking.
5. Confirm the booking persists after refreshing the page.

## Notes

- Render free services may sleep when idle, so the first request can be slow.
- Keep `HOMETASK_TOKEN_SECRET` and `DATABASE_URL` out of Git.
- The API uses permissive CORS for classroom/demo deployment.
