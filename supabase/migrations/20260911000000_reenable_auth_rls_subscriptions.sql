-- =============================================================
-- Migration: Re-enable Auth, RLS, Subscriptions, Team Invites
-- =============================================================

-- 1. Re-enable RLS on all existing tables
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.production_log enable row level security;
alter table public.bakeries enable row level security;
alter table public.profiles enable row level security;
alter table public.wastage_log enable row level security;
alter table public.bakery_settings enable row level security;
alter table public.ingredient_price_history enable row level security;

-- 2. Create bakery_invites table
create table if not exists public.bakery_invites (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz default now()
);

alter table public.bakery_invites enable row level security;

-- 3. Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid not null references public.bakeries(id) on delete cascade unique,
  plan text not null default 'free' check (plan in ('free', 'monthly', 'annual')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'past_due')),
  paystack_customer_id text,
  paystack_subscription_code text,
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- 4. Add FK for wastage_log.bakery_id and bakery_settings.bakery_id
-- (only if not already set)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'wastage_log_bakery_id_fkey'
  ) then
    alter table public.wastage_log
      add constraint wastage_log_bakery_id_fkey
      foreign key (bakery_id) references public.bakeries(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'bakery_settings_bakery_id_fkey'
  ) then
    alter table public.bakery_settings
      add constraint bakery_settings_bakery_id_fkey
      foreign key (bakery_id) references public.bakeries(id) on delete cascade;
  end if;
end $$;

-- 5. RLS Policies for NEW tables

-- bakery_invites: owners of the bakery can manage invites
create policy "Owners can manage invites for their bakery"
  on public.bakery_invites for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- subscriptions: users can view their own bakery subscription
create policy "Users can view their bakery subscription"
  on public.subscriptions for select
  to authenticated
  using (bakery_id = public.get_user_bakery_id());

-- wastage_log: bakery isolation
create policy "Enforce bakery isolation on wastage_log"
  on public.wastage_log for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- bakery_settings: bakery isolation
create policy "Enforce bakery isolation on bakery_settings"
  on public.bakery_settings for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- ingredient_price_history: via ingredient's bakery
create policy "Enforce bakery isolation on ingredient_price_history"
  on public.ingredient_price_history for all
  to authenticated
  using (
    exists (
      select 1 from public.ingredients i
      where i.id = ingredient_id
      and i.bakery_id = public.get_user_bakery_id()
    )
  )
  with check (
    exists (
      select 1 from public.ingredients i
      where i.id = ingredient_id
      and i.bakery_id = public.get_user_bakery_id()
    )
  );

-- 6. Update handle_new_user trigger to support invites + subscriptions
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_bakery_id uuid;
  bakery_name text;
  invite_record record;
begin
  -- Check if there's a pending invite for this email
  select * into invite_record
  from public.bakery_invites
  where lower(invited_email) = lower(new.email)
    and status = 'pending'
  limit 1;

  if invite_record.id is not null then
    -- Join existing bakery from the invite
    insert into public.profiles (id, bakery_id, role)
    values (new.id, invite_record.bakery_id, invite_record.role);

    -- Mark invite as accepted
    update public.bakery_invites
    set status = 'accepted'
    where id = invite_record.id;
  else
    -- Create a new bakery
    bakery_name := coalesce(new.raw_user_meta_data->>'bakery_name', 'My Bakery');

    insert into public.bakeries (name)
    values (bakery_name)
    returning id into new_bakery_id;

    -- Create owner profile
    insert into public.profiles (id, bakery_id, role)
    values (new.id, new_bakery_id, 'owner');

    -- Create free subscription
    insert into public.subscriptions (bakery_id, plan, status)
    values (new_bakery_id, 'free', 'active');

    -- Create default bakery settings
    insert into public.bakery_settings (bakery_id, monthly_overhead_target, report_widgets_config)
    values (new_bakery_id, 5000, '["top-products", "break-even"]'::jsonb);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Recreate the trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
