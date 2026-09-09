-- Analytics Tables & Settings

-- 1. Wastage Log
create table if not exists public.wastage_log (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid,
  item_type text not null check (item_type in ('ingredient', 'recipe', 'other')),
  item_id uuid, -- Optional reference, might be null if item is deleted
  item_name text not null,
  quantity numeric(10,2) not null,
  unit text,
  cost_lost numeric(10,2) not null,
  reason text,
  date timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Ingredient Price History
create table if not exists public.ingredient_price_history (
  id uuid primary key default uuid_generate_v4(),
  ingredient_id uuid references public.ingredients(id) on delete cascade,
  old_price numeric(10,4) not null,
  new_price numeric(10,4) not null,
  date timestamptz default now()
);

-- Trigger Function for Price History
create or replace function log_ingredient_price_change()
returns trigger as $$
begin
  if old.cost_per_unit is distinct from new.cost_per_unit then
    insert into public.ingredient_price_history (ingredient_id, old_price, new_price)
    values (new.id, old.cost_per_unit, new.cost_per_unit);
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger on ingredients table
drop trigger if exists trigger_log_ingredient_price_change on public.ingredients;
create trigger trigger_log_ingredient_price_change
  after update on public.ingredients
  for each row
  execute function log_ingredient_price_change();

-- 3. Bakery Settings
create table if not exists public.bakery_settings (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid, -- For multi-tenancy later
  monthly_overhead_target numeric(10,2) default 0,
  report_widgets_config jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Insert a default settings row if none exists
insert into public.bakery_settings (monthly_overhead_target, report_widgets_config)
select 5000, '["top-products", "break-even"]'::jsonb
where not exists (select 1 from public.bakery_settings);
