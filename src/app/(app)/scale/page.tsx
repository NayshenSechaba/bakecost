'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Recipe } from '@/types';
import {
  TrendingUp,
  BookOpen,
  ChefHat,
  ArrowRight,
} from 'lucide-react';

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

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Scale & Cost</h1>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: '16px', background: 'var(--accent-subtle)', borderColor: 'rgba(232,168,56,0.2)', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <TrendingUp size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Pick a recipe to scale</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                Adjust the batch size to see live ingredient quantities, total cost, and suggested selling price.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/scale/${recipe.id}`} className="list-item">
                <div className="list-item-icon">
                  <ChefHat size={18} />
                </div>
                <div className="list-item-body">
                  <div className="list-item-title">{recipe.name}</div>
                  <div className="list-item-sub">
                    Base: {recipe.base_batch_size} units · {recipe.target_margin_pct}% margin
                  </div>
                </div>
                <ArrowRight size={16} color="var(--accent)" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
