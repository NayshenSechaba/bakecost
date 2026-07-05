export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unit';

export interface Ingredient {
  id: string;
  bakery_id?: string;
  name: string;
  unit: Unit;
  cost_per_unit: number;
  current_stock: number;
  low_stock_threshold: number;
  created_at?: string;
}

export interface Recipe {
  id: string;
  bakery_id?: string;
  name: string;
  base_batch_size: number;
  target_margin_pct: number;
  created_at?: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity_at_base: number;
  ingredient?: Ingredient;
}

export interface ProductionLog {
  id: string;
  bakery_id?: string;
  recipe_id: string;
  batch_size_made: number;
  date?: string;
  total_cost?: number;
  notes?: string;
  created_at?: string;
  recipe?: Recipe;
}

export interface RecipeCost {
  recipe_id: string;
  recipe_name: string;
  base_batch_size: number;
  target_margin_pct: number;
  base_total_cost: number;
  cost_per_unit: number;
}
