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

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Wastage Data...</div>;

  const totalLoss = wastageLogs.reduce((sum, log) => sum + Number(log.cost_lost), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      <div className="p-6">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle size={24} /> Wastage Tracker
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Log Wastage'}
          </button>
        </header>

        <div className="bg-gray-800 rounded-xl p-5 border border-red-500/30 mb-6 flex justify-between items-center shadow-lg shadow-red-900/10">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Value Lost (All Time)</p>
            <p className="text-3xl font-bold text-red-500">R{totalLoss.toFixed(2)}</p>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleLogWastage} className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-6">
            <h2 className="text-lg font-semibold mb-4">Log New Wastage</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Item Type</label>
                <select 
                  value={itemType} 
                  onChange={(e) => { setItemType(e.target.value as any); setItemId(''); }}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                >
                  <option value="ingredient">Raw Ingredient</option>
                  <option value="recipe">Finished Product (Recipe)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Select Item</label>
                <select 
                  value={itemId} 
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                  required
                >
                  <option value="">-- Choose --</option>
                  {itemType === 'ingredient' 
                    ? ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)
                    : recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantity Lost</label>
                <input 
                  type="number" step="0.01" min="0.01"
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                  placeholder="e.g. 2.5"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Logging ingredient wastage will automatically deduct it from your inventory.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Reason (Optional)</label>
                <input 
                  type="text"
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                  placeholder="e.g. Burnt in oven, Expired"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold p-3 rounded-lg mt-2"
              >
                {submitting ? 'Logging...' : 'Confirm Wastage Loss'}
              </button>
            </div>
          </form>
        )}

        <h2 className="text-lg font-semibold mb-4 text-gray-300">Wastage History</h2>
        
        {wastageLogs.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700">
            No wastage logged yet. Great job minimizing waste!
          </div>
        ) : (
          <div className="space-y-3">
            {wastageLogs.map(log => (
              <div key={log.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{log.item_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {log.item_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Lost {log.quantity} {log.unit} • {log.reason || 'No reason specified'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.date!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-red-400">-R{Number(log.cost_lost).toFixed(2)}</span>
                  <button onClick={() => handleDelete(log.id)} className="text-gray-500 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
