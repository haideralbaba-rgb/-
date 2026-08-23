# Ordering Agent + Restaurant Dashboard

## What changed

- أبو علي now receives the current cart and the complete frontend menu snapshot.
- Gemini returns a structured JSON response containing `reply` plus safe cart actions.
- The client validates menu ids before executing AI actions.
- The AI can add, remove, change quantities, clear the cart, open the cart, and move to checkout.
- The cart remains the source of truth; the model cannot write directly to Supabase.
- `/dashboard` provides a restaurant command center with live order updates, status transitions, daily revenue, active-order counts, and order details.
- `orderService` now writes orders using `user_id`, matching the current database schema.

## Supabase dashboard setup

Run `src/lib/dashboard-migration.sql` in the Supabase SQL Editor after the existing schema.

Then create/sign in the owner's Auth user and insert that Auth user id into `restaurant_staff`:

```sql
insert into public.restaurant_staff (user_id, role)
values ('OWNER-AUTH-USER-ID', 'owner');
```

The dashboard URL is:

`/dashboard`

## AI environment

The existing server-side `API_KEY` environment variable is still used. The project now targets `gemini-3.7-flash` and asks Gemini for structured JSON output.

## Recommended acceptance test

1. Open the site and start a chat.
2. Say: `اريد صاج دجاج`.
3. Confirm the item appears in the real cart.
4. Say: `خلي وياها بطاطا ومشروب`.
5. Confirm both items are added without reopening the menu.
6. Say: `خلي الشاورما ثنتين`.
7. Confirm the quantity becomes 2.
8. Say: `شيل البطاطا`.
9. Confirm it disappears from the cart.
10. Say: `خلص اريد اطلب` and confirm the cart/checkout opens instead of the AI merely replying with instructions.
11. Complete an order.
12. Open `/dashboard` as a staff user and verify the new order appears.
13. Move it through confirmed → preparing → ready → out_for_delivery → delivered.
14. Verify another dashboard/customer session receives realtime order changes.
