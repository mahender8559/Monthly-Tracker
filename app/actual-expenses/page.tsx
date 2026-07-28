'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TransactionModal } from '@/components/TransactionModal';
import { useCategories } from '@/hooks/use-categories';
import { useMonthOptions } from '@/hooks/use-month-options';
import type { Category, Transaction, TransactionDraft } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';
import { getBillingCycle } from '@/utils/billing-cycle';

const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#8b5cf6'];

export default function ActualExpensesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [month, setMonth] = useState(new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'new' | Transaction | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [billingCycleStartDay, setBillingCycleStartDay] = useState(1);
  const months = useMonthOptions();
  const { categories, loading: categoriesLoading, refresh: refreshCategories } = useCategories(session?.user.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from('user_settings').select('billing_cycle_start_day').eq('user_id', session.user.id).single()
      .then(({ data }) => {
        const cycleDay = data?.billing_cycle_start_day || 1;
        setBillingCycleStartDay(cycleDay);
        const today = new Date();
        const cycleEndMonth = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= cycleDay ? 1 : 0), 1);
        setMonth(cycleEndMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
      });
  }, [session]);

  const refreshTransactions = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const cycle = getBillingCycle(month, billingCycleStartDay);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', session.user.id)
      .gte('date', cycle.startDate)
      .lt('date', cycle.endDateExclusive)
      .eq('transaction_type', 'Actual Expense')
      .order('date', { ascending: false });
    if (error) alert(error.message);
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, [month, session, billingCycleStartDay]);

  const handleCreateCategory = useCallback(async (categoryData: { name: string; icon: string }) => {
    if (!session) return null;

    const nextColor = CATEGORY_COLORS.find((color) => !categories.some((category) => category.color === color)) ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: session.user.id,
          name: categoryData.name,
          icon: categoryData.icon || '📦',
          color: nextColor,
          display_order: categories.length + 1,
          is_default: false,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return null;
    }

    await refreshCategories();
    return data as Category;
  }, [categories, refreshCategories, session]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  const grouped = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          transactions: transactions.filter((transaction) => transaction.category_id === category.id),
        }))
        .filter((group) => group.transactions.length > 0),
    [categories, transactions],
  );

  const save = async (draft: TransactionDraft) => {
    if (!session) return;

    const payload = {
      ...draft,
      amount: Number(draft.amount),
      notes: draft.notes || null,
      user_id: session.user.id,
      month,
      transaction_type: 'Actual Expense',
    };

    const editingTransaction = typeof modal === 'object' ? modal : null;
    const result = editingTransaction
      ? await supabase.from('transactions').update(payload).eq('id', editingTransaction.id)
      : await supabase.from('transactions').insert([payload]);

    if (result.error) {
      alert(result.error.message);
      return;
    }

    setModal(null);
    await refreshTransactions();
  };

  const remove = async (transaction: Transaction) => {
    if (!confirm(`Delete ${transaction.description}?`)) return;
    if (!session?.user.id) {
      alert('Please sign in again to delete this expense.');
      return;
    }

    const { data, error } = await supabase.from('transactions').delete().eq('id', transaction.id).eq('user_id', session.user.id).select('id');
    if (error) {
      alert(error.message);
    } else if (!data || data.length === 0) {
      alert('Error: Transaction could not be deleted. It may be locked or you lack permission.');
    } else {
      await refreshTransactions();
    }
  };

  if (initializing) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">Loading…</main>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          Please sign in on the <Link className="font-bold text-indigo-600 underline" href="/">dashboard</Link> first.
        </p>
      </main>
    );
  }

  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const cycleLabel = getBillingCycle(month, billingCycleStartDay).label;

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 px-5 py-5 text-white shadow-lg">
          <div>
            <Link href="/" className="text-sm font-semibold text-indigo-200 hover:text-white">
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black">Actual Expenses</h1>
            <p className="mt-1 text-sm text-indigo-200">Cycle: {cycleLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none"
            >
              <option value={month} className="bg-slate-900">
                {month}
              </option>
              {months.filter((option) => option !== month).map((option) => (
                <option key={option} value={option} className="bg-slate-900">
                  {option}
                </option>
              ))}
            </select>

            <ThemeToggle />

            <button
              onClick={() => setModal('new')}
              disabled={categoriesLoading}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              + Add expense
            </button>
          </div>
        </header>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{month} cycle spending ({cycleLabel})</p>
          <p className="mt-1 text-3xl font-black text-rose-600 dark:text-rose-400">₹{formatCurrency(total)}</p>
        </section>

        {loading ? (
          <p className="py-16 text-center text-slate-500">Loading expenses…</p>
        ) : grouped.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-600 dark:text-slate-300">No actual expenses for the {month} cycle ({cycleLabel}).</p>
            <button onClick={() => setModal('new')} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
              Add your first expense
            </button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {grouped.map(({ category, transactions: categoryTransactions }) => {
              const categoryTotal = categoryTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
              const isExpanded = expanded === category.id;
              return (
                <article key={category.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : category.id)}
                    className="flex w-full items-center gap-3 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${category.color}22`, color: category.color }}>
                      {category.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900 dark:text-white">{category.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {categoryTransactions.length} transaction{categoryTransactions.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-black text-slate-900 dark:text-white">₹{formatCurrency(categoryTotal)}</span>
                      <span className="text-xs text-slate-500">{isExpanded ? 'Hide' : 'View'}</span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      {categoryTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-slate-700 dark:text-slate-200">{transaction.description}</span>
                            <span className="block text-xs text-slate-500">{transaction.date} · {transaction.payment_method}</span>
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">₹{formatCurrency(Number(transaction.amount))}</span>
                          <button onClick={() => setModal(transaction)} className="text-indigo-600 hover:text-indigo-500">Edit</button>
                          <button onClick={() => void remove(transaction)} className="text-rose-600 hover:text-rose-500">Delete</button>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {modal && (
          <TransactionModal
            categories={categories}
            transaction={modal === 'new' ? undefined : modal}
            onClose={() => setModal(null)}
            onSave={save}
            onCreateCategory={handleCreateCategory}
          />
        )}
      </div>
    </main>
  );
}
