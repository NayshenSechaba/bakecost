-- Migration: Add utility cost column to recipes
ALTER TABLE public.recipes ADD COLUMN utility_cost NUMERIC DEFAULT 0 NOT NULL;
