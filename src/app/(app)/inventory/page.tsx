'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Camera,
  Sparkles,
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

// South African Package OCR Mock Presets
const SCAN_PRESETS = [
  {
    id: 'flour',
    brand: 'Sasko',
    name: 'Sasko Cake Flour',
    unit: 'g' as Unit,
    packSize: '2.5',
    packUnit: 'kg' as Unit,
    price: '45.00',
    color: '#de7e35',
    icon: '🌾',
  },
  {
    id: 'sugar',
    brand: 'Huletts',
    name: 'Huletts White Sugar',
    unit: 'g' as Unit,
    packSize: '2',
    packUnit: 'kg' as Unit,
    price: '42.50',
    color: '#4a90e2',
    icon: '🍬',
  },
  {
    id: 'butter',
    brand: 'Clover',
    name: 'Clover Butter',
    unit: 'g' as Unit,
    packSize: '500',
    packUnit: 'g' as Unit,
    price: '85.00',
    color: '#f8e71c',
    icon: '🧈',
  },
  {
    id: 'milk',
    brand: 'Clover',
    name: 'Clover Fresh Milk',
    unit: 'ml' as Unit,
    packSize: '2',
    packUnit: 'l' as Unit,
    price: '38.00',
    color: '#ffffff',
    icon: '🥛',
  },
  {
    id: 'eggs',
    brand: 'Nulaid',
    name: 'Large Eggs (Tray)',
    unit: 'unit' as Unit,
    packSize: '30',
    packUnit: 'unit' as Unit,
    price: '90.00',
    color: '#e69a53',
    icon: '🥚',
  },
];

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

  // Pack Calculator States
  const [showPackHelper, setShowPackHelper] = useState(false);
  const [packPrice, setPackPrice] = useState('');
  const [packSize, setPackSize] = useState('');
  const [packUnit, setPackUnit] = useState<Unit>('kg');

  // Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [scanningPreset, setScanningPreset] = useState<typeof SCAN_PRESETS[0] | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('current_stock', { ascending: true });
    setIngredients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Pack Calculator Live Logic
  const calculatedCostInfo = useMemo(() => {
    const price = parseFloat(packPrice);
    const size = parseFloat(packSize);
    if (isNaN(price) || isNaN(size) || size <= 0) return null;

    let multiplier = 1;
    if (form.unit === 'g' && packUnit === 'kg') {
      multiplier = 1000;
    } else if (form.unit === 'ml' && packUnit === 'l') {
      multiplier = 1000;
    } else if (form.unit === 'kg' && packUnit === 'g') {
      multiplier = 0.001;
    } else if (form.unit === 'l' && packUnit === 'ml') {
      multiplier = 0.001;
    }

    const baseCost = price / (size * multiplier);
    return {
      baseCost,
      pricePerPackUnit: price / size,
      multiplier,
    };
  }, [packPrice, packSize, packUnit, form.unit]);

  // Auto-sync calculated base cost to form input
  useEffect(() => {
    if (calculatedCostInfo) {
      setForm((prev) => ({
        ...prev,
        cost_per_unit: calculatedCostInfo.baseCost.toFixed(5),
      }));
    }
  }, [calculatedCostInfo]);

  // Simulated Scanning Engine
  const startScan = (preset: typeof SCAN_PRESETS[0]) => {
    setScanningPreset(preset);
    setScanState('scanning');
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanState('success');
          // Auto populate values
          setForm({
            name: preset.name,
            unit: preset.unit,
            cost_per_unit: (parseFloat(preset.price) / (parseFloat(preset.packSize) * (preset.packUnit === 'kg' || preset.packUnit === 'l' ? 1000 : 1))).toFixed(5),
            current_stock: preset.packSize,
            low_stock_threshold: '1',
          });
          setPackPrice(preset.price);
          setPackSize(preset.packSize);
          setPackUnit(preset.packUnit);
          setShowPackHelper(true);
          
          addToast(`Successfully scanned ${preset.name}!`, 'success');
          setTimeout(() => {
            setShowScanner(false);
            setScanState('idle');
            setScanningPreset(null);
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // ── Stock editing ──────────────────────────────────────────
  function openEdit(ing: Ingredient) {
    setEditId(ing.id);
    setEditStock(String(ing.current_stock));
    setEditThreshold(String(ing.low_stock_threshold));
  }

  // ── Stock editing ──────────────────────────────────────────
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
    setPackPrice('');
    setPackSize('');
    setPackUnit('kg');
    setShowPackHelper(false);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  onClick={() => setShowScanner(true)}
                >
                  <Camera size={14} /> Scan Packaging
                </button>
                <button className="btn btn-ghost btn-sm" onClick={closeAddModal} style={{ padding: '6px 8px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="input-group">
                <label className="input-label">Ingredient Name</label>
                <input
                  className="input"
                  placeholder="e.g. Sasko Cake flour"
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

              {/* Package Cost Calculator Toggle */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowPackHelper(!showPackHelper)}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🛒 Receipt / Pack Price Helper
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>
                    {showPackHelper ? 'Hide' : 'Show Calculator'}
                  </span>
                </div>

                {showPackHelper && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label">Pack Cost (Price paid)</label>
                        <input
                          className="input"
                          type="number"
                          step="0.01"
                          placeholder="e.g. R45.00"
                          value={packPrice}
                          onChange={(e) => setPackPrice(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Pack size & unit</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            className="input"
                            type="number"
                            placeholder="e.g. 2.5"
                            style={{ flex: 1 }}
                            value={packSize}
                            onChange={(e) => setPackSize(e.target.value)}
                          />
                          <select 
                            className="input" 
                            style={{ width: 85, padding: '12px 6px' }}
                            value={packUnit}
                            onChange={(e) => setPackUnit(e.target.value as Unit)}
                          >
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    {calculatedCostInfo ? (
                      <div style={{ 
                        background: 'var(--accent-subtle)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '10px 12px', 
                        fontSize: 13, 
                        color: 'var(--text-primary)',
                        border: '1px solid rgba(232, 168, 56, 0.2)',
                        marginTop: 12
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Live calculation:</div>
                        • Pack rate: <strong>R {calculatedCostInfo.pricePerPackUnit.toFixed(2)}</strong> per {packUnit} <br />
                        • Cost per base unit: <strong>R {calculatedCostInfo.baseCost.toFixed(5)}</strong> per {form.unit}
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> Automatically applied to Cost input!
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                        Enter price paid and pack size to auto-calculate base unit cost.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cost hint fallback */}
              {!showPackHelper && form.cost_per_unit && !isNaN(Number(form.cost_per_unit)) && Number(form.cost_per_unit) > 0 && (
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

      {/* Package OCR Label Scanner Simulator Modal */}
      {showScanner && (
        <div className="modal-overlay" onClick={() => scanState !== 'scanning' && setShowScanner(false)}>
          <div className="modal-sheet" style={{ maxWidth: 450 }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Smart Packaging Scanner</h2>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => { setShowScanner(false); setScanState('idle'); }} 
                disabled={scanState === 'scanning'}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* simulated camera viewport */}
              <div style={{ 
                height: 200, 
                borderRadius: 'var(--radius)', 
                background: '#0a0908', 
                border: '2px solid var(--border-light)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {scanState === 'idle' && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                    <Camera size={36} color="var(--accent)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Select a South African baking package below to simulate scanning labels.</div>
                  </div>
                )}

                {scanState === 'scanning' && (
                  <>
                    <div style={{
                      position: 'absolute',
                      width: 140,
                      height: 140,
                      border: '2px solid var(--accent)',
                      borderRadius: 12,
                      boxShadow: '0 0 0 999px rgba(0,0,0,0.6)',
                      zIndex: 10,
                      animation: 'pulse 1.5s infinite',
                    }} />

                    <div style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: 3,
                      background: 'var(--accent)',
                      boxShadow: '0 0 10px var(--accent)',
                      zIndex: 20,
                      animation: 'scan-laser 2s infinite linear',
                    }} />

                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      background: 'rgba(0,0,0,0.7)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--accent)',
                      zIndex: 30,
                    }}>
                      [OCR: Processing raw pixels... {scanProgress}%] <br />
                      {scanProgress > 20 && `• ${scanningPreset?.brand} brand detected`} <br />
                      {scanProgress > 50 && `• Weight ${scanningPreset?.packSize}${scanningPreset?.packUnit} recognized`} <br />
                      {scanProgress > 80 && `• Retail Price R${scanningPreset?.price} found`}
                    </div>

                    <div style={{ fontSize: 44 }}>{scanningPreset?.icon}</div>
                  </>
                )}

                {scanState === 'success' && (
                  <div style={{ textAlign: 'center', color: 'var(--success)' }}>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '50%', background: 'var(--success-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px'
                    }}>
                      <Check size={28} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Scan Successful!</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{scanningPreset?.name} successfully parsed</div>
                  </div>
                )}
              </div>

              {/* South African Package Selection List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Tap preset package to scan
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SCAN_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ 
                        justifyContent: 'flex-start', 
                        padding: '10px 12px',
                        background: 'var(--bg-card)',
                        borderColor: 'var(--border)'
                      }}
                      onClick={() => scanState !== 'scanning' && startScan(preset)}
                    >
                      <span style={{ fontSize: 16, marginRight: 8 }}>{preset.icon}</span>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {preset.packSize} {preset.packUnit} @ R {preset.price}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--accent-subtle)', borderRadius: 8, padding: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Tip:</strong> In a real setting, mobile users point their camera at a grocery receipt or ingredient label to scan ingredients instantly without manual calculations.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan animation styles injected */}
      <style jsx global>{`
        @keyframes scan-laser {
          0% { top: 0%; }
          50% { top: 98%; }
          100% { top: 0%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.03); opacity: 1; }
        }
      `}</style>
    </>
  );
}
