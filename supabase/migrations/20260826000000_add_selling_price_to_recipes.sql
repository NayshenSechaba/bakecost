-- Migration: Add actual retail selling price to recipes table
ALTER TABLE public.recipes ADD COLUMN selling_price NUMERIC DEFAULT 0 NOT NULL;
