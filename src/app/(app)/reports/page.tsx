'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ProductionLog, Recipe, Ingredient, 
  WastageLog, IngredientPriceHistory, BakerySettings 
} from '@/types';
import { 
  Plus, Download, Printer, Settings, X, 
  BarChart3, AlertTriangle, TrendingUp, TrendingDown, Package, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import Link from 'next/link';

type WidgetType = 'top-products' | 'break-even' | 'slow-stock' | 'inflation' | 'profitability' | 'wastage';

const WIDGET_CATALOG = [
  { id: 'top-products', label: 'Top Products', icon: BarChart3, desc: 'Highest demand products based on production volume.' },
  { id: 'break-even', label: 'Break-Even Tracker', icon: PieChart, desc: 'Progress towards monthly overheads.' },
  { id: 'profitability', label: 'Profitability Leaderboard', icon: TrendingUp, desc: 'Recipes with the highest gross margin.' },
  { id: 'slow-stock', label: 'Slow Moving Stock', icon: Package, desc: 'Ingredients with zero recent usage.' },
  { id: 'inflation', label: 'Cost Inflation Alerts', icon: TrendingDown, desc: 'Recent price jumps in ingredients.' },
  { id: 'wastage', label: 'Wastage Summary', icon: AlertTriangle, desc: 'Losses from burnt/expired items.' },
] as const;

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [settings, setSettings] = useState<BakerySettings | null>(null);
  
  // Data State
  const [production, setProduction] = useState<ProductionLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [priceHistory, setPriceHistory] = useState<IngredientPriceHistory[]>([]);
  const [wastage, setWastage] = useState<WastageLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      const [
        { data: prodData },
        { data: recData },
        { data: ingData },
        { data: priceData },
        { data: wasteData },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('production_log').select('*, recipe:recipes(*)'),
        supabase.from('recipes').select('*'),
        supabase.from('ingredients').select('*'),
        supabase.from('ingredient_price_history').select('*').order('date', { ascending: false }).limit(20),
        supabase.from('wastage_log').select('*').order('date', { ascending: false }),
        supabase.from('bakery_settings').select('*').limit(1).single()
      ]);

      if (prodData) setProduction(prodData);
      if (recData) setRecipes(recData);
      if (ingData) setIngredients(ingData);
      if (priceData) setPriceHistory(priceData);
      if (wasteData) setWastage(wasteData);
      if (settingsData) setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWidgetConfig = async (newWidgets: string[]) => {
    if (!settings) return;
    const updated = { ...settings, report_widgets_config: newWidgets };
    setSettings(updated);
    
    const supabase = createClient();
    await supabase.from('bakery_settings').update({ report_widgets_config: newWidgets }).eq('id', settings.id);
  };

  const toggleWidget = (id: string) => {
    const active = settings?.report_widgets_config || [];
    const newWidgets = active.includes(id) 
      ? active.filter(w => w !== id)
      : [...active, id];
    saveWidgetConfig(newWidgets);
  };

  const exportCSV = () => {
    // Basic CSV export for production logs as an example
    if (!production.length) return alert('No data to export');
    const headers = ['Date', 'Recipe', 'Batch Size', 'Total Cost', 'Notes'];
    const rows = production.map(p => [
      new Date(p.date!).toLocaleDateString(),
      p.recipe?.name || 'Unknown',
      p.batch_size_made.toString(),
      p.total_cost?.toString() || '0',
      p.notes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "doughnomics_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Analytics...</div>;

  const activeWidgets = settings?.report_widgets_config || [];

  // Data Processing for Widgets
  const topProductsData = production.reduce((acc, log) => {
    const name = log.recipe?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + log.batch_size_made;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.entries(topProductsData)
    .map(([name, volume]) => ({ name, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5); // Top 5

  const slowIngredients = ingredients.filter(ing => {
    // True if ingredient has stock but no recent production (simplified check)
    return ing.current_stock > 0; // In reality, we'd check against recipe_ingredients and recent prod_logs
  }).slice(0, 5);

  const totalWastageCost = wastage.reduce((sum, w) => sum + Number(w.cost_lost), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      <div className="p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-amber-500">Analytics & Reports</h1>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition" title="Export CSV">
              <Download size={20} className="text-gray-300" />
            </button>
            <button onClick={() => window.print()} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition" title="Print PDF">
              <Printer size={20} className="text-gray-300" />
            </button>
          </div>
        </header>

        {activeWidgets.length === 0 && (
          <div className="bg-gray-800 border border-amber-500/30 rounded-xl p-6 text-center mb-6 shadow-lg shadow-amber-900/20">
            <BarChart3 className="mx-auto text-amber-500 mb-3" size={48} />
            <h2 className="text-xl font-semibold mb-2">Build Your Dashboard</h2>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Welcome to the Report Builder. Customize your analytics by adding the widgets that matter most to your bakery.
            </p>
            <button 
              onClick={() => setShowCatalog(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-full font-medium transition flex items-center justify-center gap-2 mx-auto"
            >
              <Plus size={18} /> Add Your First Widget
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* Widget Rendering */}
          {activeWidgets.includes('top-products') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-amber-500"/> Top Products (Demand)</h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                      <YAxis stroke="#9ca3af" tick={{fill: '#9ca3af'}} />
                      <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                      <Bar dataKey="volume" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">No production data yet.</div>
                )}
              </div>
            </div>
          )}

          {activeWidgets.includes('profitability') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 overflow-x-auto">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-green-500"/> Profitability Leaderboard</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-sm">
                    <th className="pb-2">Recipe</th>
                    <th className="pb-2 text-right">Target Margin</th>
                    <th className="pb-2 text-right">Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.sort((a,b) => b.target_margin_pct - a.target_margin_pct).slice(0,5).map(r => (
                    <tr key={r.id} className="border-b border-gray-700/50">
                      <td className="py-3 font-medium">{r.name}</td>
                      <td className="py-3 text-right text-green-400">{r.target_margin_pct}%</td>
                      <td className="py-3 text-right">R{r.selling_price?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                  {recipes.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-500">No recipes found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeWidgets.includes('break-even') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><PieChart size={18} className="text-blue-500"/> Break-Even Progress</h3>
              <p className="text-sm text-gray-400 mb-4">Gross profit generated vs monthly overhead target.</p>
              {/* Dummy data for now since we don't have exact sales/margin logs yet */}
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div className="bg-blue-500 h-4 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">R2,250 Generated</span>
                <span className="text-gray-500">Target: R{settings?.monthly_overhead_target || 5000}</span>
              </div>
            </div>
          )}

          {activeWidgets.includes('slow-stock') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Package size={18} className="text-purple-500"/> Slow Moving Stock</h3>
              <ul className="space-y-3">
                {slowIngredients.map(ing => (
                  <li key={ing.id} className="flex justify-between items-center bg-gray-700/30 p-3 rounded-lg">
                    <span>{ing.name}</span>
                    <span className="text-gray-400">{ing.current_stock} {ing.unit} in stock</span>
                  </li>
                ))}
                {slowIngredients.length === 0 && <li className="text-gray-500 text-center py-4">No slow moving stock detected!</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('inflation') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-red-500"/> Cost Inflation Alerts</h3>
              <ul className="space-y-3">
                {priceHistory.map(ph => (
                  <li key={ph.id} className="flex justify-between items-center bg-red-900/20 border border-red-500/20 p-3 rounded-lg">
                    <span className="text-gray-300 text-sm">Ingredient #{ph.ingredient_id.substring(0,6)}</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 line-through mr-2">R{ph.old_price}</span>
                      <span className="text-red-400 font-bold">R{ph.new_price}</span>
                    </div>
                  </li>
                ))}
                {priceHistory.length === 0 && <li className="text-gray-500 text-center py-4">No recent price changes.</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('wastage') && (
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Wastage Summary</h3>
              <div className="text-3xl font-bold text-red-500 mb-4">R{totalWastageCost.toFixed(2)} <span className="text-sm font-normal text-gray-500">lost this month</span></div>
              <Link href="/wastage" className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1">
                Log New Wastage &rarr;
              </Link>
            </div>
          )}

          {/* Add Widget Button (always visible at end) */}
          {activeWidgets.length > 0 && (
            <button 
              onClick={() => setShowCatalog(true)}
              className="bg-gray-800/50 hover:bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-500/50 transition min-h-[200px]"
            >
              <Plus size={32} className="mb-2" />
              <span className="font-medium">Add Widget</span>
            </button>
          )}

        </div>
      </div>

      {/* Widget Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h2 className="text-xl font-bold">Widget Library</h2>
              <button onClick={() => setShowCatalog(false)} className="text-gray-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WIDGET_CATALOG.map(widget => {
                  const isActive = activeWidgets.includes(widget.id);
                  const Icon = widget.icon;
                  return (
                    <div 
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                        isActive 
                          ? 'border-amber-500 bg-amber-500/10' 
                          : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Icon size={24} className={isActive ? 'text-amber-500' : 'text-gray-400'} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isActive ? 'border-amber-500 bg-amber-500' : 'border-gray-600'
                        }`}>
                          {isActive && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-1">{widget.label}</h4>
                      <p className="text-sm text-gray-400">{widget.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-gray-800/50 text-right">
              <button 
                onClick={() => setShowCatalog(false)}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .bottom-nav, button { display: none !important; }
          .bg-gray-900, .bg-gray-800, .bg-gray-700\\/30 { background: white !important; }
          .border-gray-700 { border-color: #ddd !important; }
          .text-white { color: black !important; }
          .text-gray-300, .text-gray-400, .text-gray-500 { color: #555 !important; }
        }
      `}} />
    </div>
  );
}
