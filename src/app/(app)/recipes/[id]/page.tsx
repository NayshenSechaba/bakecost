'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ingredient, RecipeIngredient } from '@/types';
import { formatZAR, unitLabel } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChefHat,
  ShoppingBasket,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';
import Link from 'next/link';

export default function RecipeBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [recipeName, setRecipeName] = useState('');
  const [baseBatchSize, setBaseBatchSize] = useState('12');
  const [targetMargin, setTargetMargin] = useState('60');
  const [recipeIngredients, setRecipeIngredients] = useState<
    (Partial<RecipeIngredient> & { ingredient?: Ingredient; _tempId?: string })[]
  >([]);

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Add ingredient row state
  const [addIngId, setAddIngId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  const load = useCallback(async () => {
    const { data: ings } = await supabase.from('ingredients').select('*').order('name');
    setAllIngredients(ings ?? []);

    if (!isNew) {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', params.id)
        .single();
      if (recipe) {
        setRecipeName(recipe.name);
        setBaseBatchSize(String(recipe.base_batch_size));
        setTargetMargin(String(recipe.target_margin_pct));
      }
      const { data: ris } = await supabase
        .from('recipe_ingredients')
        .select('*, ingredient:ingredients(*)')
        .eq('recipe_id', params.id);
      setRecipeIngredients(ris ?? []);
      setLoading(false);
    }
  }, [isNew, params.id]);

  useEffect(() => { load(); }, [load]);

  function addIngredientRow() {
    if (!addIngId) { addToast('Select an ingredient', 'error'); return; }
    if (!addQty || isNaN(Number(addQty)) || Number(addQty) <= 0) {
      addToast('Enter a valid quantity', 'error'); return;
    }
    const ing = allIngredients.find((i) => i.id === addIngId);
    if (!ing) return;
    const already = recipeIngredients.find((ri) => ri.ingredient_id === addIngId);
    if (already) { addToast('Ingredient already added', 'error'); return; }

    setRecipeIngredients((prev) => [
      ...prev,
      {
        _tempId: Math.random().toString(36).slice(2),
        ingredient_id: addIngId,
        quantity_at_base: Number(addQty),
        ingredient: ing,
      },
    ]);
    setAddIngId('');
    setAddQty('');
    setShowAddRow(false);
  }

  function removeRow(index: number) {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  const baseCost = recipeIngredients.reduce((sum, ri) => {
    const cpu = ri.ingredient?.cost_per_unit ?? 0;
    return sum + (ri.quantity_at_base ?? 0) * cpu;
  }, 0);

  async function handleSave() {
    if (!recipeName.trim()) { addToast('Recipe name required', 'error'); return; }
    if (!baseBatchSize || Number(baseBatchSize) <= 0) { addToast('Enter a valid batch size', 'error'); return; }
    if (recipeIngredients.length === 0) { addToast('Add at least one ingredient', 'error'); return; }

    setSaving(true);

    let recipeId = isNew ? null : (params.id as string);

    const recipePayload = {
      name: recipeName.trim(),
      base_batch_size: Number(baseBatchSize),
      target_margin_pct: Number(targetMargin) || 60,
    };

    if (isNew) {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipePayload)
        .select()
        .single();
      if (error || !data) {
        addToast('Failed to save recipe', 'error');
        setSaving(false);
        return;
      }
      recipeId = data.id;
    } else {
      const { error } = await supabase
        .from('recipes')
        .update(recipePayload)
        .eq('id', recipeId!);
      if (error) {
        addToast('Failed to update recipe', 'error');
        setSaving(false);
        return;
      }
      // Delete existing RIs and re-insert
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId!);
    }

    const riPayload = recipeIngredients.map((ri) => ({
      recipe_id: recipeId!,
      ingredient_id: ri.ingredient_id!,
      quantity_at_base: ri.quantity_at_base!,
    }));

    const { error: riErr } = await supabase.from('recipe_ingredients').insert(riPayload);
    if (riErr) {
      addToast('Recipe saved but ingredients failed', 'error');
      setSaving(false);
      return;
    }

    addToast(isNew ? 'Recipe created!' : 'Recipe updated!', 'success');
    setTimeout(() => router.push(`/scale/${recipeId}`), 800);
    setSaving(false);
  }

  const availableIngredients = allIngredients.filter(
    (i) => !recipeIngredients.find((ri) => ri.ingredient_id === i.id)
  );

  if (loading) {
    return (
      <div className="flex-center" style={{ paddingTop: 120 }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <Link href="/recipes" className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">{isNew ? 'New Recipe' : 'Edit Recipe'}</h1>
      </div>

      <div className="page-body">

        {/* Recipe details */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Recipe Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Recipe Name</label>
              <input
                className="input"
                placeholder="e.g. Chocolate Muffins"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Base Batch (units)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="12"
                  value={baseBatchSize}
                  onChange={(e) => setBaseBatchSize(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Target Margin %</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="99"
                  placeholder="60"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ingredients
            </span>
            {!showAddRow && allIngredients.length > 0 && availableIngredients.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddRow(true)}
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>

          {recipeIngredients.length === 0 && !showAddRow ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <ShoppingBasket size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
              {allIngredients.length === 0 ? (
                <>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>No ingredients in your app yet</div>
                  <Link href="/ingredients" className="btn btn-secondary btn-sm">
                    <Plus size={14} /> Add Ingredients First
                  </Link>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>No ingredients added yet</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddRow(true)}>
                    <Plus size={14} /> Add Ingredient
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recipeIngredients.map((ri, i) => (
                <div key={ri.id ?? ri._tempId} className="cost-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ri.ingredient?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {ri.quantity_at_base} {unitLabel(ri.ingredient?.unit ?? '')} ·{' '}
                      {formatZAR((ri.quantity_at_base ?? 0) * (ri.ingredient?.cost_per_unit ?? 0))}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeRow(i)}
                    style={{ padding: '4px 6px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add row */}
          {showAddRow && (
            <div style={{ marginTop: 14, padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="input-group">
                <label className="input-label">Ingredient</label>
                <select className="input" value={addIngId} onChange={(e) => setAddIngId(e.target.value)}>
                  <option value="">Select ingredient…</option>
                  {availableIngredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({unitLabel(i.unit)})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">
                  Quantity at base batch ({baseBatchSize || '?'} units)
                </label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 250"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                />
              </div>
              {allIngredients.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--warning)' }}>
                  ⚠️ No ingredients yet. <Link href="/ingredients" style={{ color: 'var(--accent)' }}>Add some first</Link>
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm btn-full" onClick={() => setShowAddRow(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm btn-full" onClick={addIngredientRow}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cost preview */}
        {recipeIngredients.length > 0 && (
          <div className="card" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(232,168,56,0.2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Cost Preview (base batch)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{formatZAR(baseCost)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {baseBatchSize && Number(baseBatchSize) > 0
                    ? `${formatZAR(baseCost / Number(baseBatchSize))} per unit`
                    : 'Set batch size'}
                </div>
              </div>
              <ChefHat size={32} color="var(--accent)" style={{ opacity: 0.4 }} />
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <div className="spinner" /> : <Check size={18} />}
          {saving ? 'Saving…' : isNew ? 'Create Recipe' : 'Save Changes'}
        </button>

      </div>
    </>
  );
}
