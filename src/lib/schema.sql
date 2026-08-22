-- ============================================================
-- معلم الشاورما — Database Schema for Supabase
-- ============================================================
-- نفذ هذا الملف داخل SQL Editor في لوحة تحكم Supabase.
--
-- قبل التنفيذ:
-- 1. فعّل Phone Auth: Authentication > Providers > Phone
-- 2. تأكد من تفعيل RLS على كل الجداول
-- ============================================================

-- Profiles (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text not null default '',
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text default 'موقعي',
  latitude double precision not null,
  longitude double precision not null,
  formatted_address text not null default '',
  city text,
  district text,
  street text,
  building text,
  delivery_notes text,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.addresses enable row level security;

create policy "Users can manage own addresses"
  on addresses for all using (auth.uid() = user_id);

-- Orders
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null default ('MS-' || lpad(nextval('order_seq')::text, 6, '0')),
  user_id uuid references public.profiles(id) not null,
  status text default 'pending' check (status in ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  subtotal integer not null,
  delivery_fee integer default 0,
  total integer not null,
  fulfillment text not null check (fulfillment in ('delivery','pickup')),
  latitude double precision,
  longitude double precision,
  formatted_address text,
  phone text not null,
  customer_name text,
  notes text,
  payment_method text default 'cash',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create sequence for order numbers
create sequence if not exists order_seq start 1;

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);
create policy "Users can create orders"
  on orders for insert with check (auth.uid() = user_id);

-- Order Items (snapshot of product at time of order)
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id text not null,
  product_name text not null,
  quantity integer not null,
  unit_price integer not null,
  total integer not null
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on order_items for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
create policy "Users can create order items"
  on order_items for insert with check (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
