'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ingredient, Unit } from '@/types';
import { formatZAR, unitLabel, stockStatus } from '@/lib/utils';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
  X,
  Check,
  Plus,
  ShoppingBasket,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';

const UNITS: Unit[] = ['g', 'kg', 'ml', 'l', 'unit'];

const EMPTY_FORM = {
  name: '',
  unit: 'g' as Unit,
  cost_per_unit: '',
  current_stock: '',
  low_stock_threshold: '',
};

export default function InventoryPage() {
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  // Add ingredient modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('current_stock', { ascending: true });
    setIngredients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Stock editing ──────────────────────────────────────────
  function openEdit(ing: Ingredient) {
    setEditId(ing.id);
    setEditStock(String(ing.current_stock));
    setEditThreshold(String(ing.low_stock_threshold));
  }

  function closeEdit() {
    setEditId(null);
    setEditStock('');
    setEditThreshold('');
  }

  async function handleSaveStock(ing: Ingredient) {
    setSaving(true);
    const { error } = await supabase
      .from('ingredients')
      .update({
        current_stock: Number(editStock) || 0,
        low_stock_threshold: Number(editThreshold) || 0,
      })
      .eq('id', ing.id);

    if (error) {
      addToast('Failed to update stock', 'error');
    } else {
      addToast('Stock updated', 'success');
      closeEdit();
      load();
    }
    setSaving(false);
  }

  // ── Add ingredient ─────────────────────────────────────────
  function openAddModal() {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
  }

  async function handleAddIngredient() {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
    if (!form.cost_per_unit || isNaN(Number(form.cost_per_unit))) {
      addToast('Enter a valid cost per unit', 'error'); return;
    }

    setAdding(true);
    const { error } = await supabase.from('ingredients').insert({
      name: form.name.trim(),
      unit: form.unit,
      cost_per_unit: Number(form.cost_per_unit),
      current_stock: Number(form.current_stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
    });

    if (error) {
      addToast('Failed to add ingredient', 'error');
    } else {
      addToast(`${form.name.trim()} added to inventory`, 'success');
      closeAddModal();
      load();
    }
    setAdding(false);
  }

  // ── Computed ───────────────────────────────────────────────
  const criticalCount = ingredients.filter((i) => i.current_stock <= 0).length;
  const lowCount = ingredients.filter(
    (i) => i.current_stock > 0 && i.current_stock <= i.low_stock_threshold
  ).length;

  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        {(criticalCount + lowCount) > 0 && (
          <span className="badge badge-warning">
            <AlertTriangle size={10} />
            {criticalCount + lowCount} alerts
          </span>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={openAddModal}
          style={{ padding: '8px 14px', flexShrink: 0 }}
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="page-body">

        {/* Summary strip */}
        <div className="grid-2" style={{ gap: 8 }}>
          <div className="stat-card" style={{ background: 'var(--success-bg)', borderColor: 'rgba(76,175,125,0.2)' }}>
            <div className="stat-label" style={{ color: 'var(--success)' }}>Stocked OK</div>
            <div className="stat-value success">
              {loading ? '—' : ingredients.filter((i) => stockStatus(i.current_stock, i.low_stock_threshold) === 'ok').length}
            </div>
          </div>
          <div className="stat-card" style={{
            background: criticalCount > 0 ? 'var(--danger-bg)' : 'var(--warning-bg)',
            borderColor: criticalCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
          }}>
            <div className="stat-label" style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)' }}>
              Need Restock
            </div>
            <div
              className={`stat-value ${criticalCount > 0 ? 'danger' : 'warning'}`}
              style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)' }}
            >
              {loading ? '—' : criticalCount + lowCount}
            </div>
          </div>
        </div>

        {/* Ingredient list */}
        {loading ? (
          <div className="flex-center" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : ingredients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package size={32} /></div>
            <div className="empty-title">No ingredients yet</div>
            <div className="empty-sub">Add your first ingredient to start tracking stock</div>
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add Ingredient
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredients.map((ing) => {
              const s = stockStatus(ing.current_stock, ing.low_stock_threshold);
              const pct = ing.low_stock_threshold > 0
                ? Math.min(100, (ing.current_stock / (ing.low_stock_threshold * 3)) * 100)
                : ing.current_stock > 0 ? 100 : 0;
              const barColor = s === 'ok' ? 'var(--success)' : s === 'low' ? 'var(--warning)' : 'var(--danger)';
              const isEditing = editId === ing.id;

              return (
                <div
                  key={ing.id}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    borderColor: s === 'critical'
                      ? 'rgba(239,68,68,0.3)'
                      : s === 'low'
                      ? 'rgba(245,158,11,0.3)'
                      : 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ marginTop: 2 }}>
                      {s === 'ok'
                        ? <CheckCircle size={18} color="var(--success)" />
                        : s === 'low'
                        ? <AlertTriangle size={18} color="var(--warning)" />
                        : <XCircle size={18} color="var(--danger)" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{ing.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatZAR(ing.cost_per_unit)} / {unitLabel(ing.unit)}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px' }}
                      onClick={() => isEditing ? closeEdit() : openEdit(ing)}
                    >
                      {isEditing ? <X size={15} /> : <Pencil size={15} />}
                    </button>
                  </div>

                  {/* Stock bar */}
                  <div className="stock-bar-wrap" style={{ marginBottom: 6 }}>
                    <div className="stock-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                  </div>

                  {isEditing ? (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="grid-2" style={{ gap: 8 }}>
                        <div className="input-group">
                          <label className="input-label">Current Stock ({unitLabel(ing.unit)})</label>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="any"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Alert Below</label>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="any"
                            value={editThreshold}
                            onChange={(e) => setEditThreshold(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm btn-full"
                        onClick={() => handleSaveStock(ing)}
                        disabled={saving}
                      >
                        {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                        Save Stock
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{
                        color: s === 'ok' ? 'var(--success)' : s === 'low' ? 'var(--warning)' : 'var(--danger)',
                        fontWeight: 600
                      }}>
                        {ing.current_stock} {unitLabel(ing.unit)} in stock
                      </span>
                      {ing.low_stock_threshold > 0 && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Alert at {ing.low_stock_threshold}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB — only when list has items (empty state has its own button) */}
      {!loading && ingredients.length > 0 && (
        <button className="fab" onClick={openAddModal} aria-label="Add ingredient">
          <Plus size={24} />
        </button>
      )}

      {/* ── Add Ingredient Modal ────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAddModal()}>
          <div className="modal-sheet">
            <div className="modal-handle" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Add Ingredient</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeAddModal} style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="input-group">
                <label className="input-label">Ingredient Name</label>
                <input
                  className="input"
                  placeholder="e.g. Cake flour"
                  value={form.name}
                  autoFocus
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Unit</label>
                  <select
                    className="input"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Cost per {form.unit} (R)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0.00"
                    value={form.cost_per_unit}
                    onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                  />
                </div>
              </div>

              {/* Cost hint */}
              {form.cost_per_unit && !isNaN(Number(form.cost_per_unit)) && Number(form.cost_per_unit) > 0 && (
                <div style={{ background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13, color: 'var(--accent)' }}>
                  💡 R{Number(form.cost_per_unit).toFixed(4)} per {form.unit}
                  {form.unit === 'g' && ` = R${(Number(form.cost_per_unit) * 1000).toFixed(2)} per kg`}
                  {form.unit === 'ml' && ` = R${(Number(form.cost_per_unit) * 1000).toFixed(2)} per L`}
                </div>
              )}

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Opening Stock</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.current_stock}
                    onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Low-Stock Alert</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                You'll get an alert when stock drops below the low-stock threshold
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleAddIngredient}
                disabled={adding}
              >
                {adding ? <div className="spinner" /> : <ShoppingBasket size={18} />}
                {adding ? 'Adding…' : 'Add to Inventory'}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
