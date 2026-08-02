-- Disable Row Level Security (RLS) on all tables for now
alter table public.ingredients disable row level security;
alter table public.recipes disable row level security;
alter table public.recipe_ingredients disable row level security;
alter table public.production_log disable row level security;
alter table public.bakeries disable row level security;
alter table public.profiles disable row level security;
