'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Category, PaymentMethod, Transaction, TransactionDraft } from '@/types/finance';

const methods: PaymentMethod[] = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet', 'Savings'];

interface Props {
  categories: Category[];
  transaction?: Transaction;
  onClose: () => void;
  onSave: (draft: TransactionDraft) => Promise<void>;
  onCreateCategory: (category: { name: string; icon: string }) => Promise<Category | null>;
}

const initialDraft = (): TransactionDraft => ({
  amount: '',
  category_id: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  payment_method: 'UPI',
  notes: '',
});

export function TransactionModal({ categories, transaction, onClose, onSave, onCreateCategory }: Props) {
  const [draft, setDraft] = useState<TransactionDraft>(initialDraft());
  const [saving, setSaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦' });
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDraft({
        amount: String(transaction.amount),
        category_id: transaction.category_id ?? '',
        description: transaction.description,
        date: transaction.date,
        payment_method: transaction.payment_method,
        notes: transaction.notes ?? '',
      });
    } else {
      setDraft(initialDraft());
    }
  }, [transaction]);

  useEffect(() => {
    if (!categories.length) {
      setShowCategoryForm(true);
    }
  }, [categories.length]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.category_id || !Number(draft.amount)) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;
    setCreatingCategory(true);

    const category = await onCreateCategory({
      name: newCategory.name.trim(),
      icon: newCategory.icon || '📦',
    });

    setCreatingCategory(false);

    if (!category) return;

    setDraft((current) => ({ ...current, category_id: category.id }));
    setNewCategory({ name: '', icon: '📦' });
    setShowCategoryForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{transaction ? 'Edit transaction' : 'Add actual expense'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose or create a category while recording this expense.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">×</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Amount
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                inputMode="decimal"
                value={draft.amount}
                onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Category
              <select
                required
                value={draft.category_id}
                onChange={(event) => setDraft({ ...draft, category_id: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
              <button type="button" onClick={() => setShowCategoryForm((current) => !current)} className="mb-3 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                {showCategoryForm ? 'Cancel new category' : '+ Create category'}
              </button>

              {showCategoryForm && (
                <div className="flex min-h-[48px] items-center gap-3">
                  <input
                    value={newCategory.icon}
                    maxLength={4}
                    onChange={(event) => setNewCategory({ ...newCategory, icon: event.target.value })}
                    className="h-12 w-12 min-w-[48px] rounded-lg border border-slate-200 bg-white p-2 text-center text-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    value={newCategory.name}
                    placeholder="Category name"
                    onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })}
                    className="h-12 min-w-0 flex-[0_0_58%] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory || !newCategory.name.trim()}
                    className="h-12 flex-1 min-w-[120px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {creatingCategory ? 'Creating…' : 'Create category'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Description
            <input
              required
              value={draft.description}
              placeholder="e.g. Dinner at cafe"
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Date
            <input
              required
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
            Payment method
            <select
              value={draft.payment_method}
              onChange={(event) => setDraft({ ...draft, payment_method: event.target.value as PaymentMethod })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {methods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
            Notes <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={draft.notes}
              rows={3}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
