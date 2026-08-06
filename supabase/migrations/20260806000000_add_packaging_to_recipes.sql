-- Migration: Add packaging ingredient reference to recipes table
ALTER TABLE public.recipes ADD COLUMN packaging_ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL;
