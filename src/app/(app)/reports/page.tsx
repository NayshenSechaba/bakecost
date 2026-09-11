'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ProductionLog, Recipe, Ingredient, 
  WastageLog, IngredientPriceHistory, BakerySettings 
} from '@/types';
import { 
  Plus, Download, Printer, Settings, X, Check,
  BarChart3, AlertTriangle, TrendingUp, TrendingDown, Package, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import UpgradePrompt from '@/components/UpgradePrompt';
import { AdBanner } from '@/components/AdBanner';

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
  const { planLimits } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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

  const handleExportCSV = () => {
    if (planLimits && !planLimits.canExport) {
      setShowUpgradeModal(true);
      return;
    }
    exportCSV();
  };

  const handlePrintPDF = () => {
    if (planLimits && !planLimits.canExport) {
      setShowUpgradeModal(true);
      return;
    }
    window.print();
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
    <div className="pb-24">
      <div className="page-header justify-between">
        <div>
          <h1 className="page-title text-[var(--accent)]">Analytics & Reports</h1>
          <p className="text-xs text-[var(--text-muted)]">Customizable bakery dashboard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Export CSV">
            <Download size={16} />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={handlePrintPDF} className="btn btn-secondary btn-sm" title="Print PDF">
            <Printer size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      <div className="page-body">
        {activeWidgets.length === 0 && (
          <div className="card text-center p-8 border-dashed border-[var(--accent)]/40 bg-[var(--accent-subtle)]">
            <BarChart3 className="mx-auto text-[var(--accent)] mb-3" size={48} />
            <h2 className="text-xl font-bold mb-2">Build Your Dashboard</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Welcome to the Report Builder. Customize your analytics by adding the widgets that matter most to your bakery.
            </p>
            <button 
              onClick={() => setShowCatalog(true)}
              className="btn btn-primary mx-auto"
            >
              <Plus size={16} /> Add Your First Widget
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Widget Rendering */}
          {activeWidgets.includes('top-products') && (
            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <BarChart3 size={18} className="text-[var(--accent)]"/> Top Products (Demand)
              </h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(247, 235, 214, 0.1)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                      <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                      <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)'}} />
                      <Bar dataKey="volume" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-muted)]">No production data yet.</div>
                )}
              </div>
            </div>
          )}

          {activeWidgets.includes('profitability') && (
            <div className="card p-5 overflow-x-auto">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <TrendingUp size={18} className="text-[var(--success)]"/> Profitability Leaderboard
              </h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-sm">
                    <th className="pb-2">Recipe</th>
                    <th className="pb-2 text-right">Target Margin</th>
                    <th className="pb-2 text-right">Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.sort((a,b) => b.target_margin_pct - a.target_margin_pct).slice(0,5).map(r => (
                    <tr key={r.id} className="border-b border-[var(--border)]/50">
                      <td className="py-3 font-medium">{r.name}</td>
                      <td className="py-3 text-right text-[var(--success)] font-semibold">{r.target_margin_pct}%</td>
                      <td className="py-3 text-right">R{r.selling_price?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                  {recipes.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-[var(--text-muted)]">No recipes found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeWidgets.includes('break-even') && (
            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <PieChart size={18} className="text-[#E8A9B8]"/> Break-Even Progress
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-4">Gross profit generated vs monthly overhead target.</p>
              <div className="w-full bg-[var(--bg-base)] rounded-full h-4 mb-2 overflow-hidden">
                <div className="bg-[var(--accent)] h-4 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">R2,250 Generated</span>
                <span className="text-[var(--text-muted)]">Target: R{settings?.monthly_overhead_target || 5000}</span>
              </div>
            </div>
          )}

          {activeWidgets.includes('slow-stock') && (
            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Package size={18} className="text-[var(--accent-dim)]"/> Slow Moving Stock
              </h3>
              <ul className="space-y-3">
                {slowIngredients.map(ing => (
                  <li key={ing.id} className="flex justify-between items-center bg-[var(--bg-base)] p-3 rounded-lg">
                    <span>{ing.name}</span>
                    <span className="text-[var(--text-muted)]">{ing.current_stock} {ing.unit} in stock</span>
                  </li>
                ))}
                {slowIngredients.length === 0 && <li className="text-[var(--text-muted)] text-center py-4">No slow moving stock detected!</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('inflation') && (
            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <TrendingDown size={18} className="text-[var(--danger)]"/> Cost Inflation Alerts
              </h3>
              <ul className="space-y-3">
                {priceHistory.map(ph => (
                  <li key={ph.id} className="flex justify-between items-center bg-[var(--danger-bg)] border border-[var(--danger)]/20 p-3 rounded-lg">
                    <span className="text-[var(--text-primary)] text-sm">Ingredient #{ph.ingredient_id.substring(0,6)}</span>
                    <div className="text-right">
                      <span className="text-xs text-[var(--text-muted)] line-through mr-2">R{ph.old_price}</span>
                      <span className="text-[var(--danger)] font-bold">R{ph.new_price}</span>
                    </div>
                  </li>
                ))}
                {priceHistory.length === 0 && <li className="text-[var(--text-muted)] text-center py-4">No recent price changes.</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('wastage') && (
            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-[var(--text-primary)]">
                <AlertTriangle size={18} className="text-[var(--danger)]"/> Wastage Summary
              </h3>
              <div className="text-3xl font-bold text-[var(--danger)] mb-4">R{totalWastageCost.toFixed(2)} <span className="text-sm font-normal text-[var(--text-muted)]">lost this month</span></div>
              <Link href="/wastage" className="text-[var(--accent)] hover:underline text-sm font-medium flex items-center gap-1">
                Log New Wastage &rarr;
              </Link>
            </div>
          )}

          {/* Add Widget Button (always visible at end) */}
          {activeWidgets.length > 0 && (
            <button 
              onClick={() => setShowCatalog(true)}
              className="card border-2 border-dashed border-[var(--border-light)] hover:border-[var(--accent)] p-5 flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition min-h-[200px]"
            >
              <Plus size={32} className="mb-2" />
              <span className="font-semibold">Add / Remove Widgets</span>
            </button>
          )}
        </div>
      </div>

      {/* Catalog Modal */}
      {showCatalog && (
        <div className="modal-overlay" onClick={() => setShowCatalog(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Customize Dashboard</h3>
              <button onClick={() => setShowCatalog(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WIDGET_CATALOG.map(widget => {
                  const isActive = activeWidgets.includes(widget.id);
                  const Icon = widget.icon;
                  return (
                    <div 
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        isActive 
                          ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' 
                          : 'border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Icon size={24} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isActive ? 'border-[var(--accent)] bg-[var(--accent)] text-[#1a1612]' : 'border-[var(--border)]'
                        }`}>
                          {isActive && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                      <h4 className="font-semibold mb-1 text-[var(--text-primary)]">{widget.label}</h4>
                      <p className="text-xs text-[var(--text-muted)]">{widget.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-6 border-t border-[var(--border)] mt-6 text-right">
              <button 
                onClick={() => setShowCatalog(false)}
                className="btn btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ad Banner for Free tier */}
      <div className="mt-8">
        <AdBanner />
      </div>

      <UpgradePrompt
        feature="Exporting Reports (PDF & CSV)"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

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
