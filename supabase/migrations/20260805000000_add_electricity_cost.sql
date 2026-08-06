-- Migration: Add electricity cost column to recipes
ALTER TABLE public.recipes ADD COLUMN electricity_cost NUMERIC DEFAULT 0 NOT NULL;
