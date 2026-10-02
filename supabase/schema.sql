-- Vellyshop schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- It is safe to re-run: every object is created with "if not exists" or dropped first.

-- ---------------------------------------------------------------- products

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tagline     text not null,
  description text not null,
  price_kobo  integer not null check (price_kobo >= 0),
  image_url   text not null,
  category    text not null,
  sizes       text[] not null default '{}',
  colour      text,
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------ orders

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  reference      text unique not null,
  email          text not null,
  full_name      text not null,
  phone          text not null,
  address        text not null,
  city           text not null,
  state          text not null,
  note           text,
  subtotal_kobo  integer not null check (subtotal_kobo >= 0),
  delivery_kobo  integer not null check (delivery_kobo >= 0),
  total_kobo     integer not null check (total_kobo >= 0),
  status         text not null default 'confirmed',
  email_sent     boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

-- ------------------------------------------------------------- order items

create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  name            text not null,
  size            text,
  image_url       text,
  unit_price_kobo integer not null check (unit_price_kobo >= 0),
  quantity        integer not null check (quantity > 0)
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

-- --------------------------------------------------------------------- RLS

alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- The catalogue is public: anyone, signed in or not, may read it.
drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone"
  on public.products for select
  using (true);

-- An order belongs to exactly one signed-in user, who may read and create
-- their own. Nobody can read anybody else's, and nothing can be updated or
-- deleted from the browser.
drop policy if exists "a user reads their own orders" on public.orders;
create policy "a user reads their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "a user creates their own orders" on public.orders;
create policy "a user creates their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "a user reads their own order items" on public.order_items;
create policy "a user reads their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "a user creates their own order items" on public.order_items;
create policy "a user creates their own order items"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------- mark as emailed
--
-- Orders are deliberately not updatable from the browser: a customer must not
-- be able to edit a total after the fact. Flipping the email_sent flag is the
-- one exception, so it goes through a function that can only ever set that one
-- column, and only on an order the caller owns.

create or replace function public.mark_order_emailed(p_order_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders
     set email_sent = true
   where id = p_order_id
     and user_id = auth.uid();
$$;

revoke all on function public.mark_order_emailed(uuid) from public;
grant execute on function public.mark_order_emailed(uuid) to authenticated;
