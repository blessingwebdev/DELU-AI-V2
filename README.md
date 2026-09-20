# DELU AI V2 — Complete Master Foundation

DELU AI V2 is an NGX-focused market intelligence platform designed around verified data, honest uncertainty, friendly explanations and owner-controlled operations.

## Included in this master
- Next.js + TypeScript application shell
- DELU dashboard, Ask DELU, NGX company registry and owner control center
- New five-source market ingestion:
  1. NGX Equities Statistics API
  2. NGX Ticker API
  3. NGX Stock Chart Data API
  4. AFX Kwayisi NGX Live
  5. Yahoo Finance NGX
- Source-family-aware verification: NGX endpoints are treated as one official family; AFX and Yahoo are independent families.
- Safe handling of missing data, timeouts and conflicting values
- Automatic company discovery from official NGX collections
- Internal market service layer so the UI does not depend directly on vendor-specific responses
- Support tickets with constrained low-risk auto-resolution and owner escalation
- In-app resolution message payloads; no email dependency
- Payment verification policy foundation
- Role/action boundary foundation
- Evolution proposal system with owner approval gate
- Prisma schema foundation for users, securities, quotes, watchlists, payments, incidents and audit logs
- Smoke test and 10-pass test plan documentation

## Important production boundary
This package is a strong project foundation, not a claim of production deployment. Real authentication, database provisioning, rate limiting, persistent notification storage, payment-provider verification, scheduled jobs and a production AI model provider still need to be connected before public launch.

The app never intentionally invents a price. When verification is weak or sources disagree, the result is marked accordingly.

## Run locally
1. Install dependencies with `npm install`.
2. Configure the database only when persistence is needed.
3. Run `npm run dev`.
4. Open `/dashboard` or `/admin`.

## Testing
`node scripts/test-engine.mjs` runs the dependency-free 10-category engine checks. The same suite can be repeated 100+ times to check deterministic stability.

The full 10-pass plan is documented in `lib/testing/test-plan.ts`. Full Next/Prisma compilation still requires a Node/npm environment with dependencies installed. Do not treat the dependency-free smoke-test result as proof of a production build.
