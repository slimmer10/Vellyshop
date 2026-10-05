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

-- ---------------------------------------------------------------- cart items
--
-- A signed-in user's cart lives here so the website and the mobile app see the
-- same one. Guests still use localStorage on the web until they sign in.
-- "size" is '' (not null) for pieces without a size so the unique key works.

create table if not exists public.cart_items (
  user_id    uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  size       text not null default '',
  quantity   integer not null check (quantity between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id, size)
);

alter table public.cart_items enable row level security;

drop policy if exists "a user reads their own cart" on public.cart_items;
create policy "a user reads their own cart"
  on public.cart_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "a user adds to their own cart" on public.cart_items;
create policy "a user adds to their own cart"
  on public.cart_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "a user edits their own cart" on public.cart_items;
create policy "a user edits their own cart"
  on public.cart_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "a user empties their own cart" on public.cart_items;
create policy "a user empties their own cart"
  on public.cart_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Replaces the caller's whole cart in one transaction, so a device never sees
-- a half-written cart. p_lines is [{ "product_id": uuid, "size": text|null,
-- "quantity": int }, ...]. Last writer wins, which is fine for a shopping cart.
create or replace function public.replace_cart(p_lines jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.cart_items where user_id = auth.uid();

  insert into public.cart_items (user_id, product_id, size, quantity)
  select auth.uid(),
         (l->>'product_id')::uuid,
         coalesce(l->>'size', ''),
         least(greatest((l->>'quantity')::int, 1), 20)
    from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as l
  on conflict (user_id, product_id, size)
  do update set quantity = least(public.cart_items.quantity + excluded.quantity, 20);
end;
$$;

revoke all on function public.replace_cart(jsonb) from public;
grant execute on function public.replace_cart(jsonb) to authenticated;

-- Live updates: lets a device hear about cart changes made on another device.
-- (Also switch Realtime on for the table under Database -> Replication if this
-- line reports the publication does not exist.)
do $$
begin
  alter publication supabase_realtime add table public.cart_items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

alter table public.cart_items replica identity full;
