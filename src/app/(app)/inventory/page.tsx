'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ingredient } from '@/types';
import { formatZAR, unitLabel, stockStatus } from '@/lib/utils';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
  X,
  Check,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';

export default function InventoryPage() {
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('current_stock', { ascending: true });
    setIngredients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const criticalCount = ingredients.filter((i) => i.current_stock <= 0).length;
  const lowCount = ingredients.filter(
    (i) => i.current_stock > 0 && i.current_stock <= i.low_stock_threshold
  ).length;

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        {(criticalCount + lowCount) > 0 && (
          <span className="badge badge-warning">
            <AlertTriangle size={10} />
            {criticalCount + lowCount} alerts
          </span>
        )}
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
          <div className="stat-card" style={{ background: criticalCount > 0 ? 'var(--danger-bg)' : 'var(--warning-bg)', borderColor: criticalCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' }}>
            <div className="stat-label" style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)' }}>Need Restock</div>
            <div className={`stat-value ${criticalCount > 0 ? 'danger' : 'warning'}`} style={{ color: criticalCount > 0 ? 'var(--danger)' : 'var(--warning)' }}>
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
            <div className="empty-title">No ingredients</div>
            <div className="empty-sub">Add ingredients to track your stock here</div>
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
                    borderColor: s === 'critical' ? 'rgba(239,68,68,0.3)' : s === 'low' ? 'rgba(245,158,11,0.3)' : 'var(--border)'
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
                    <div
                      className="stock-bar-fill"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
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
                      <span style={{ color: s === 'ok' ? 'var(--success)' : s === 'low' ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>
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
    </>
  );
}
