# HomeTask API Contract

This contract documents the local backend in `server/index.js` and the target API shape used by the frontend adapter.

Run:

```bash
npm run api
```

Storage adapters:

- `npm run api` uses the JSON-backed local adapter by default.
- `npm run api:sqlite` uses the SQLite-backed adapter.
- Set `HOMETASK_DB_DRIVER=json|sqlite` to choose explicitly.

Seed accounts:

- `admin@hometask.vn` / `admin123`
- `helper.demo@hometask.vn` / `helper123`

## Authentication

All authenticated routes use:

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Validation and authorization behavior:

- Invalid request bodies return `400` with `{ "error": "validation_error", "errors": [...] }`.
- Rate-limited requests return `429` with `{ "error": "rate_limited", "retryAfterSeconds": number }`.
- Customers can only list, pay for, message, review, or cancel bookings that belong to their own `customerId`.
- Helpers can only list, message, update progress, and accept/complete/cancel bookings assigned to their own `helperId`.
- Admins can list all bookings and update helper application status.
- Reviews require a completed booking and are limited to one review per booking/customer.

### POST /auth/login

Request:

```json
{
  "email": "customer@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "user": {
    "id": "user_123",
    "name": "Customer",
    "email": "customer@example.com",
    "userType": "customer",
    "createdAt": "2026-04-08T00:00:00.000Z"
  },
  "accessToken": "jwt"
}
```

### POST /auth/register

Accepts either a customer payload or helper application payload. Response matches `/auth/login`.

### PATCH /me

Updates the authenticated user's editable profile fields.

Helper profile request example:

```json
{
  "bio": "Nhận dọn dẹp nhà theo checklist",
  "skills": ["Vệ sinh tổng thể", "Giặt ủi"],
  "availability": ["Thứ 2", "Thứ 4"],
  "serviceAreas": ["Quận Hải Châu"],
  "bankName": "VCB",
  "bankAccount": "0123456789"
}
```

Response: updated public `User`/profile object.

## Helpers

### GET /helpers

Returns approved and verified helper profiles for customer browsing and booking.

## Bookings

### POST /bookings

Creates a booking.

Required fields:

```json
{
  "customerId": "user_123",
  "helperId": "helper_123",
  "helperName": "Chị Thu Hà",
  "service": "Dọn dẹp nhà",
  "date": "2026-04-09",
  "time": "09:00",
  "hours": 3,
  "address": "Quận Hải Châu, Đà Nẵng",
  "totalPrice": 260000,
  "notes": "Call before arriving"
}
```

Response: `Booking`.

### GET /bookings?customerId=:id

Returns bookings for the authenticated customer.

### GET /bookings?helperId=:id

Returns jobs for the authenticated helper.

### GET /admin/bookings

Admin-only. Returns all bookings.

### GET /admin/audit-logs

Admin-only. Returns recent audit events. Supports optional query params:

- `limit`: max number of rows, capped at 500
- `action`: exact action filter, for example `booking.created`

Response example:

```json
[
  {
    "id": "audit_123",
    "actorId": "user_123",
    "actorType": "customer",
    "actorName": "Customer",
    "action": "booking.created",
    "targetType": "booking",
    "targetId": "booking_123",
    "metadata": { "helperId": "3" },
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
]
```

### PATCH /bookings/:id/status

Request:

```json
{ "status": "pending|confirmed|completed|cancelled" }
```

### PATCH /bookings/:id/payment

Request:

```json
{ "paymentStatus": "unpaid|paid" }
```

## Booking Progress

### GET /bookings/:id/progress

Returns checklist, GPS check-in/check-out, photo metadata, and audit timestamps.

### PATCH /bookings/:id/progress

Request:

```json
{
  "checkIn": {
    "latitude": 16.0544,
    "longitude": 108.2022,
    "capturedAt": "2026-04-08T10:00:00.000Z",
    "distanceMeters": 240,
    "withinAllowedRadius": true
  },
  "checklist": [
    { "id": "task_1", "label": "Check-in đúng địa điểm", "completed": true }
  ],
  "photoConfirmation": {
    "assetId": "asset_123",
    "url": "https://storage.example.com/photo.jpg",
    "capturedAt": "2026-04-08T10:30:00.000Z"
  }
}
```

## Helper Applications

### GET /admin/helper-applications

Admin-only. Returns helper applications.

### PATCH /admin/helper-applications/:helperId/status

Request:

```json
{ "applicationStatus": "approved|rejected" }
```

## Reviews

### POST /reviews

Request:

```json
{
  "bookingId": "booking_123",
  "helperId": "helper_123",
  "customerId": "customer_123",
  "rating": 5,
  "comment": "Dịch vụ tốt",
  "service": "Dọn dẹp nhà",
  "images": ["https://storage.example.com/photo.jpg"]
}
```

### GET /helpers/:helperId/reviews

Returns reviews and aggregated rating stats.

### GET /reviews?bookingId=:bookingId

Returns whether the authenticated customer has already reviewed the booking:

```json
{ "reviewed": true }
```

## Chat

### GET /bookings/:bookingId/messages

Returns booking-scoped messages sorted by creation time.

### POST /bookings/:bookingId/messages

Request:

```json
{
  "senderId": "user_123",
  "message": "Tôi sẽ đến lúc 9h."
}
```

Realtime upgrade: publish this message on `booking:<bookingId>:messages`.

## Notifications

### GET /notifications

Returns notifications for the authenticated user.

### POST /notifications

Admin/system route for creating notifications.

### PATCH /notifications/read

Marks all authenticated-user notifications as read.

## Uploads

### POST /uploads/presign

Request:

```json
{
  "filename": "after-cleaning.jpg",
  "contentType": "image/jpeg",
  "purpose": "booking-photo-confirmation"
}
```

Response:

```json
{
  "assetId": "asset_123",
  "uploadUrl": "https://storage.example.com/presigned",
  "publicUrl": "https://cdn.example.com/asset_123.jpg"
}
```

## Payments

### POST /payments/checkout

Request:

```json
{
  "bookingId": "booking_123",
  "provider": "vnpay|momo|zalopay|stripe"
}
```

Response:

```json
{
  "checkoutUrl": "https://payment.example.com/session"
}
```

### POST /payments/webhook

Provider-specific webhook. Must verify provider signature before updating `paymentStatus`.
