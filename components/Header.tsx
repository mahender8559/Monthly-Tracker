'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps { selectedMonth: string; months: string[]; onMonthChange: (month: string) => void; onRollover: () => void; onSignOut: () => void; }

export function Header({ selectedMonth, months, onMonthChange, onRollover, onSignOut }: HeaderProps) {
  return <header className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-900/50 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-8 text-white shadow-xl md:mb-8 md:px-7 md:py-10">
    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="text-center md:text-left"><h1 className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">Financial Overview</h1><p className="mt-1 text-sm font-medium text-indigo-200 sm:text-base">Track, manage, and grow your wealth.</p></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button onClick={onRollover} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20" title="Copy last month's categories">⎘ Rollover Categories</button>
        <select value={selectedMonth} onChange={(event) => onMonthChange(event.target.value)} aria-label="Selected month" className="rounded-lg border border-indigo-400/30 bg-indigo-600/80 px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/50">
          {months.map((month) => <option key={month} value={month} className="bg-slate-900">{month}</option>)}
        </select>
        <ThemeToggle />
        <Link href="/actual-expenses" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Expenses</Link>
        <Link href="/settings" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">Categories Manager</Link>
        <button onClick={onSignOut} className="px-2 py-2 text-sm text-indigo-200 underline-offset-4 transition hover:text-white hover:underline">Sign out</button>
      </div>
    </div>
  </header>;
}
