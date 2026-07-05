'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Recipe } from '@/types';
import {
  Plus,
  BookOpen,
  ChefHat,
  Pencil,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/Toast';

export default function RecipesPage() {
  const supabase = createClient();
  const { toasts, addToast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    setRecipes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) {
      addToast('Could not delete recipe', 'error');
    } else {
      addToast('Recipe deleted', 'success');
      load();
    }
    setDeleteId(null);
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="page-header">
        <h1 className="page-title">Recipes</h1>
        <span className="badge badge-accent">{recipes.length}</span>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="flex-center" style={{ paddingTop: 60 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><BookOpen size={32} /></div>
            <div className="empty-title">No recipes yet</div>
            <div className="empty-sub">Create your first recipe to start costing batches</div>
            <Link href="/recipes/new" className="btn btn-primary" style={{ marginTop: 8 }}>
              <Plus size={16} /> New Recipe
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recipes.map((recipe) => (
              <div key={recipe.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div className="list-item-icon">
                    <ChefHat size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{recipe.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                      Base batch: {recipe.base_batch_size} units · {recipe.target_margin_pct}% margin
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link
                    href={`/scale/${recipe.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <TrendingUp size={14} /> Scale & Cost
                  </Link>
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px 12px' }}
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ padding: '8px 12px' }}
                    onClick={() => setDeleteId(recipe.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && recipes.length > 0 && (
        <Link href="/recipes/new" className="fab" aria-label="New recipe">
          <Plus size={24} />
        </Link>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-sheet" style={{ padding: 24 }}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete recipe?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                All recipe ingredients will also be deleted. Production logs will be kept.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-full" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger btn-full" onClick={() => handleDelete(deleteId!)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
