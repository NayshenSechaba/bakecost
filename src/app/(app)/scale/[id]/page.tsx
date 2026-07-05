'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Recipe, RecipeIngredient, Ingredient } from '@/types';
import {
  formatZAR,
  scaleQty,
  suggestedPrice,
  scaledTotalCost,
  unitLabel,
} from '@/lib/utils';
import {
  ArrowLeft,
  ClipboardCheck,
  Minus,
  Plus,
  ChefHat,
  Check,
  X,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';

type RI = RecipeIngredient & { ingredient: Ingredient };

export default function ScaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ris, setRis] = useState<RI[]>([]);
  const [loading, setLoading] = useState(true);

  const [batchSize, setBatchSize] = useState(0);
  const [sliderMax, setSliderMax] = useState(10);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logNotes, setLogNotes] = useState('');
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    const { data: r } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', params.id)
      .single();

    const { data: riData } = await supabase
      .from('recipe_ingredients')
      .select('*, ingredient:ingredients(*)')
      .eq('recipe_id', params.id);

    if (r) {
      setRecipe(r);
      setBatchSize(r.base_batch_size);
      setSliderMax(Math.max(r.base_batch_size * 10, 100));
    }
    setRis((riData as RI[]) ?? []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const totalCost = useMemo(() => {
    if (!recipe) return 0;
    return scaledTotalCost(ris, recipe.base_batch_size, batchSize);
  }, [ris, recipe, batchSize]);

  const costPerUnit = batchSize > 0 ? totalCost / batchSize : 0;
  const price = recipe ? suggestedPrice(costPerUnit, recipe.target_margin_pct) : 0;
  const scaleFactor = recipe && recipe.base_batch_size > 0 ? batchSize / recipe.base_batch_size : 1;

  function adjustBatch(delta: number) {
    setBatchSize((prev) => Math.max(1, Math.round(prev + delta)));
  }

  async function handleLog() {
    if (!recipe) return;
    setLogging(true);

    // 1. Insert production log
    const { error: logErr } = await supabase.from('production_log').insert({
      recipe_id: recipe.id,
      batch_size_made: batchSize,
      total_cost: totalCost,
      notes: logNotes.trim() || null,
      date: new Date().toISOString(),
    });

    if (logErr) {
      addToast('Failed to log bake', 'error');
      setLogging(false);
      return;
    }

    // 2. Deduct stock from each ingredient
    const updates = ris.map(async (ri) => {
      const used = scaleQty(ri.quantity_at_base, recipe.base_batch_size, batchSize);
      const newStock = Math.max(0, ri.ingredient.current_stock - used);
      await supabase
        .from('ingredients')
        .update({ current_stock: newStock })
        .eq('id', ri.ingredient_id);
    });

    await Promise.all(updates);

    addToast('Bake logged! Stock updated.', 'success');
    setShowLogModal(false);
    setLogNotes('');
    setLogging(false);

    setTimeout(() => router.push('/dashboard'), 1200);
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ paddingTop: 120 }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="page-body" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: 'var(--text-secondary)' }}>Recipe not found</p>
        <Link href="/recipes" className="btn btn-secondary" style={{ marginTop: 16 }}>Back to recipes</Link>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="page-header">
        <Link href="/scale" className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {recipe.name}
          </h1>
        </div>
      </div>

      <div className="page-body">

        {/* Batch size control */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Batch Size
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <button
              className="btn btn-secondary"
              style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', flexShrink: 0 }}
              onClick={() => adjustBatch(-1)}
            >
              <Minus size={18} />
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                {batchSize}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                units  ·  {scaleFactor.toFixed(2)}× base
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', flexShrink: 0 }}
              onClick={() => adjustBatch(1)}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Slider */}
          <div className="slider-wrap">
            <input
              type="range"
              min={1}
              max={sliderMax}
              step={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, var(--accent) ${(batchSize / sliderMax) * 100}%, var(--border) ${(batchSize / sliderMax) * 100}%)`
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>1</span>
              <span>Base: {recipe.base_batch_size}</span>
              <span>{sliderMax}</span>
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[1, 2, 3, 5].map((mult) => {
              const val = Math.round(recipe.base_batch_size * mult);
              return (
                <button
                  key={mult}
                  className={`btn btn-sm ${batchSize === val ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setBatchSize(val)}
                >
                  {mult}×
                </button>
              );
            })}
            <input
              type="number"
              className="input"
              min="1"
              placeholder="Custom"
              style={{ width: 90, padding: '8px 10px', fontSize: 13 }}
              value=""
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v > 0) setBatchSize(v);
              }}
            />
          </div>
        </div>

        {/* Ingredient breakdown */}
        {ris.length > 0 && (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Ingredients (scaled)
            </div>
            {ris.map((ri) => {
              const scaledQ = scaleQty(ri.quantity_at_base, recipe.base_batch_size, batchSize);
              const cost = scaledQ * ri.ingredient.cost_per_unit;
              return (
                <div key={ri.id} className="cost-row">
                  <div style={{ flex: 1 }}>
                    <div className="cost-row-name">{ri.ingredient.name}</div>
                    <div className="cost-row-qty">
                      {scaledQ % 1 === 0 ? scaledQ : scaledQ.toFixed(2)} {unitLabel(ri.ingredient.unit)}
                    </div>
                  </div>
                  <div className="cost-row-cost">{formatZAR(cost)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Price summary */}
        <div className="price-cards">
          <div className="price-card featured">
            <div className="price-card-label">Suggested Selling Price</div>
            <div className="price-card-value">{formatZAR(price * batchSize)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {formatZAR(price)} per unit · {recipe.target_margin_pct}% margin
            </div>
          </div>
          <div className="price-card">
            <div className="price-card-label">Total Cost</div>
            <div className="price-card-value" style={{ fontSize: 20 }}>{formatZAR(totalCost)}</div>
          </div>
          <div className="price-card">
            <div className="price-card-label">Cost / Unit</div>
            <div className="price-card-value" style={{ fontSize: 20 }}>{formatZAR(costPerUnit)}</div>
          </div>
        </div>

        {/* Log this bake */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={() => setShowLogModal(true)}
          style={{ marginTop: 4 }}
        >
          <ClipboardCheck size={20} />
          Log This Bake
        </button>

      </div>

      {/* Log modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLogModal(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Log This Bake</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLogModal(false)} style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Recipe</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{recipe.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Batch size</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{batchSize} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Total cost</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{formatZAR(totalCost)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                ⚠️ This will deduct ingredient quantities from your stock
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 20 }}>
              <label className="input-label">Notes (optional)</label>
              <textarea
                className="input"
                placeholder="Any notes about this bake…"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                rows={3}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary btn-full" onClick={() => setShowLogModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-full" onClick={handleLog} disabled={logging}>
                {logging ? <div className="spinner" /> : <Check size={16} />}
                {logging ? 'Logging…' : 'Confirm Bake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
