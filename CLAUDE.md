# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FemStore** — a full-stack eCommerce platform for beauty products. Monorepo with a Next.js 14 frontend (Vercel) and an Express/TypeScript backend (Railway.app) backed by PostgreSQL.

## Commands

### Root (monorepo)
```bash
npm run setup           # Install all deps (backend + frontend)
npm run dev:backend     # Start backend on http://localhost:4000
npm run dev:frontend    # Start frontend on http://localhost:3000
npm run db:setup        # Run initial DB migration (requires local `femstore` DB)
```

### Backend (`cd backend`)
```bash
npm run dev             # ts-node-dev with hot reload
npm run build           # tsc → dist/
npm run lint            # ESLint on src/
npm run seed:admin      # Seed admin user (admin@femstore.com / Admin123!)
npm run migration:run   # Run pending migrations from dist/
```

### Frontend (`cd frontend`)
```bash
npm run dev             # Next.js dev server
npm run build           # Production build
npm run lint            # next lint
npm test                # Jest (run once)
npm run test:watch      # Jest watch mode
npm run test:coverage   # Jest + coverage (50% threshold enforced)
```

## Architecture

### Backend — Express + TypeScript (no ORM)

**Module structure** — each feature lives in `backend/src/modules/<feature>/`:
- `<feature>.controller.ts` — Express router, request parsing, response formatting
- `<feature>.service.ts` — business logic, raw SQL via `pg` pool

**Common layer** (`backend/src/common/`):
- `helpers.ts` — `sendSuccess()` / `sendError()` response wrappers
- `validators.ts` — Zod schemas + `validateRequestSafe()` helper
- `auth.guard.ts` — `authenticate` middleware (JWT verification + role check)
- `encryption.ts` — field-level decryption middleware (runs before validation)
- `types.ts` — shared TypeScript types

**Database** — raw SQL with parameterized queries through `pg` pool (no ORM). Pool configured in `backend/src/config/database.ts`. Migrations live in `backend/src/database/migrations/`.

**Middleware order in `main.ts`**: helmet → cors → morgan → rate-limit → decryption → routes → global error handler.

**Rate limiting**: 100 requests / 15 minutes (production).

### Frontend — Next.js 14 App Router

**Routing**:
- `src/app/shop/` — public storefront (products, cart, checkout)
- `src/app/admin/` — admin panel (protected, role check client-side)
- `src/app/auth/` — login/register pages

**State** (Zustand, `src/store/`):
- `auth.store.ts` — user session, persisted to localStorage
- `cart.store.ts` — cart items, persisted to localStorage
- `theme.store.ts` — dark/light mode preference

**API client** (`src/lib/api.ts`) — Axios instance with:
- Auto-inject `Authorization: Bearer <token>` from auth store
- Field-level encryption on sensitive fields before sending (email, phone, address)
- Auto-logout on 401

**Server components** — home page and product listing fetch at build time with Next.js revalidation (60s products, 300s categories).

### Encryption

Sensitive fields (email, phone, address) are encrypted on the frontend via `crypto-js` before being sent to the API. The backend has a decryption middleware that runs before route handlers — never validate encrypted fields; always decrypt first.

### Auth flow

1. `POST /api/auth/login` → returns JWT
2. Frontend stores token in Zustand (`auth.store.ts`) which persists to localStorage
3. Subsequent requests attach `Authorization: Bearer <token>`
4. `authenticate` middleware on protected routes verifies token and attaches `req.user`
5. Admin routes additionally check `req.user.role === 'admin'`

## Environment Variables

**Backend** (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — signing key for JWTs
- `FRONTEND_URL` — for CORS whitelist
- `TWILIO_*` — WhatsApp integration credentials

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL` — backend URL (empty string in production = relative path via Vercel rewrites)

## Testing

Tests live in `frontend/src/__tests__/`. Currently covers Zustand stores (e.g., cart logic). Jest is configured with `jsdom` environment and `@/*` path aliases. Coverage threshold is 50% — enforced in CI.

Backend has no tests yet.

## Key Conventions

- **No ORM** — all DB access is raw SQL with parameterized queries. Keep it that way.
- **Zod everywhere** — validate at request boundaries with `validateRequestSafe()` in backend; React Hook Form + Zod in frontend.
- **Response shape** — always use `sendSuccess(res, data)` / `sendError(res, message, status)` in controllers.
- **Role values** — `'customer'` and `'admin'` (lowercase strings, stored in JWT).
- **Image uploads** — handled via Multer on `POST /api/products/:id/images`; stored locally or in a configured bucket.
- **Tailwind custom tokens** — use `blush`, `gold`, `cream` color palette and `font-display` (Playfair Display) for headings.
