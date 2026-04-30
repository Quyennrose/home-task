# HomeTask Production Checklist

## Required Before Public Launch

- Configure `VITE_API_BASE_URL`. The repo includes a local Node implementation in `server/index.js` with JSON and SQLite adapters; replace local persistence with managed PostgreSQL before public launch.
- Implement production persistence for every endpoint in `docs/API_CONTRACT.md` using the adapter boundary in `server/database.js`.
- Store passwords using a strong hash such as Argon2id or bcrypt.
- Enforce role authorization on the backend for customer/helper/admin routes.
- Replace local image data URLs with storage uploads using `VITE_UPLOAD_PROVIDER`.
- Replace local payment completion with a signed provider flow using `VITE_PAYMENT_PROVIDER`.
- Implement provider webhook signature verification before marking bookings as paid.
- Replace local chat storage with realtime messaging using `VITE_REALTIME_PROVIDER`.
- Add address geocoding so GPS validation compares against real booking coordinates.
- Persist audit logs in managed storage and add retention/export policy for status changes, check-in/check-out, payment updates, and admin decisions.
- Replace local in-memory rate limiting with distributed rate limiting for auth, chat, uploads, and payment endpoints.
- Add E2E tests for customer booking, helper job completion, review, payment, and admin approval flows.
- Add monitoring for API errors, failed payment webhooks, upload failures, and GPS anomalies.

## Backend Modules

- Auth: login, register, refresh token, logout, Google OAuth callback.
- Users: profile read/update, role management.
- Helpers: application submission, admin approval/rejection, profile visibility.
- Bookings: create, list, status transitions, cancellation rules.
- Progress: checklist, GPS, photo confirmation.
- Reviews: one review per completed booking, rating aggregation.
- Chat: booking-scoped messages, websocket or provider channels.
- Notifications: persisted notifications plus realtime delivery.
- Payments: checkout session, webhook, refund path.
- Uploads: presigned uploads, asset metadata, access control.

## Frontend Follow-Ups

- Keep new business flows behind `src/app/utils/localApi.ts` so the frontend can switch between browser-local mode and backend API mode.
- Add form-level error messages from backend validation responses.
- Add loading and retry states for booking, chat, payment, upload, and admin operations.
- Add route-level error boundaries for failed lazy-loaded pages.
- Add a production-only build profile with demo tools disabled.
