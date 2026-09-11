'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Recipe, Ingredient } from '@/types';
import { formatZAR, calculateLaborCost, suggestedPrice } from '@/lib/utils';
import {
  Plus,
  BookOpen,
  ChefHat,
  Pencil,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import UpgradePrompt from '@/components/UpgradePrompt';
import { useRouter } from 'next/navigation';

export default function RecipesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toasts, addToast } = useToast();
  const { planLimits } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
 
  const load = useCallback(async () => {
    const [recipesRes, ingredientsRes] = await Promise.all([
      supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('ingredients')
        .select('*')
    ]);

    setRecipes(recipesRes.data ?? []);
    setAllIngredients(ingredientsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getRecipeMarginStatus = (recipe: any) => {
    const baseIngredientCost = (recipe.recipe_ingredients ?? []).reduce((sum: number, ri: any) => {
      const ing = allIngredients.find(i => i.id === ri.ingredient_id);
      const cpu = ing?.cost_per_unit ?? 0;
      return sum + (ri.quantity_at_base ?? 0) * cpu;
    }, 0);

    const laborRate = recipe.labor_rate_per_hour ?? 0;
    const laborMins = recipe.labor_time_mins ?? 0;
    const baseLaborCost = (laborMins / 60) * laborRate;

    const baseElecCost = recipe.electricity_cost ?? 0;
    const baseUtilityCost = recipe.utility_cost ?? 0;

    const pkgIng = allIngredients.find(i => i.id === recipe.packaging_ingredient_id);
    const basePackagingCost = pkgIng ? (pkgIng.cost_per_unit * (recipe.base_batch_size ?? 0)) : 0;

    const totalCost = baseIngredientCost + baseLaborCost + baseElecCost + basePackagingCost + baseUtilityCost;
    const sellingPrice = recipe.selling_price ?? 0;
    const targetMargin = recipe.target_margin_pct ?? 60;

    if (sellingPrice <= 0) {
      return { status: 'no_price', margin: 0, targetMargin };
    }

    const actualMargin = ((sellingPrice - totalCost) / sellingPrice) * 100;
    return {
      status: actualMargin >= targetMargin ? 'profitable' : 'under_margin',
      margin: actualMargin,
      targetMargin
    };
  };

  async function handleDelete(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
      addToast('Could not delete recipe', 'error');
    } else {
      addToast('Recipe deleted', 'success');
      load();
    }
    setDeleteId(null);
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <h1 className="page-title">Recipes</h1>
        <span className="badge badge-accent">{recipes.length}</span>
        <button
          onClick={() => {
            if (planLimits && recipes.length >= planLimits.maxRecipes) {
              setShowUpgradeModal(true);
            } else {
              router.push('/recipes/new');
            }
          }}
          className="btn btn-primary btn-sm hidden md:inline-flex"
        >
          <Plus size={16} /> New Recipe
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="flex-center" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BookOpen size={32} /></div>
            <div className="empty-title">No recipes yet</div>
            <div className="empty-sub">Create your first recipe to start costing batches</div>
            <button 
              onClick={() => {
                if (planLimits && recipes.length >= planLimits.maxRecipes) {
                  setShowUpgradeModal(true);
                } else {
                  router.push('/recipes/new');
                }
              }} 
              className="btn btn-primary" 
              style={{ marginTop: 8 }}
            >
              <Plus size={16} /> New Recipe
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => {
              const marginInfo = getRecipeMarginStatus(recipe);
              return (
                <div key={recipe.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div className="list-item-icon">
                      <ChefHat size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{recipe.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                        Base batch: {recipe.base_batch_size} units · {recipe.target_margin_pct}% target
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {marginInfo.status === 'under_margin' && (
                          <span style={{ fontSize: 11, background: 'rgba(244, 67, 54, 0.08)', border: '1px solid rgba(244, 67, 54, 0.15)', color: '#e57373', padding: '2px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                            ⚠️ Under margin: {marginInfo.margin.toFixed(0)}% (Target {marginInfo.targetMargin}%)
                          </span>
                        )}
                        {marginInfo.status === 'profitable' && (
                          <span style={{ fontSize: 11, background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.15)', color: '#81c784', padding: '2px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                            ✔ Profitable: {marginInfo.margin.toFixed(0)}%
                          </span>
                        )}
                        {marginInfo.status === 'no_price' && (
                          <span style={{ fontSize: 11, background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>
                            💡 No retail price set
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link
                    href={`/scale/${recipe.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <TrendingUp size={14} /> Scale & Cost
                  </Link>
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px 12px' }}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '8px 12px' }}
                    onClick={() => setDeleteId(recipe.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {!loading && recipes.length > 0 && (
        <button 
          onClick={() => {
            if (planLimits && recipes.length >= planLimits.maxRecipes) {
              setShowUpgradeModal(true);
            } else {
              router.push('/recipes/new');
            }
          }}
          className="fab" 
          aria-label="New recipe"
        >
          <Plus size={24} />
        </button>
      )}

      <UpgradePrompt
        feature="Unlimited Recipes"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-sheet" style={{ padding: 24 }}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete recipe?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                All recipe ingredients will also be deleted. Production logs will be kept.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-full" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger btn-full" onClick={() => handleDelete(deleteId!)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
