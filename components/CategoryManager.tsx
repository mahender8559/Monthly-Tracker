'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/types/finance';

interface Props { userId: string; categories: Category[]; onRefresh: () => Promise<void>; supabase: SupabaseClient; }
const categoryColors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'];
const defaultCategory = { name: '', icon: '📦' };

export function CategoryManager({ userId, categories, onRefresh, supabase }: Props) {
  const [draft, setDraft] = useState(defaultCategory);
  const [saving, setSaving] = useState(false);

  const nextColor = categoryColors.find((color) => !categories.some((category) => category.color === color)) ?? categoryColors[categories.length % categoryColors.length];

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('categories').insert([{ ...draft, user_id: userId, color: nextColor, name: draft.name.trim() }]);
    if (error) alert(error.message);
    else {
      setDraft(defaultCategory);
      await onRefresh();
    }
    setSaving(false);
  };

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(patch).eq('id', id);
    if (error) alert(error.message);
    else await onRefresh();
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteCategory = async (category: Category) => {
    if (category.is_default) return;
    if (!confirm(`Delete category "${category.name}"? Transactions using this category will be unassigned.`)) return;
    setDeletingId(category.id);
    try {
      // 1. Delete associated category budgets if any exist
      const { error: budgetErr } = await supabase.from('category_budgets').delete().eq('category_id', category.id).eq('user_id', userId);
      if (budgetErr) console.warn('Budget delete note:', budgetErr.message);

      // 2. Unassign transactions using this category
      const { error: txError } = await supabase.from('transactions').update({ category_id: null }).eq('category_id', category.id).eq('user_id', userId);
      if (txError) console.warn('Tx unassign note:', txError.message);

      // 3. Assign ownership to current user if default/null user_id to satisfy RLS delete policy
      if (!category.user_id && userId) {
        await supabase.from('categories').update({ user_id: userId }).eq('id', category.id).eq('user_id', category.user_id ?? userId);
      }

      // 4. Delete category from database
      const { data, error } = await supabase.from('categories').delete().eq('id', category.id).eq('user_id', userId).select('id');
      if (error) {
        if (error.code === '23503') {
          alert(`Cannot delete category "${category.name}": It is referenced by foreign key dependencies. Linked transactions have been unassigned, please try deleting again.`);
        } else {
          alert(`Unable to delete category "${category.name}": ${error.message}`);
        }
      } else if (!data || data.length === 0) {
        alert(`Cannot delete category "${category.name}": It might be a default category or locked by permissions.`);
      } else {
        await onRefresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Delete failed: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Categories</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Colors are assigned automatically to new categories. Categories are shared by transaction entry, budgets, filters, and charts.</p>
      </div>

      <form onSubmit={addCategory} className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-[72px_1fr_auto]">
        <input
          value={draft.icon}
          maxLength={4}
          aria-label="Category icon"
          onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          value={draft.name}
          placeholder="New category name"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">Add category</button>
      </form>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="grid items-center gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-[12px_54px_1fr_auto_auto]">
            <span className="h-8 w-2 rounded-full" style={{ backgroundColor: category.color }} />

            <input
              defaultValue={category.icon}
              disabled={category.is_default}
              maxLength={4}
              aria-label={`${category.name} icon`}
              onBlur={(event) => {
                if (event.target.value !== category.icon) void updateCategory(category.id, { icon: event.target.value });
              }}
              className="rounded-lg bg-slate-100 p-2 text-center dark:bg-slate-800"
            />

            <input
              defaultValue={category.name}
              disabled={category.is_default}
              aria-label="Category name"
              onBlur={(event) => {
                if (event.target.value.trim() && event.target.value !== category.name) void updateCategory(category.id, { name: event.target.value.trim() });
              }}
              className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            />

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={category.show_in_comparison}
                onChange={(event) => void updateCategory(category.id, { show_in_comparison: event.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show in comparison
            </label>

            <div className="flex items-center justify-end gap-3">
              {category.is_default ? <span className="text-xs font-semibold text-slate-400">Required</span> : <button
                onClick={() => deleteCategory(category)}
                disabled={deletingId === category.id}
                className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === category.id ? 'Deleting...' : 'Delete'}
              </button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
