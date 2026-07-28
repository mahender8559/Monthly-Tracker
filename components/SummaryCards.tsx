'use client';

import { useState } from 'react';
import type { LedgerEntry, OverallStats } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props {
  expenses: number;
  income: number;
  investments: LedgerEntry;
  stats: OverallStats;
  netFlow: number;
  totalSavingsLiquidFunds: number;
  onSaveIncome?: (amount: string) => void;
  onSaveInvestments?: (amount: string) => void;
}

export function SummaryCards({ expenses, income, investments, stats, totalSavingsLiquidFunds, onSaveIncome, onSaveInvestments }: Props) {
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeVal, setIncomeVal] = useState('');
  const [editingInvestments, setEditingInvestments] = useState(false);
  const [investmentsVal, setInvestmentsVal] = useState('');
  const remainingBalance = income - expenses;

  const saveIncome = () => { onSaveIncome?.(incomeVal); setEditingIncome(false); };
  const saveInvestments = () => { onSaveInvestments?.(investmentsVal); setEditingInvestments(false); };

  return (
    <section aria-label="Monthly financial summary" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 md:mb-8">
      <div className="flex flex-col justify-between rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/50 to-white p-4 shadow-sm dark:border-sky-900/60 dark:from-slate-900 dark:to-slate-900/80">
        <div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">This Month&apos;s Salary</span><button onClick={() => { setIncomeVal(String(income || '')); setEditingIncome(true); }} className="text-[10px] font-bold text-sky-600 hover:underline dark:text-sky-400">Edit</button></div>
        {editingIncome ? <div className="mt-2 flex items-center gap-1"><input type="number" value={incomeVal} onChange={(e) => setIncomeVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveIncome(); if (e.key === 'Escape') setEditingIncome(false); }} autoFocus className="w-full rounded border border-sky-500 bg-white px-2 py-1 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800 dark:text-white"/><button onClick={saveIncome} className="rounded bg-sky-600 px-2 py-1 text-[10px] font-bold text-white">Save</button></div> : <span className="mt-2 text-2xl font-black text-sky-700 dark:text-sky-300">₹{formatCurrency(income)}</span>}
        <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Monthly income</span>
      </div>
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/50 to-white p-4 shadow-sm dark:border-rose-900/60 dark:from-slate-900 dark:to-slate-900/80"><span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Money Spent So Far</span><span className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">₹{formatCurrency(expenses)}</span><span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Actual Outflow</span></div>
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white p-4 shadow-sm dark:border-emerald-900/60 dark:from-slate-900 dark:to-slate-900/80"><span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Remaining Balance</span><span className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{formatCurrency(remainingBalance)}</span><span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Available Funds</span></div>
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white p-4 shadow-sm dark:border-indigo-900/60 dark:from-slate-900 dark:to-slate-900/80"><div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Investments</span><button onClick={() => { setInvestmentsVal(String(investments?.amount || '')); setEditingInvestments(true); }} className="text-[10px] font-bold text-indigo-600 hover:underline dark:text-indigo-400">Edit</button></div>{editingInvestments ? <div className="mt-2 flex items-center gap-1"><input type="number" value={investmentsVal} onChange={(e) => setInvestmentsVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveInvestments(); if (e.key === 'Escape') setEditingInvestments(false); }} autoFocus className="w-full rounded border border-indigo-500 bg-white px-2 py-1 text-sm font-bold text-slate-900 outline-none dark:bg-slate-800 dark:text-white"/><button onClick={saveInvestments} className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white">Save</button></div> : <span className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{formatCurrency(Number(investments?.amount || 0))}</span>}<span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">All-time: ₹{formatCurrency(stats.investments)}</span></div>
      <div className="col-span-2 flex flex-col justify-between rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/50 to-white p-4 shadow-sm dark:border-purple-900/60 dark:from-slate-900 dark:to-slate-900/80 sm:col-span-1"><span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">Total Savings / Liquid Funds</span><span className={`mt-2 text-2xl font-black ${totalSavingsLiquidFunds >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600'}`}>₹{formatCurrency(totalSavingsLiquidFunds)}</span><span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Savings payments are deducted automatically</span></div>
    </section>
  );
}
