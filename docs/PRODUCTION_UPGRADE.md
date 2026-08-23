# Production Upgrade

## Critical Supabase fix
If the deployed database was created from an older schema, run `src/lib/schema.sql` in Supabase SQL Editor. The schema now explicitly adds `public.orders.user_id` when it is missing, creates the needed index, and adds safe customer cancellation/staff policies.

## AI reliability
The AI agent now prefers stable/high-throughput Gemini models and immediately falls through to the next model on capacity errors, timeouts and transient failures. `GEMINI_PRIMARY_MODEL` and `GEMINI_FALLBACK_MODEL` can override the defaults.

## Product architecture roadmap
1. AI ordering state machine: intent -> cart mutation -> confirmation -> checkout.
2. Server-side order creation with price validation against the trusted menu, rather than trusting browser prices.
3. Atomic order creation (order + items) using a Postgres RPC/transaction.
4. Idempotency key per checkout attempt to prevent duplicate orders.
5. Realtime customer tracking and restaurant order board.
6. Menu management: availability, price, variants, categories and stock state.
7. Analytics: revenue, orders, average ticket, top products and peak hours.
8. Customer features: reorder, saved addresses, order history and support.
9. Operational UX: offline-safe cart, retryable requests, skeleton states, toasts and mobile-first interactions.
10. Visual system: stronger hierarchy, premium food photography, consistent motion, accessible contrast and reduced-motion support.
