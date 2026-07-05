'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatZAR } from '@/lib/utils';
import { Recipe, Ingredient, ProductionLog } from '@/types';
import {
  ChefHat,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';

export default function DashboardPage() {
  const supabase = createClient();
  const { toasts } = useToast();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [recentLogs, setRecentLogs] = useState<(ProductionLog & { recipe: Recipe | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [recipesRes, ingredientsRes, logsRes] = await Promise.all([
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
        supabase
          .from('ingredients')
          .select('*')
          .filter('current_stock', 'lte', 'low_stock_threshold')
          .order('current_stock', { ascending: true }),
        supabase
          .from('production_log')
          .select('*, recipe:recipes(name)')
          .order('date', { ascending: false })
          .limit(3),
      ]);

      setRecipes(recipesRes.data ?? []);
      // client-side filter since PostgREST can't compare two columns directly in .filter
      const allIngredients = await supabase.from('ingredients').select('*');
      const low = (allIngredients.data ?? []).filter(
        (i: Ingredient) => i.current_stock <= i.low_stock_threshold
      );
      setLowStock(low);
      setRecentLogs((logsRes.data as any) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div style={{ padding: '28px 20px 20px', background: 'linear-gradient(180deg, #2a1f0e 0%, var(--bg-surface) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>🥐</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{today}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>BakeCost</h1>
          </div>
        </div>
      </div>

      <div className="page-body">

        {/* Stat cards */}
        <div className="grid-2">
          <div className="stat-card">
            <div className="stat-label">Recipes</div>
            <div className="stat-value accent">{loading ? '—' : recipes.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>total saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Stock</div>
            <div className={`stat-value ${lowStock.length > 0 ? 'warning' : 'success'}`}>
              {loading ? '—' : lowStock.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {lowStock.length > 0 ? 'need restocking' : 'all stocked'}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/scale" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--accent-subtle)', border: '1px solid rgba(232,168,56,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px', textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <TrendingUp size={20} color="var(--accent)" />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Scale a Recipe
              </span>
              <ArrowRight size={16} color="var(--accent)" />
            </Link>
            <Link href="/recipes/new" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px', textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <BookOpen size={20} color="var(--text-secondary)" />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                New Recipe
              </span>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
            <Link href="/ingredients" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)', padding: '12px 14px', textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <Package size={20} color="var(--text-secondary)" />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Add Ingredient
              </span>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
          </div>
        </div>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Low Stock Alerts
              </span>
            </div>
            {lowStock.slice(0, 3).map((ing) => (
              <div key={ing.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ing.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {ing.current_stock} {ing.unit} left
                  </div>
                </div>
                <span className="badge badge-warning">Low</span>
              </div>
            ))}
            {lowStock.length > 3 && (
              <Link href="/inventory" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', marginTop: 8, display: 'block' }}>
                +{lowStock.length - 3} more → View inventory
              </Link>
            )}
          </div>
        )}

        {/* Recent bakes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>Recent Bakes</span>
            <Link href="/inventory" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>View all</Link>
          </div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--accent)' }} />
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="card empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-icon"><ClipboardList size={28} /></div>
              <div className="empty-title">No bakes logged yet</div>
              <div className="empty-sub">Scale a recipe and log your first bake</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentLogs.map((log) => (
                <div key={log.id} className="card" style={{ padding: '12px 14px' }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{(log as any).recipe?.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {log.batch_size_made} units · {new Date(log.date!).toLocaleDateString('en-ZA')}
                      </div>
                    </div>
                    {log.total_cost != null && (
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                        {formatZAR(log.total_cost)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipes shortcut */}
        {!loading && recipes.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>My Recipes</span>
              <Link href="/recipes" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>See all</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipes.slice(0, 3).map((recipe) => (
                <Link key={recipe.id} href={`/scale/${recipe.id}`} className="list-item">
                  <div className="list-item-icon">
                    <ChefHat size={18} />
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-title">{recipe.name}</div>
                    <div className="list-item-sub">Base: {recipe.base_batch_size} units · {recipe.target_margin_pct}% margin</div>
                  </div>
                  <TrendingUp size={16} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
