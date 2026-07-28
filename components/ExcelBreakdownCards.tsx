'use client';

import { useState } from 'react';
import type { LedgerEntry, Transaction } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props {
  bankName?: string;
  creditCardTransactions?: Transaction[];
  fundTransactions?: Transaction[];
  totalSavingsLiquidFunds: number;
  idfcItems: LedgerEntry[];
  onAddBankItem: (label: string, amount: number) => Promise<void>;
  onUpdateBankItem: (id: string | number, label: string, amount: number) => Promise<void>;
  onDeleteBankItem: (id: string | number) => Promise<void>;
  className?: string;
}

export function ExcelBreakdownCards({ bankName = 'IDFC Account Money Breakdown', creditCardTransactions = [], fundTransactions = [], totalSavingsLiquidFunds, idfcItems, onAddBankItem, onUpdateBankItem, onDeleteBankItem, className }: Props) {
  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankAmount, setNewBankAmount] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const totalBankMoney = idfcItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalCcUnbilled = creditCardTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const addBankItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBankLabel.trim() || !newBankAmount) return;
    setSubmitting(true);
    try { await onAddBankItem(newBankLabel.trim(), Number(newBankAmount)); setNewBankLabel(''); setNewBankAmount(''); } finally { setSubmitting(false); }
  };
  const saveBankEdit = async (id: string | number) => {
    if (!editLabel.trim()) return;
    setSubmitting(true);
    try { await onUpdateBankItem(id, editLabel.trim(), Number(editAmount) || 0); setEditingId(null); } finally { setSubmitting(false); }
  };
  const startEdit = (item: LedgerEntry) => { setEditingId(item.id); setEditLabel(item.category); setEditAmount(String(item.amount)); };
  const transactionList = (transactions: Transaction[], empty: string, color: string) => transactions.length === 0 ? <p className="py-4 text-center text-xs text-slate-400">{empty}</p> : <ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">{transactions.map((tx) => <li key={tx.id} className="flex justify-between py-2 text-slate-700 dark:text-slate-300"><div className="flex min-w-0 flex-col pr-2"><span className="truncate font-semibold text-slate-900 dark:text-slate-100">{tx.description}</span><span className="text-[10px] text-slate-400">{tx.date} • {tx.category?.name ?? 'General'}</span></div><span className={`whitespace-nowrap font-bold ${color}`}>₹{formatCurrency(Number(tx.amount))}</span></li>)}</ul>;

  return <div className={`grid grid-cols-1 gap-5 md:grid-cols-3 ${className ?? ''}`}>
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900"><div><div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">{bankName}</h3><span className="text-sm font-black text-blue-600 dark:text-blue-400">₹{formatCurrency(totalBankMoney)}</span></div><ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">{idfcItems.map((item) => <li key={item.id} className="flex items-center justify-between py-2"><>{editingId === item.id ? <div className="flex w-full gap-1"><input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="w-1/2 rounded border px-1 text-slate-900"/><input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-1/3 rounded border px-1 text-slate-900"/><button onClick={() => saveBankEdit(item.id)} className="rounded bg-blue-600 px-2 text-white">Save</button></div> : <><span className="font-semibold">{item.category}</span><span className="flex items-center gap-2"><b>₹{formatCurrency(Number(item.amount))}</b><button onClick={() => startEdit(item)} title="Edit">✏️</button><button onClick={() => onDeleteBankItem(item.id)} title="Delete">🗑️</button></span></>}</></li>)}</ul></div><form onSubmit={addBankItem} className="mt-4 flex gap-1.5 border-t pt-2"><input placeholder="Item" value={newBankLabel} onChange={(e) => setNewBankLabel(e.target.value)} className="w-1/2 rounded border px-2 py-1 text-xs text-slate-900"/><input type="number" placeholder="Amount" value={newBankAmount} onChange={(e) => setNewBankAmount(e.target.value)} className="w-1/3 rounded border px-2 py-1 text-xs text-slate-900"/><button disabled={submitting} className="rounded bg-blue-600 px-2 text-white">+</button></form></div>
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900"><div><div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Liquid Funds &amp; Savings (Auto)</h3><span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{formatCurrency(totalSavingsLiquidFunds)}</span></div><div className="max-h-56 overflow-y-auto">{transactionList(fundTransactions, 'No Savings or Investments transactions in this cycle.', 'text-emerald-600')}</div></div><p className="mt-3 border-t pt-2 text-[10px] text-slate-400">Auto-synced from Savings and Investments expense categories</p></div>
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900"><div><div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800"><h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Credit Card Usage (Auto)</h3><span className="text-sm font-black text-rose-600 dark:text-rose-400">₹{formatCurrency(totalCcUnbilled)}</span></div><div className="max-h-56 overflow-y-auto">{transactionList(creditCardTransactions, 'No credit card transactions logged in this cycle.', 'text-rose-600')}</div></div><p className="mt-3 border-t pt-2 text-[10px] text-slate-400">Auto-synced from Credit Card payments</p></div>
  </div>;
}
