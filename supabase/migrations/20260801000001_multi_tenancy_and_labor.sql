-- 1. Create Bakeries table
create table if not exists public.bakeries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  bakery_id uuid references public.bakeries(id) on delete cascade,
  role text check (role in ('owner', 'staff')) default 'owner',
  created_at timestamptz default now()
);

-- 3. Add foreign keys to existing tables
alter table public.ingredients 
  add constraint ingredients_bakery_id_fkey 
  foreign key (bakery_id) references public.bakeries(id) on delete cascade;

alter table public.recipes 
  add constraint recipes_bakery_id_fkey 
  foreign key (bakery_id) references public.bakeries(id) on delete cascade;

alter table public.production_log 
  add constraint production_log_bakery_id_fkey 
  foreign key (bakery_id) references public.bakeries(id) on delete cascade;

-- 4. Add labor fields to recipes
alter table public.recipes 
  add column if not exists labor_time_mins numeric(10,2) not null default 0,
  add column if not exists labor_rate_per_hour numeric(10,2) not null default 0;

-- 5. Recreate View: recipe costs (including labor cost)
drop view if exists public.recipe_costs;

create or replace view public.recipe_costs as
select
  r.id as recipe_id,
  r.bakery_id,
  r.name as recipe_name,
  r.base_batch_size,
  r.target_margin_pct,
  r.labor_time_mins,
  r.labor_rate_per_hour,
  coalesce(sum(ri.quantity_at_base * i.cost_per_unit), 0) as base_ingredient_cost,
  ((r.labor_time_mins / 60.0) * r.labor_rate_per_hour) as base_labor_cost,
  (coalesce(sum(ri.quantity_at_base * i.cost_per_unit), 0) + ((r.labor_time_mins / 60.0) * r.labor_rate_per_hour)) as base_total_cost,
  case when r.base_batch_size > 0
    then (coalesce(sum(ri.quantity_at_base * i.cost_per_unit), 0) + ((r.labor_time_mins / 60.0) * r.labor_rate_per_hour)) / r.base_batch_size
    else 0
  end as cost_per_unit
from public.recipes r
left join public.recipe_ingredients ri on ri.recipe_id = r.id
left join public.ingredients i on i.id = ri.ingredient_id
group by r.id, r.name, r.base_batch_size, r.target_margin_pct, r.labor_time_mins, r.labor_rate_per_hour;

-- 6. Enable Row Level Security (RLS)
alter table public.bakeries enable row level security;
alter table public.profiles enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.production_log enable row level security;

-- 7. Helper function to get active user's bakery_id
create or replace function public.get_user_bakery_id()
returns uuid
security definer
stable
as $$
  select bakery_id from public.profiles where id = auth.uid();
$$ language sql;

-- 8. Setup RLS Policies

-- Bakeries policies
create policy "Authenticated users can create a bakery"
  on public.bakeries for insert
  to authenticated
  with check (true);

create policy "Users can view their own bakery details"
  on public.bakeries for select
  to authenticated
  using (id = public.get_user_bakery_id());

create policy "Users can update their own bakery details"
  on public.bakeries for update
  to authenticated
  using (id = public.get_user_bakery_id());

-- Profiles policies
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can view profiles in their bakery"
  on public.profiles for select
  to authenticated
  using (bakery_id = public.get_user_bakery_id() or id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Ingredients policies
create policy "Enforce bakery isolation on ingredients"
  on public.ingredients for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- Recipes policies
create policy "Enforce bakery isolation on recipes"
  on public.recipes for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- RecipeIngredients policies
create policy "Enforce bakery isolation on recipe ingredients"
  on public.recipe_ingredients for all
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
      and r.bakery_id = public.get_user_bakery_id()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
      and r.bakery_id = public.get_user_bakery_id()
    )
  );

-- ProductionLog policies
create policy "Enforce bakery isolation on production logs"
  on public.production_log for all
  to authenticated
  using (bakery_id = public.get_user_bakery_id())
  with check (bakery_id = public.get_user_bakery_id());

-- 9. Setup signup trigger for auto profile/bakery creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_bakery_id uuid;
  bakery_name text;
begin
  bakery_name := coalesce(new.raw_user_meta_data->>'bakery_name', 'My Bakery');
  
  insert into public.bakeries (name)
  values (bakery_name)
  returning id into new_bakery_id;
  
  insert into public.profiles (id, bakery_id, role)
  values (new.id, new_bakery_id, 'owner');
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

