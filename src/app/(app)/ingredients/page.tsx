'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatZAR, unitLabel, stockStatus } from '@/lib/utils';
import { Ingredient, Unit } from '@/types';
import {
  Plus,
  ShoppingBasket,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
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

export default function IngredientsPage() {
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });
    setIngredients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setForm({
      name: ing.name,
      unit: ing.unit,
      cost_per_unit: String(ing.cost_per_unit),
      current_stock: String(ing.current_stock),
      low_stock_threshold: String(ing.low_stock_threshold),
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
    if (!form.cost_per_unit || isNaN(Number(form.cost_per_unit))) { addToast('Enter a valid cost', 'error'); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      unit: form.unit,
      cost_per_unit: Number(form.cost_per_unit),
      current_stock: Number(form.current_stock) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
    };

    const { error } = editing
      ? await supabase.from('ingredients').update(payload).eq('id', editing.id)
      : await supabase.from('ingredients').insert(payload);

    if (error) {
      addToast('Something went wrong', 'error');
    } else {
      addToast(editing ? 'Ingredient updated' : 'Ingredient added', 'success');
      closeModal();
      load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) {
      addToast('Cannot delete — ingredient may be used in a recipe', 'error');
    } else {
      addToast('Ingredient deleted', 'success');
      load();
    }
    setDeleteId(null);
  }

  const status = (ing: Ingredient) => stockStatus(ing.current_stock, ing.low_stock_threshold);

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <h1 className="page-title">Ingredients</h1>
        <span className="badge badge-accent">{ingredients.length}</span>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="flex-center" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : ingredients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ShoppingBasket size={32} /></div>
            <div className="empty-title">No ingredients yet</div>
            <div className="empty-sub">Add your first ingredient to start building recipes</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add Ingredient
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredients.map((ing) => {
              const s = status(ing);
              return (
                <div key={ing.id} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: s === 'ok' ? 'var(--success-bg)' : s === 'low' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s === 'ok' ? 'var(--success)' : s === 'low' ? 'var(--warning)' : 'var(--danger)',
                    }}>
                      <ShoppingBasket size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{ing.name}</span>
                        {s !== 'ok' && (
                          <span className={`badge ${s === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                            <AlertTriangle size={10} />
                            {s === 'critical' ? 'Out of stock' : 'Low'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatZAR(ing.cost_per_unit)} / {unitLabel(ing.unit)}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Stock: <strong>{ing.current_stock}</strong> {unitLabel(ing.unit)}
                        {ing.low_stock_threshold > 0 && (
                          <span style={{ color: 'var(--text-muted)' }}> · threshold {ing.low_stock_threshold}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ing)} style={{ padding: '6px 8px' }}>
                        <Pencil size={15} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(ing.id)} style={{ padding: '6px 8px' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      {!loading && ingredients.length > 0 && (
        <button className="fab" onClick={openAdd} aria-label="Add ingredient">
          <Plus size={24} />
        </button>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                {editing ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={closeModal} style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Name</label>
                <input
                  className="input"
                  placeholder="e.g. Cake flour"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Unit</label>
                  <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}>
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

              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">Current Stock</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
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
                    placeholder="0"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : <Check size={18} />}
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Ingredient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-sheet" style={{ padding: 24 }}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete ingredient?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                This cannot be undone. Ingredients used in recipes cannot be deleted.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-full" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger btn-full" onClick={() => handleDelete(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
