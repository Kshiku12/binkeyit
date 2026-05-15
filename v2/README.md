# Blinkit Clone v2 (From Scratch)

This is a clean new project built in parallel to your existing app.

## What is included

- New backend API (`apps/api`) with:
  - Role-based auth: `ADMIN`, `CUSTOMER`, `RIDER`
  - Email/password login
  - Google login endpoint (ID token based)
  - Forgot password with OTP over email
  - Catalog, cart, and order APIs
  - Payment modes: `CARD`, `COD`, `UPI` (UPI ID + merchant QR support)
  - Live order tracking via Socket.IO
- New frontend shell (`apps/web`) with:
  - Blinkit-style home page flow
  - Product listing/search pages
  - Login + forgot-password UI
  - Cart page
  - Live order tracking page

## Keep current MongoDB

Use your existing MongoDB URI in `apps/api/.env`.

## Setup

1. Create env files:
   - `apps/api/.env` from `apps/api/.env.example`
   - `apps/web/.env` from `apps/web/.env.example`
2. Install dependencies:
   - `npm install --prefix apps/api`
   - `npm install --prefix apps/web`
3. Seed base data (admin, rider, categories, products):
   - `npm run api:seed`
4. Run backend:
   - `npm run api:dev`
5. Run frontend:
   - `npm run web:dev`

## Default seeded users

- Admin:
  - Email: `admin@blinkitv2.local`
  - Password: `Admin@123`
- Rider:
  - Email: `rider@blinkitv2.local`
  - Password: `Rider@123`

## Key API routes

- Auth: `/api/v2/auth/*`
- Catalog: `/api/v2/catalog/*`
- Cart: `/api/v2/cart`
- Orders: `/api/v2/orders/*`
- Health: `/health`

## Notes

- For Google login, set `GOOGLE_CLIENT_ID` and call `/api/v2/auth/google` with `idToken`.
- For OTP email, configure SMTP vars.
- For card payments, set `STRIPE_SECRET_KEY`.
- For UPI QR flow, set `MERCHANT_UPI_ID` and/or `MERCHANT_UPI_QR_URL`.
