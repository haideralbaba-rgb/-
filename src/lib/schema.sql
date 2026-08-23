-- ============================================================
-- معلم الشاورما — Database Schema
-- ============================================================
-- This file contains the existing customer schema plus the owner
-- dashboard access layer at the bottom.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text not null default '',
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone) values (new.id, coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create sequence if not exists order_seq start 1;

create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text default 'موقعي', latitude double precision not null, longitude double precision not null,
  formatted_address text not null default '', city text, district text, street text, building text,
  delivery_notes text, is_default boolean default false, created_at timestamptz default now()
);
alter table public.addresses enable row level security;
drop policy if exists "Users can manage own addresses" on addresses;
create policy "Users can manage own addresses" on addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null default ('MS-' || lpad(nextval('order_seq')::text, 6, '0')),
  user_id uuid references auth.users(id) on delete restrict not null,
  status text default 'pending' check (status in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  subtotal integer not null, delivery_fee integer default 0, total integer not null,
  fulfillment text not null check (fulfillment in ('delivery','pickup')),
  latitude double precision, longitude double precision, formatted_address text,
  phone text not null, customer_name text, notes text, payment_method text default 'cash',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.orders enable row level security;

drop policy if exists "Users can view own orders" on orders;
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
drop policy if exists "Users can create orders" on orders;
create policy "Users can create orders" on orders for insert with check (auth.uid() = user_id);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id text not null, product_name text not null, quantity integer not null,
  unit_price integer not null, total integer not null
);
alter table public.order_items enable row level security;
drop policy if exists "Users can view own order items" on order_items;
create policy "Users can view own order items" on order_items for select using (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
drop policy if exists "Users can create order items" on order_items;
create policy "Users can create order items" on order_items for insert with check (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

-- ============================================================
-- RESTAURANT DASHBOARD ACCESS
-- ============================================================
-- After the owner creates/logs into their Supabase Auth account,
-- run once in SQL Editor:
-- insert into public.restaurant_staff (user_id, role) values ('OWNER-AUTH-USER-ID', 'owner');

create table if not exists public.restaurant_staff (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.restaurant_staff enable row level security;
drop policy if exists "Staff can view own access" on restaurant_staff;
create policy "Staff can view own access" on restaurant_staff for select using (auth.uid() = user_id);

-- Staff can see and update restaurant orders. Customers retain access
-- only to their own orders through the policies above.
drop policy if exists "Restaurant staff can view all orders" on orders;
create policy "Restaurant staff can view all orders" on orders for select using (
  exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)
);
drop policy if exists "Restaurant staff can update orders" on orders;
create policy "Restaurant staff can update orders" on orders for update using (
  exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)
) with check (
  exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)
);

drop policy if exists "Restaurant staff can view all order items" on order_items;
create policy "Restaurant staff can view all order items" on order_items for select using (
  exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)
);

-- Enable realtime for live order updates. Ignore the command if the table
-- has already been added to the publication in your Supabase project.
do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception when duplicate_object then
    null;
  end;
end $$;
