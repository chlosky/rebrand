-- Extensible digital catalog: access models, delivery types, Stripe grant rules.

alter table public.digital_products
  add column if not exists access_model text not null default 'lifetime',
  add column if not exists delivery text not null default 'reader',
  add column if not exists preview_path text,
  add column if not exists description text;

alter table public.digital_products
  drop constraint if exists digital_products_access_model_check;

alter table public.digital_products
  add constraint digital_products_access_model_check
  check (access_model in ('lifetime', 'subscription', 'rental'));

alter table public.digital_products
  drop constraint if exists digital_products_delivery_check;

alter table public.digital_products
  add constraint digital_products_delivery_check
  check (delivery in ('reader', 'spa', 'external'));

comment on column public.digital_products.access_model is
  'lifetime = permanent purchase access; subscription = expires_at required; rental = time-boxed access';

comment on column public.digital_products.delivery is
  'reader = server-rendered guide; spa = React route; external = off-site or future native app deep link';

update public.digital_products
set
  access_model = 'lifetime',
  delivery = 'reader',
  preview_path = '/palette-plotting-guide',
  description = 'The Palette Plot 4-Board Rebrand & Vision Board Method'
where slug = 'palette-plotting-guide';

-- Stripe grant rules: buying a given Stripe Price grants a digital product.
-- grant_source: 'stripe_price' = matched by line-item price id; 'stripe_board_order' =
-- granted directly by the board-order webhook (boards use inline price_data, no price id).
create table if not exists public.digital_product_grants (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.digital_products (slug) on delete cascade,
  stripe_price_id text not null,
  grant_source text not null default 'stripe_price',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (stripe_price_id, product_slug)
);

create index if not exists digital_product_grants_price_idx
  on public.digital_product_grants (stripe_price_id)
  where active = true;

alter table public.digital_product_grants enable row level security;

grant all on public.digital_product_grants to service_role;

-- No seed rows: physical boards are sold via inline Stripe price_data and grant the guide
-- directly in the board-order webhook. Add rows here when a real Stripe Price id should
-- grant a digital product (e.g. a bundle price).

-- Active entitlement = not revoked and not past expires_at (null expires_at = permanent).
create or replace function public.digital_entitlement_is_active(
  p_revoked_at timestamptz,
  p_expires_at timestamptz
) returns boolean
language sql
immutable
as $$
  select p_revoked_at is null
    and (p_expires_at is null or p_expires_at > now());
$$;
