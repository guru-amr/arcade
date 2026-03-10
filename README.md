# ARCADE – College Printing Shop Web App

Modern, minimal printing shop app for colleges. Built with:

- React + TypeScript + Vite (frontend)
- Tailwind CSS (styling)
- Spring Boot (backend)
- MySQL (database)
- JWT auth for the vendor dashboard

## Structure

- `frontend/` – React app (student landing, order flow, vendor login & dashboard)
- `backend/` – Spring Boot REST API + MySQL + JWT

## Running the backend

Requirements: Java 17+, Maven, MySQL.

1. Create a MySQL database (default name: `arcade_db`).
2. Set environment variables (or override in `application.properties`):

   - `ARCADE_DB_URL` – e.g. `jdbc:mysql://localhost:3306/arcade_db`
   - `ARCADE_DB_USERNAME`
   - `ARCADE_DB_PASSWORD`
   - `ARCADE_JWT_SECRET` – **base64-encoded** secret key for JWT (at least 256 bits)
   - `ARCADE_UPLOAD_DIR` – folder to store uploaded PDFs (default: `uploads`)

   Optional (email):

   - `ARCADE_MAIL_HOST`
   - `ARCADE_MAIL_PORT`
   - `ARCADE_MAIL_USERNAME`
   - `ARCADE_MAIL_PASSWORD`

3. From `backend/`:

   ```bash
   mvn spring-boot:run
   ```

4. Seed a dev vendor user (once, in dev):

   - POST `http://localhost:8080/api/vendor/auth/seed-dev-vendor`
   - Credentials: `username=vendor`, `password=password`

## Running the frontend

Requirements: Node.js 18+ and npm.

1. From `frontend/`:

   ```bash
   npm install
   npm run dev
   ```

2. Configure API URL (optional):

   - Create `frontend/.env.local`:

     ```bash
     VITE_API_BASE_URL=http://localhost:8080
     ```

3. Open the dev URL shown in the terminal (typically `http://localhost:5173`).

## Flows

- **Student**:
  - `/` – Landing + PDF upload, print settings, basic cost estimate.
  - On submit: calls `/api/orders/create`, then goes to `/order/pay/:orderId`.
  - Payment page:
    - Razorpay test checkout (if configured), or
    - “Simulate payment (dev)” button.
  - Redirects to `/order/confirmation/:orderId`, which shows the pickup code and summary.

- **Vendor**:
  - `/vendor/login` – Login with JWT.
  - `/vendor/dashboard` – Protected dashboard.
    - `GET /api/vendor/orders` – filter by status + time.
    - `GET /api/vendor/orders/{id}` – full details + `fileUrl` for PDF.
    - `PATCH /api/vendor/orders/{id}/status` – mark as `READY_FOR_PICKUP` or `COMPLETED`.

You can later plug in real Razorpay/Stripe instead of the current simulated payment step.

## Razorpay (optional)

Frontend env:

- `VITE_RAZORPAY_KEY_ID`

Backend env:

- `ARCADE_RAZORPAY_KEY_ID`
- `ARCADE_RAZORPAY_KEY_SECRET`
