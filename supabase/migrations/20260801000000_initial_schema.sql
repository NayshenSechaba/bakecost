-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Ingredients
create table if not exists public.ingredients (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid,
  name text not null,
  unit text not null check (unit in ('g','kg','ml','l','unit')),
  cost_per_unit numeric(10,4) not null,
  current_stock numeric(10,2) not null default 0,
  low_stock_threshold numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Recipes
create table if not exists public.recipes (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid,
  name text not null,
  base_batch_size numeric(10,2) not null,
  target_margin_pct numeric(5,2) not null default 60,
  created_at timestamptz default now()
);

-- RecipeIngredients (join table)
create table if not exists public.recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references public.recipes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete restrict,
  quantity_at_base numeric(10,4) not null
);

-- ProductionLog
create table if not exists public.production_log (
  id uuid primary key default uuid_generate_v4(),
  bakery_id uuid,
  recipe_id uuid references public.recipes(id) on delete set null,
  batch_size_made numeric(10,2) not null,
  date timestamptz default now(),
  total_cost numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

-- View: recipe base costs
create or replace view public.recipe_costs as
select
  r.id as recipe_id,
  r.name as recipe_name,
  r.base_batch_size,
  r.target_margin_pct,
  coalesce(sum(ri.quantity_at_base * i.cost_per_unit), 0) as base_total_cost,
  case when r.base_batch_size > 0
    then coalesce(sum(ri.quantity_at_base * i.cost_per_unit), 0) / r.base_batch_size
    else 0
  end as cost_per_unit
from public.recipes r
left join public.recipe_ingredients ri on ri.recipe_id = r.id
left join public.ingredients i on i.id = ri.ingredient_id
group by r.id, r.name, r.base_batch_size, r.target_margin_pct;
