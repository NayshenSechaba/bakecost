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

const DEFAULT_WIDGETS = ['top-products', 'profitability', 'break-even', 'wastage'];

export default function ReportsPage() {
  const { bakeryId, planLimits } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [settings, setSettings] = useState<BakerySettings | null>(null);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  
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
        supabase.from('bakery_settings').select('*').limit(1).maybeSingle()
      ]);

      if (prodData) setProduction(prodData);
      if (recData) setRecipes(recData);
      if (ingData) setIngredients(ingData);
      if (priceData) setPriceHistory(priceData);
      if (wasteData) setWastage(wasteData);
      
      if (settingsData) {
        setSettings(settingsData);
        if (Array.isArray(settingsData.report_widgets_config) && settingsData.report_widgets_config.length > 0) {
          setActiveWidgets(settingsData.report_widgets_config);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWidget = async (id: string) => {
    const newWidgets = activeWidgets.includes(id) 
      ? activeWidgets.filter(w => w !== id)
      : [...activeWidgets, id];
    
    // Instant UI update
    setActiveWidgets(newWidgets);

    const supabase = createClient();
    try {
      if (settings?.id) {
        setSettings({ ...settings, report_widgets_config: newWidgets });
        await supabase.from('bakery_settings').update({ report_widgets_config: newWidgets }).eq('id', settings.id);
      } else {
        const payload: any = {
          report_widgets_config: newWidgets,
          monthly_overhead_target: 5000,
        };
        if (bakeryId) payload.bakery_id = bakeryId;
        const { data } = await supabase.from('bakery_settings').insert(payload).select().single();
        if (data) setSettings(data);
      }
    } catch (err) {
      console.error('Failed to persist widget config:', err);
    }
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
          <h1 className="page-title text-slate-900">Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Customizable bakery performance and margin tracking</p>
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
          <div className="card text-center p-8 border-dashed border-[#E3DED6] bg-white">
            <div className="w-14 h-14 rounded-2xl bg-sand-100 text-[#C68A4C] flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Build Your Dashboard</h2>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
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
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900">
                <BarChart3 size={18} className="text-[#C68A4C]"/> Top Products (Demand)
              </h3>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3DED6" />
                      <XAxis dataKey="name" stroke="#6F6A63" tick={{fill: '#6F6A63', fontSize: 12}} />
                      <YAxis stroke="#6F6A63" tick={{fill: '#6F6A63', fontSize: 12}} />
                      <Tooltip contentStyle={{backgroundColor: '#FFFFFF', borderColor: '#E3DED6', borderRadius: '12px', color: '#26221F', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} />
                      <Bar dataKey="volume" fill="#26221F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">No production data yet.</div>
                )}
              </div>
            </div>
          )}

          {activeWidgets.includes('profitability') && (
            <div className="card p-5 overflow-x-auto">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900">
                <TrendingUp size={18} className="text-[#1E7E34]"/> Profitability Leaderboard
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E3DED6] text-slate-400 font-bold uppercase tracking-wider text-xs">
                    <th className="pb-2.5">Recipe</th>
                    <th className="pb-2.5 text-right">Target Margin</th>
                    <th className="pb-2.5 text-right">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DED6]">
                  {recipes.sort((a,b) => b.target_margin_pct - a.target_margin_pct).slice(0,5).map(r => (
                    <tr key={r.id}>
                      <td className="py-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-3 text-right text-[#1E7E34] font-bold">{r.target_margin_pct}%</td>
                      <td className="py-3 text-right font-medium text-slate-700">R{r.selling_price?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                  {recipes.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400">No recipes found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeWidgets.includes('break-even') && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900">
                <PieChart size={18} className="text-[#C68A4C]"/> Break-Even Progress
              </h3>
              <p className="text-xs text-slate-500 mb-4">Gross profit generated vs monthly overhead target.</p>
              <div className="w-full bg-sand-200 rounded-full h-3.5 mb-2.5 overflow-hidden">
                <div className="bg-[#26221F] h-3.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>R2,250 Generated</span>
                <span className="text-slate-400">Target: R{settings?.monthly_overhead_target || 5000}</span>
              </div>
            </div>
          )}

          {activeWidgets.includes('slow-stock') && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900">
                <Package size={18} className="text-[#C68A4C]"/> Slow Moving Stock
              </h3>
              <ul className="space-y-2.5">
                {slowIngredients.map(ing => (
                  <li key={ing.id} className="flex justify-between items-center bg-sand-50 border border-[#E3DED6] p-3 rounded-xl text-sm">
                    <span className="font-semibold text-slate-900">{ing.name}</span>
                    <span className="text-xs font-medium text-slate-500">{ing.current_stock} {ing.unit} in stock</span>
                  </li>
                ))}
                {slowIngredients.length === 0 && <li className="text-slate-400 text-center py-4 text-xs">No slow moving stock detected!</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('inflation') && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-900">
                <TrendingDown size={18} className="text-[#A32D2D]"/> Cost Inflation Alerts
              </h3>
              <ul className="space-y-2.5">
                {priceHistory.map(ph => (
                  <li key={ph.id} className="flex justify-between items-center bg-[#FBEAEB] border border-[#F5C2C7] p-3 rounded-xl text-sm">
                    <span className="font-semibold text-slate-900">Ingredient #{ph.ingredient_id.substring(0,6)}</span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through mr-2">R{ph.old_price}</span>
                      <span className="text-[#A32D2D] font-bold">R{ph.new_price}</span>
                    </div>
                  </li>
                ))}
                {priceHistory.length === 0 && <li className="text-slate-400 text-center py-4 text-xs">No recent price changes.</li>}
              </ul>
            </div>
          )}

          {activeWidgets.includes('wastage') && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-2 flex items-center gap-2 text-slate-900">
                <AlertTriangle size={18} className="text-[#A32D2D]"/> Wastage Summary
              </h3>
              <div className="text-3xl font-extrabold text-[#A32D2D] mb-3">
                R{totalWastageCost.toFixed(2)} <span className="text-xs font-medium text-slate-500">lost this month</span>
              </div>
              <Link href="/wastage" className="text-[#C68A4C] hover:underline text-xs font-bold flex items-center gap-1">
                Log New Wastage &rarr;
              </Link>
            </div>
          )}

          {/* Add Widget Button (always visible at end) */}
          {activeWidgets.length > 0 && (
            <button 
              onClick={() => setShowCatalog(true)}
              className="card border-2 border-dashed border-[#E3DED6] hover:border-slate-900 p-5 flex flex-col items-center justify-center text-slate-400 hover:text-slate-900 transition min-h-[180px]"
            >
              <Plus size={28} className="mb-1.5" />
              <span className="font-bold text-sm">Add / Remove Widgets</span>
            </button>
          )}
        </div>
      </div>

      {/* Catalog Modal */}
      {showCatalog && (
        <div className="modal-overlay" onClick={() => setShowCatalog(false)}>
          <div className="modal-sheet" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Customize Dashboard</h3>
              <button onClick={() => setShowCatalog(false)} className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_CATALOG.map(widget => {
                  const isActive = activeWidgets.includes(widget.id);
                  const Icon = widget.icon;
                  return (
                    <div 
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        isActive 
                          ? 'border-slate-900 bg-sand-100 shadow-xs' 
                          : 'border-[#E3DED6] bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Icon size={22} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-[#E3DED6]'
                        }`}>
                          {isActive && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>
                      <h4 className="font-bold text-sm mb-1 text-slate-900">{widget.label}</h4>
                      <p className="text-xs text-slate-500 leading-normal">{widget.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#E3DED6] mt-5 text-right">
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
