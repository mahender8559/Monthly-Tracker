'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { ExcelExport } from '@/components/ExcelExport';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/utils/supabase';

export default function ExportPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
  }, []);

  if (initializing) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading…</main>;
  }

  if (!session) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-center text-slate-600 dark:bg-slate-950 dark:text-slate-300">Please sign in on the dashboard before exporting data.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-5 text-white shadow-lg">
          <div>
            <Link href="/" className="text-sm font-semibold text-indigo-200 hover:text-white">← Dashboard</Link>
            <h1 className="mt-1 text-2xl font-black">Export Spending Report</h1>
            <p className="mt-1 text-sm text-slate-300">Download actual expenses for a date range.</p>
          </div>
          <ThemeToggle />
        </header>
        <ExcelExport userId={session.user.id} />
      </div>
    </main>
  );
}
