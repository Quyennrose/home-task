# HomeTask

HomeTask is a demo home-cleaning booking app with customer, helper, and admin workflows. It can run fully in the browser with `localStorage`, or connect to the included local backend for testing authentication, booking, job progress, reviews, notifications, mock payments, and audit logs.

![HomeTask app preview](docs/app-preview.png)

## Key Features

- Customer flow: register or log in, browse helpers, book services, track job progress, chat, cancel pending bookings, make mock payments, and review completed jobs.
- Helper flow: accept or reject jobs, check in and out with GPS, update task checklists, upload completion photos, and maintain a work profile.
- Admin flow: review helper applications, inspect all bookings, and monitor operational audit logs.
- Local backend: supports JSON or SQLite storage, token authentication, payload validation, role-based access checks, lightweight rate limiting, and audit logging.
- Flexible runtime: uses `localStorage` when no API URL is configured, then switches to the backend when `VITE_API_BASE_URL` is set.

## Getting Started

Use the normal commands below if Node.js is installed and `npm` is available in your terminal.

```bash
npm i
npm run dev
```

On this bundled Windows copy, `npm` may not be available in `PATH`. In that case, use the included portable Node build:

```powershell
.\node-v22.13.1-win-x64\npm.cmd i
.\node-v22.13.1-win-x64\npm.cmd run dev
```

Or add the portable Node folder to the current PowerShell session, then use `npm` normally:

```powershell
$env:PATH = (Resolve-Path .\node-v22.13.1-win-x64).Path + ';' + $env:PATH
npm run dev
```

Run the local backend:

```bash
npm run api
```

Portable Windows command:

```powershell
.\node-v22.13.1-win-x64\npm.cmd run api
```

Run the web app and backend together:

```bash
npm run dev:full
```

Portable Windows command:

```powershell
.\node-v22.13.1-win-x64\npm.cmd run dev:full
```

Run the backend with SQLite:

```bash
npm run api:sqlite
```

Run backend smoke tests:

```bash
npm run test:api
npm run test:api:sqlite
```

## Environment

Copy `.env.example` to `.env` and configure the values you need:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_ENABLE_DEMO_TOOLS=true
VITE_ENABLE_LOCAL_RESET=true
HOMETASK_DB_DRIVER=json
HOMETASK_DATA_FILE=server/data/hometask.json
HOMETASK_SQLITE_FILE=server/data/hometask.sqlite
HOMETASK_TOKEN_SECRET=change-me
```

Seed accounts:

- Admin: `admin@hometask.vn` / `admin123`
- Helper: `helper.demo@hometask.vn` / `helper123`

## User Flows

- Customer: log in or use the Google demo, book a cleaning service, view recent bookings on the home screen, open booking details to track checklist/GPS/photo progress, cancel pending bookings, or review completed work.
- Helper: choose the helper demo, open `/helper/jobs`, accept or reject jobs, check in and out with GPS, and update progress.
- Helper application: choose the helper application link on the login screen, complete the verification form, then follow the application status dashboard.
- Admin: choose the admin demo to approve helper applications at `/admin/applications`, review bookings at `/admin/bookings`, and inspect audit logs at `/admin/audit-logs`.

## Documentation

- API contract: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- PostgreSQL reference schema: [docs/DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql)
- Production checklist: [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## Technical Notes

- Business flows go through `src/app/utils/localApi.ts`; this layer calls the API server when `VITE_API_BASE_URL` is configured and falls back to `localStorage` in local mode.
- The API server validates payloads, enforces booking ownership by customer/helper/admin role, writes audit logs for important changes, and rate-limits auth/chat/upload/payment routes.
- GPS works on `localhost` after the browser grants location permission. The demo estimates distance from Da Nang district keywords and warns about far check-ins.
