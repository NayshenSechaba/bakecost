'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ingredient, RecipeIngredient } from '@/types';
import { formatZAR, unitLabel, calculateLaborCost, suggestedPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChefHat,
  ShoppingBasket,
  Clock,
  X,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';
import { useAuth } from '@/components/AuthProvider';
import ProductTile from '@/components/ProductTile';
import CostBreakdownBar from '@/components/CostBreakdownBar';
import Link from 'next/link';

export default function RecipeBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const supabase = createClient();
  const { toasts, addToast } = useToast();
  const { bakeryId } = useAuth();

  const [recipeName, setRecipeName] = useState('');
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [baseBatchSize, setBaseBatchSize] = useState('12');
  const [targetMargin, setTargetMargin] = useState('60');
  const [laborTimeMins, setLaborTimeMins] = useState('0');
  const [laborRatePerHour, setLaborRatePerHour] = useState('0');
  const [electricityCost, setElectricityCost] = useState('0');
  const [utilityCost, setUtilityCost] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');
  const [packagingIngredientId, setPackagingIngredientId] = useState<string>('');
  
  const [recipeIngredients, setRecipeIngredients] = useState<
    (Partial<RecipeIngredient> & { ingredient?: Ingredient; _tempId?: string })[]
  >([]);

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Margin Calculator States
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [rent, setRent] = useState('');
  const [electricity, setElectricity] = useState('');
  const [transport, setTransport] = useState('');
  const [otherOverheads, setOtherOverheads] = useState('');
  const [monthlyIngredients, setMonthlyIngredients] = useState('');
  const [desiredProfit, setDesiredProfit] = useState('');

  const recommendedMarginInfo = useMemo(() => {
    const r = parseFloat(rent) || 0;
    const e = parseFloat(electricity) || 0;
    const t = parseFloat(transport) || 0;
    const o = parseFloat(otherOverheads) || 0;
    const ing = parseFloat(monthlyIngredients) || 0;
    const profit = parseFloat(desiredProfit) || 0;

    const totalOverheads = r + e + t + o;
    const totalRevenueNeeded = ing + totalOverheads + profit;

    if (totalRevenueNeeded <= 0 || ing <= 0) return null;

    const margin = ((totalOverheads + profit) / totalRevenueNeeded) * 100;
    return {
      margin: Math.round(margin),
      totalOverheads,
      totalRevenueNeeded,
      ingredientsPercent: (ing / totalRevenueNeeded) * 100,
      overheadsPercent: (totalOverheads / totalRevenueNeeded) * 100,
      profitPercent: (profit / totalRevenueNeeded) * 100,
    };
  }, [rent, electricity, transport, otherOverheads, monthlyIngredients, desiredProfit]);

  function applyRecommendedMargin() {
    if (recommendedMarginInfo) {
      setTargetMargin(String(recommendedMarginInfo.margin));
      addToast(`Applied ${recommendedMarginInfo.margin}% margin to recipe!`, 'success');
      setShowMarginModal(false);
    }
  }

  // Add ingredient row state
  const [addIngId, setAddIngId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  const load = useCallback(async () => {
    // Load all ingredients
    const { data: ings } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    setAllIngredients(ings ?? []);

    if (!isNew) {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', params.id)
        .single();
        
      if (recipe) {
        setRecipeName(recipe.name);
        setPhotoPath(recipe.photo_path ?? null);
        setBaseBatchSize(String(recipe.base_batch_size));
        setTargetMargin(String(recipe.target_margin_pct));
        setLaborTimeMins(String(recipe.labor_time_mins ?? 0));
        setLaborRatePerHour(String(recipe.labor_rate_per_hour ?? 0));
        setElectricityCost(String(recipe.electricity_cost ?? 0));
        setUtilityCost(String(recipe.utility_cost ?? 0));
        setSellingPrice(String(recipe.selling_price ?? 0));
        setPackagingIngredientId(recipe.packaging_ingredient_id ?? '');
      }
      
      const { data: ris } = await supabase
        .from('recipe_ingredients')
        .select('*, ingredient:ingredients(*)')
        .eq('recipe_id', params.id);
        
      setRecipeIngredients(ris ?? []);
    }
    setLoading(false);
  }, [isNew, params.id]);

  useEffect(() => {
    load();
  }, [load]);

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

  const baseIngredientCost = recipeIngredients.reduce((sum, ri) => {
    const cpu = ri.ingredient?.cost_per_unit ?? 0;
    return sum + (ri.quantity_at_base ?? 0) * cpu;
  }, 0);

  const baseLaborCost = calculateLaborCost(Number(laborTimeMins) || 0, Number(laborRatePerHour) || 0);
  const baseElectricityCost = Number(electricityCost) || 0;
  const baseUtilityCost = Number(utilityCost) || 0;
  const pkgIng = allIngredients.find(i => i.id === packagingIngredientId);
  const basePackagingCost = pkgIng ? (pkgIng.cost_per_unit * (Number(baseBatchSize) || 0)) : 0;
  const baseCost = baseIngredientCost + baseLaborCost + baseElectricityCost + basePackagingCost + baseUtilityCost;

  const sellingPriceVal = parseFloat(sellingPrice) || 0;
  const actualMarginPct = sellingPriceVal > 0 ? ((sellingPriceVal - baseCost) / sellingPriceVal) * 100 : 0;
  const marginTarget = parseFloat(targetMargin) || 60;
  const marginDiff = actualMarginPct - marginTarget;
  const recommendedSellingPrice = suggestedPrice(baseCost, marginTarget);

  async function handleSave() {
    if (!recipeName.trim()) { addToast('Recipe name required', 'error'); return; }
    if (!baseBatchSize || Number(baseBatchSize) <= 0) { addToast('Enter a valid batch size', 'error'); return; }
    if (recipeIngredients.length === 0) { addToast('Add at least one ingredient', 'error'); return; }

    setSaving(true);

    let recipeId = isNew ? null : (params.id as string);

    const recipePayload: any = {
      name: recipeName.trim(),
      base_batch_size: Number(baseBatchSize),
      target_margin_pct: Number(targetMargin) || 60,
      labor_time_mins: Number(laborTimeMins) || 0,
      labor_rate_per_hour: Number(laborRatePerHour) || 0,
      electricity_cost: Number(electricityCost) || 0,
      utility_cost: Number(utilityCost) || 0,
      selling_price: Number(sellingPrice) || 0,
      packaging_ingredient_id: packagingIngredientId || null,
    };
    if (isNew && bakeryId) {
      recipePayload.bakery_id = bakeryId;
    }

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

      {/* Detail Page Header Band */}
      <div className="page-header-band">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/recipes"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </Link>
            <ProductTile
              size="lg"
              photoPath={photoPath}
              name={recipeName || 'Recipe'}
              recipeId={isNew ? undefined : (params.id as string)}
              bakeryId={bakeryId ?? undefined}
              editable={!isNew}
              onPhotoUpdated={(newP) => setPhotoPath(newP)}
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">
                {recipeName || (isNew ? 'New Recipe' : 'Untitled Recipe')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isNew ? 'Configure recipe & cost breakdown' : `Base batch: ${baseBatchSize} units · ${targetMargin}% target margin`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recipe Configuration & Overheads */}
          <div className="md:col-span-7 flex flex-col gap-4">
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="input-label" style={{ margin: 0 }}>Target Margin %</label>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: 0, cursor: 'pointer' }}
                        onClick={() => setShowMarginModal(true)}
                      >
                        📊 Overheads Calculator
                      </button>
                    </div>
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

                <div className="input-group" style={{ marginTop: 12 }}>
                  <label className="input-label">Actual Batch Selling Price (R)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    The total retail price you charge customers for this entire base batch of {baseBatchSize || '12'} units.
                  </span>
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />
                
                {/* Labor fields */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Clock size={16} color="var(--accent)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Labor & Prep Costing
                  </span>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Prep Time (minutes)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={laborTimeMins}
                      onChange={(e) => setLaborTimeMins(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Labor Rate (R / hour)</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={laborRatePerHour}
                      onChange={(e) => setLaborRatePerHour(e.target.value)}
                    />
                  </div>
                </div>
                {baseLaborCost > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Base labor cost: <strong>{formatZAR(baseLaborCost)}</strong> for {laborTimeMins} mins
                  </div>
                )}

                <div className="divider" style={{ margin: '4px 0' }} />

                <div className="input-group">
                  <label className="input-label">⚡ Electricity Cost per Batch (R)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(e.target.value)}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Estimated electricity cost to bake one base batch (e.g. oven usage, mixer).
                  </span>
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />

                <div className="input-group">
                  <label className="input-label">💧 Utility Cost per Batch (R)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={utilityCost}
                    onChange={(e) => setUtilityCost(e.target.value)}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Other direct batch utilities (e.g. water, washing, cooking gas, cleaning supplies).
                  </span>
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />

                <div className="input-group">
                  <label className="input-label">📦 Recipe Packaging Material</label>
                  <select
                    className="input"
                    value={packagingIngredientId}
                    onChange={(e) => setPackagingIngredientId(e.target.value)}
                  >
                    <option value="">No packaging material selected</option>
                    {allIngredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({formatZAR(i.cost_per_unit)}/{i.unit} · {i.current_stock} in stock)
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Select a single packaging material (like a box or bag) used per baked unit. The cost scales with batch size and deducts from inventory.
                  </span>
                  {pkgIng && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                      Base packaging cost: <strong>{formatZAR(basePackagingCost)}</strong> ({formatZAR(pkgIng.cost_per_unit)} × {baseBatchSize} units)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ingredients & Sticky Cost Preview */}
          <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-20">
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
                      <Link href="/inventory" className="btn btn-secondary btn-sm">
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
                      ⚠️ No ingredients yet. <Link href="/inventory" style={{ color: 'var(--accent)' }}>Add some first</Link>
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
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Cost Preview (base batch)
                </div>

                {/* 4-Segment Cost Breakdown Bar */}
                <div className="mb-4">
                  <CostBreakdownBar
                    ingredientsCost={baseIngredientCost}
                    laborCost={baseLaborCost}
                    overheadCost={baseElectricityCost + basePackagingCost + baseUtilityCost}
                    sellingPrice={sellingPriceVal}
                    showLegend={true}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  <div className="flex-between" style={{ fontSize: 14 }}>
                    <span className="text-secondary">Ingredients:</span>
                    <span className="font-semibold">{formatZAR(baseIngredientCost)}</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: 14 }}>
                    <span className="text-secondary">Labor Time Cost:</span>
                    <span className="font-semibold">{formatZAR(baseLaborCost)}</span>
                  </div>
                  {baseElectricityCost > 0 && (
                    <div className="flex-between" style={{ fontSize: 14 }}>
                      <span className="text-secondary">Electricity Cost:</span>
                      <span className="font-semibold">{formatZAR(baseElectricityCost)}</span>
                    </div>
                  )}
                  {basePackagingCost > 0 && (
                    <div className="flex-between" style={{ fontSize: 14 }}>
                      <span className="text-secondary">Packaging Cost:</span>
                      <span className="font-semibold">{formatZAR(basePackagingCost)}</span>
                    </div>
                  )}
                  {baseUtilityCost > 0 && (
                    <div className="flex-between" style={{ fontSize: 14 }}>
                      <span className="text-secondary">Utility Cost:</span>
                      <span className="font-semibold">{formatZAR(baseUtilityCost)}</span>
                    </div>
                  )}
                  <div className="divider" />
                  <div className="flex-between">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Total Cost:</span>
                    <span className="font-bold text-accent" style={{ fontSize: 18 }}>{formatZAR(baseCost)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
                      {baseBatchSize && Number(baseBatchSize) > 0
                        ? `${formatZAR(baseCost / Number(baseBatchSize))} per unit`
                        : 'Set batch size'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Based on yield of {baseBatchSize} units
                    </div>
                  </div>
                </div>

                {sellingPriceVal > 0 ? (
                  <div style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: marginDiff >= 0 ? '#EAF5EC' : '#FBEAEB',
                    border: `1px solid ${marginDiff >= 0 ? '#C3E6CB' : '#F5C2C7'}`,
                    color: marginDiff >= 0 ? '#1E7E34' : '#A32D2D',
                    fontSize: 13,
                    lineHeight: 1.4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                      {marginDiff >= 0 ? '🎉 Profitable Batch' : '⚠️ Under Target Margin'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Your actual profit margin is <strong style={{ color: marginDiff >= 0 ? '#1E7E34' : '#A32D2D' }}>{actualMarginPct.toFixed(1)}%</strong> (Target is {marginTarget}%).
                    </div>
                    {marginDiff < 0 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-primary)' }}>
                        To hit your {marginTarget}% target margin, we recommend raising the selling price to{' '}
                        <strong style={{ color: 'var(--accent)' }}>{formatZAR(recommendedSellingPrice)}</strong> (current price {formatZAR(sellingPriceVal)}).
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    marginTop: 16,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#F4F1EC',
                    border: '1px dashed #E3DED6',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    lineHeight: 1.4
                  }}>
                    💡 Enter your **Actual Batch Selling Price** above to validate your recipe profit margins and see live alerts.
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleSave}
              disabled={saving}
              style={{ marginTop: 8 }}
            >
              {saving ? <div className="spinner" /> : <Check size={18} />}
              {saving ? 'Saving…' : isNew ? 'Create Recipe' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Overheads & Target Margin Calculator Modal */}
      {showMarginModal && (
        <div className="modal-overlay" onClick={() => setShowMarginModal(false)}>
          <div className="modal-sheet" style={{ maxHeight: '85dvh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Overheads & Margin Helper</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowMarginModal(false)} style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                This calculator helps you find the right markup margin % to cover your monthly bakery bills and salary, so you don't run at a loss!
              </p>

              {/* Monthly overhead inputs */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 1: Your Monthly Bills (Overheads)
                </span>
                
                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Rent / Space (R)</label>
                    <input className="input" type="number" placeholder="0" value={rent} onChange={(e) => setRent(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Elec & Gas (R)</label>
                    <input className="input" type="number" placeholder="0" value={electricity} onChange={(e) => setElectricity(e.target.value)} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label className="input-label">Transport / Fuel (R)</label>
                    <input className="input" type="number" placeholder="0" value={transport} onChange={(e) => setTransport(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Other Bills (R)</label>
                    <input className="input" type="number" placeholder="0" value={otherOverheads} onChange={(e) => setOtherOverheads(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Monthly Sales & Ingredients */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Step 2: Monthly Business Size
                </span>
                
                <div className="input-group">
                  <label className="input-label">Monthly Ingredients Spend (R)</label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={monthlyIngredients} 
                    onChange={(e) => setMonthlyIngredients(e.target.value)} 
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Approximate total cost of all raw ingredients you buy per month.
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">Your Desired Monthly Salary / Take-Home Profit (R)</label>
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="e.g. 6000" 
                    value={desiredProfit} 
                    onChange={(e) => setDesiredProfit(e.target.value)} 
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    How much money you want to take home clean as personal salary.
                  </span>
                </div>
              </div>

              {/* Calculation Result */}
              {recommendedMarginInfo ? (
                <div style={{ 
                  background: 'var(--accent-subtle)', 
                  borderRadius: 8, 
                  padding: 14, 
                  border: '1px solid rgba(232, 168, 56, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Recommended Pricing Formula
                  </div>
                  
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
                    {recommendedMarginInfo.margin}% Target Margin
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, marginTop: 4 }}>
                    <strong>How it works:</strong> <br />
                    To pay your bills (<strong>{formatZAR(recommendedMarginInfo.totalOverheads)}</strong>) and take home your desired salary (<strong>{formatZAR(parseFloat(desiredProfit) || 0)}</strong>) while buying ingredients (<strong>{formatZAR(parseFloat(monthlyIngredients) || 0)}</strong>), you need to achieve a total monthly revenue of <strong>{formatZAR(recommendedMarginInfo.totalRevenueNeeded)}</strong>.
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderRadius: 6, padding: 8, marginTop: 4 }}>
                    💡 <strong>Simple Rule:</strong> For every R 10.00 you spend on raw ingredients, you must charge your customers at least <strong>{formatZAR(10 / (1 - recommendedMarginInfo.margin / 100))}</strong>. This markup covers your overhead bills and salary!
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-full btn-lg"
                    style={{ marginTop: 6 }}
                    onClick={applyRecommendedMargin}
                  >
                    Apply {recommendedMarginInfo.margin}% Margin
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                  Enter ingredients spend and desired salary above to see recommended markup.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
