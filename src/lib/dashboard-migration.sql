-- ============================================================
-- Restaurant Dashboard migration
-- Run this AFTER the existing schema.sql in Supabase SQL Editor.
-- It does not replace the existing customer/order tables.
-- ============================================================

create table if not exists public.restaurant_staff (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.restaurant_staff enable row level security;

drop policy if exists "Staff can view own access" on public.restaurant_staff;
create policy "Staff can view own access"
  on public.restaurant_staff for select
  using (auth.uid() = user_id);

-- Give the owner/staff read access to every order while keeping
-- customer access limited to their own orders.
drop policy if exists "Restaurant staff can view all orders" on public.orders;
create policy "Restaurant staff can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.restaurant_staff s
      where s.user_id = auth.uid() and s.active = true
    )
  );

drop policy if exists "Restaurant staff can update orders" on public.orders;
create policy "Restaurant staff can update orders"
  on public.orders for update
  using (
    exists (
      select 1 from public.restaurant_staff s
      where s.user_id = auth.uid() and s.active = true
    )
  )
  with check (
    exists (
      select 1 from public.restaurant_staff s
      where s.user_id = auth.uid() and s.active = true
    )
  );

drop policy if exists "Restaurant staff can view all order items" on public.order_items;
create policy "Restaurant staff can view all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.restaurant_staff s
      where s.user_id = auth.uid() and s.active = true
    )
  );

-- Enable realtime for live dashboard updates.
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then
    null;
  end;
end $$;

-- ============================================================
-- After creating the owner's Auth account, run this once:
-- insert into public.restaurant_staff (user_id, role)
-- values ('OWNER-AUTH-USER-ID', 'owner');
-- ============================================================
