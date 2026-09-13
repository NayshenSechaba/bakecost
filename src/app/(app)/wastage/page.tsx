'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ingredient, Recipe, WastageLog } from '@/types';
import { AlertTriangle, Plus, Trash2, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function WastagePage() {
  const router = useRouter();
  const { bakeryId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wastageLogs, setWastageLogs] = useState<WastageLog[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemType, setItemType] = useState<'ingredient' | 'recipe'>('ingredient');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      const [
        { data: logsData },
        { data: ingData },
        { data: recData }
      ] = await Promise.all([
        supabase.from('wastage_log').select('*').order('date', { ascending: false }),
        supabase.from('ingredients').select('*').order('name'),
        supabase.from('recipes').select('*').order('name')
      ]);

      if (logsData) setWastageLogs(logsData);
      if (ingData) setIngredients(ingData);
      if (recData) setRecipes(recData);
    } catch (error) {
      console.error('Error fetching wastage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !quantity) return alert('Please select an item and enter quantity.');
    
    setSubmitting(true);
    const supabase = createClient();
    const qty = parseFloat(quantity);
    
    let itemName = '';
    let unit = '';
    let costLost = 0;

    try {
      if (itemType === 'ingredient') {
        const ing = ingredients.find(i => i.id === itemId);
        if (!ing) throw new Error('Ingredient not found');
        itemName = ing.name;
        unit = ing.unit;
        costLost = ing.cost_per_unit * qty;

        // Deduct from inventory
        await supabase.from('ingredients')
          .update({ current_stock: ing.current_stock - qty })
          .eq('id', itemId);
      } else {
        const rec = recipes.find(r => r.id === itemId);
        if (!rec) throw new Error('Recipe not found');
        itemName = rec.name;
        unit = 'units';
        // Basic fallback cost if we don't calculate full live cost
        // We'll estimate based on target margin for simplicity, or just use base_batch_size to guess.
        // Actually, we'd normally calculate live cost. Let's just use a placeholder 0 if complex, or 
        // a simple calculation. For now, 0, or prompt user. Let's prompt user for estimated cost of recipe loss.
        // To keep it simple, we'll just log 0 unless we fetch the RecipeCost view. Let's use 0 for now.
        costLost = 0; // In a full implementation, fetch from recipe_costs
      }

      const { data, error } = await supabase.from('wastage_log').insert({
        bakery_id: bakeryId || null,
        item_type: itemType,
        item_id: itemId,
        item_name: itemName,
        quantity: qty,
        unit,
        cost_lost: costLost,
        reason
      }).select().single();

      if (error) throw error;

      setWastageLogs([data, ...wastageLogs]);
      setShowForm(false);
      setItemId('');
      setQuantity('');
      setReason('');
    } catch (error: any) {
      alert('Error logging wastage: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    const supabase = createClient();
    await supabase.from('wastage_log').delete().eq('id', id);
    setWastageLogs(wastageLogs.filter(l => l.id !== id));
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ paddingTop: 120 }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const totalLoss = wastageLogs.reduce((sum, log) => sum + Number(log.cost_lost), 0);

  return (
    <>
      <div className="page-header">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#A32D2D]" /> Wastage Tracker
          </h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
          style={{ flexShrink: 0 }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Log Wastage'}
        </button>
      </div>

      <div className="page-body">
        {/* Total lost metric */}
        <div className="card" style={{ background: '#FBEAEB', borderColor: '#F5C2C7', padding: '16px 20px', marginBottom: 16 }}>
          <div className="stat-label" style={{ color: '#A32D2D' }}>Total Value Lost (All Time)</div>
          <div className="stat-value" style={{ color: '#A32D2D', fontSize: 32, marginTop: 4 }}>
            R{totalLoss.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Form when active, or when shown on desktop */}
          {showForm && (
            <div className="md:col-span-6 card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                Log New Wastage
              </h2>
              
              <form onSubmit={handleLogWastage} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label className="input-label">Item Type</label>
                  <select 
                    value={itemType} 
                    onChange={(e) => { setItemType(e.target.value as any); setItemId(''); }}
                    className="input"
                  >
                    <option value="ingredient">Raw Ingredient</option>
                    <option value="recipe">Finished Product (Recipe)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Select Item</label>
                  <select 
                    value={itemId} 
                    onChange={(e) => setItemId(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {itemType === 'ingredient' 
                      ? ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)
                      : recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                    }
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Quantity Lost</label>
                  <input 
                    type="number" step="0.01" min="0.01"
                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="input"
                    placeholder="e.g. 2.5"
                    required
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Note: Logging ingredient wastage will automatically deduct it from your inventory.
                  </span>
                </div>

                <div className="input-group">
                  <label className="input-label">Reason (Optional)</label>
                  <input 
                    type="text"
                    value={reason} onChange={(e) => setReason(e.target.value)}
                    className="input"
                    placeholder="e.g. Burnt in oven, Expired"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary btn-full btn-lg"
                  style={{ marginTop: 4 }}
                >
                  {submitting ? <div className="spinner" /> : <AlertTriangle size={18} />}
                  {submitting ? 'Logging...' : 'Confirm Wastage Loss'}
                </button>
              </form>
            </div>
          )}

          {/* History list */}
          <div className={showForm ? 'md:col-span-6 flex flex-col gap-3' : 'md:col-span-12 flex flex-col gap-3'}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Wastage History
            </div>
            
            {wastageLogs.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-icon"><AlertTriangle size={28} /></div>
                <div className="empty-title">No wastage logged yet</div>
                <div className="empty-sub">Great job minimizing bakery waste!</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {wastageLogs.map(log => (
                  <div key={log.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{log.item_name}</span>
                        <span className="badge badge-warning" style={{ fontSize: 10 }}>
                          {log.item_type}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Lost {log.quantity} {log.unit} · {log.reason || 'No reason specified'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(log.date!).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#A32D2D' }}>
                        -R{Number(log.cost_lost).toFixed(2)}
                      </span>
                      <button onClick={() => handleDelete(log.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
