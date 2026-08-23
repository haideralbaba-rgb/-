-- ============================================================
-- معلم الشاورما — Supabase schema + safe migrations
-- Run this file in Supabase SQL Editor.
-- ============================================================

create sequence if not exists public.order_seq start 1;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text not null default '', name text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, coalesce(new.phone, '')) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text default 'موقعي', latitude double precision not null, longitude double precision not null,
  formatted_address text not null default '', city text, district text, street text, building text,
  delivery_notes text, is_default boolean default false, created_at timestamptz default now()
);
alter table public.addresses enable row level security;
do $$ begin create policy "Users can manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null default ('MS-' || lpad(nextval('public.order_seq')::text, 6, '0')),
  user_id uuid references public.profiles(id) on delete restrict,
  status text default 'pending' check (status in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  subtotal integer not null, delivery_fee integer default 0, total integer not null,
  fulfillment text not null check (fulfillment in ('delivery','pickup')),
  latitude double precision, longitude double precision, formatted_address text,
  phone text not null, customer_name text, notes text, payment_method text default 'cash',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- IMPORTANT: older installations may have orders without user_id. Add it before policies/query code.
alter table public.orders add column if not exists user_id uuid;
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
alter table public.orders enable row level security;

do $$ begin create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can create own orders" on public.orders for insert with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can cancel own pending orders" on public.orders for update using (auth.uid() = user_id and status in ('pending','confirmed')) with check (auth.uid() = user_id); exception when duplicate_object then null; end $$;

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id text not null, product_name text not null, quantity integer not null check (quantity > 0),
  unit_price integer not null, total integer not null
);
alter table public.order_items enable row level security;
do $$ begin create policy "Users can view own order items" on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())); exception when duplicate_object then null; end $$;
do $$ begin create policy "Users can create own order items" on public.order_items for insert with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())); exception when duplicate_object then null; end $$;

-- Restaurant staff
create table if not exists public.restaurant_staff (
  user_id uuid references auth.users(id) on delete cascade primary key,
  role text not null default 'staff' check (role in ('owner','manager','staff')),
  active boolean not null default true,
  created_at timestamptz default now()
);
alter table public.restaurant_staff enable row level security;
do $$ begin create policy "Staff can read own staff record" on public.restaurant_staff for select using (auth.uid() = user_id); exception when duplicate_object then null; end $$;

-- Staff policies for operating the restaurant dashboard.
do $$ begin create policy "Staff can view all orders" on public.orders for select using (exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)); exception when duplicate_object then null; end $$;
do $$ begin create policy "Staff can update orders" on public.orders for update using (exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)); exception when duplicate_object then null; end $$;
do $$ begin create policy "Staff can view order items" on public.order_items for select using (exists (select 1 from public.restaurant_staff s where s.user_id = auth.uid() and s.active = true)); exception when duplicate_object then null; end $$;

-- ============================================================
-- Existing database migration: run safely on an older database.
-- If old rows exist with NULL user_id, map them manually before making user_id NOT NULL.
-- ============================================================
