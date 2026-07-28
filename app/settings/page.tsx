'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { CategoryManager } from '@/components/CategoryManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCategories } from '@/hooks/use-categories';

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null); const [initializing, setInitializing] = useState(true);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setInitializing(false); }); }, []);
  const { categories, loading, refresh, supabase: categoryClient } = useCategories(session?.user.id);
  if (initializing) return <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">Loading…</main>;
  if (!session) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950"><p className="text-slate-600 dark:text-slate-300">Please sign in on the <Link className="font-bold text-indigo-600 underline" href="/">dashboard</Link> to manage categories.</p></main>;
  return <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6"><div className="mx-auto max-w-4xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-5 text-white shadow-lg"><div><Link href="/" className="text-sm font-semibold text-indigo-200 hover:text-white">← Dashboard</Link><h1 className="mt-1 text-2xl font-black">Categories Manager</h1></div><ThemeToggle /></header>{loading ? <p className="py-10 text-center text-slate-500">Loading categories…</p> : <CategoryManager userId={session.user.id} categories={categories} onRefresh={refresh} supabase={categoryClient} />}</div></main>;
}
