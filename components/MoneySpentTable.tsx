'use client';

import { useState } from 'react';
import type { Category, PaymentMethod, Transaction } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction?: (transaction: {
    description: string;
    amount: number;
    category_id: string;
    payment_method: PaymentMethod;
    date: string;
  }) => Promise<void>;
  onDeleteTransaction?: (id: string) => Promise<void>;
  className?: string;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Credit Card', 'UPI', 'Bank Transfer', 'Debit Card', 'Cash', 'Wallet', 'Savings'];

export function MoneySpentTable({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction,
  className,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0 || !onAddTransaction) return;

    setAdding(true);
    try {
      await onAddTransaction({
        description: description.trim(),
        amount: Number(amount),
        category_id: categoryId || categories[0]?.id || '',
        payment_method: paymentMethod,
        date: date || new Date().toISOString().slice(0, 10),
      });
      setDescription('');
      setAmount('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black sm:text-base text-slate-900 dark:text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Money Spent So Far
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Log of actual expense items, categories, and payment modes
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
          <input
            type="text"
            placeholder="Search spent items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <span className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-black text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
            Total: ₹{formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {/* Quick Add Form */}
      {onAddTransaction && (
        <form onSubmit={handleAdd} className="border-b border-slate-200 bg-slate-50/50 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              required
            />
            <input
              type="text"
              placeholder="Item (e.g. Petrol, Groceries)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              required
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={adding}
                className="whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {adding ? '...' : '+ Log'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MOBILE CARD LIST VIEW (No horizontal scrolling required) */}
      <div className="block divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No spent transactions logged yet for this month.
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-3.5 space-y-1.5 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {tx.description}
                </span>
                <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                  ₹{formatCurrency(Number(tx.amount))}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[11px] text-indigo-600 dark:text-indigo-400">
                    {tx.category ? `${tx.category.icon ?? ''} ${tx.category.name}` : 'General'}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    💳 {tx.payment_method}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">{tx.date}</span>
                  {onDeleteTransaction && (
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Item / Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Mode of Payment</th>
              <th className="px-4 py-3 text-right">Amount</th>
              {onDeleteTransaction && <th className="px-4 py-3 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No spent transactions logged yet for this month.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                    {tx.date}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                    {tx.description}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                    {tx.category ? `${tx.category.icon ?? ''} ${tx.category.name}` : 'General'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      💳 {tx.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-rose-600 dark:text-rose-400">
                    ₹{formatCurrency(Number(tx.amount))}
                  </td>
                  {onDeleteTransaction && (
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
