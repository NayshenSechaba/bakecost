'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Recipe } from '@/types';
import {
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import ProductTile from '@/components/ProductTile';

export default function ScalePickerPage() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    setRecipes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Scale & Cost</h1>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: '16px', background: '#FFFFFF', borderColor: '#E3DED6', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div className="w-9 h-9 rounded-xl bg-[#F4F1EC] text-[#C68A4C] flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Pick a recipe to scale</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Adjust batch sizes live to calculate real ingredient costs, overheads, margins, and recommended retail prices.
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BookOpen size={32} /></div>
            <div className="empty-title">No recipes yet</div>
            <div className="empty-sub">Build a recipe first, then come back here to scale it</div>
            <Link href="/recipes/new" className="btn btn-primary" style={{ marginTop: 8 }}>
              Create Recipe
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/scale/${recipe.id}`} className="list-item">
                <ProductTile
                  size="sm"
                  photoPath={recipe.photo_path}
                  name={recipe.name}
                />
                <div className="list-item-body">
                  <div className="list-item-title">{recipe.name}</div>
                  <div className="list-item-sub">
                    Base: {recipe.base_batch_size} units · {recipe.target_margin_pct}% margin
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
