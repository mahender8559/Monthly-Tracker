'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

type ExportTransaction = {
  date: string;
  description: string;
  amount: number | string;
  payment_method: string;
  notes: string | null;
  category: { name: string } | { name: string }[] | null;
};

interface ExcelExportProps {
  userId: string;
}

function getCategoryName(category: ExportTransaction['category']) {
  return Array.isArray(category) ? category[0]?.name ?? 'Uncategorized' : category?.name ?? 'Uncategorized';
}

export function ExcelExport({ userId }: ExcelExportProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!startDate || !endDate) {
      alert('Select both a start date and end date.');
      return;
    }
    if (startDate > endDate) {
      alert('The end date must be on or after the start date.');
      return;
    }

    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, description, amount, payment_method, notes, category:categories(name)')
        .eq('user_id', userId)
        .eq('transaction_type', 'Actual Expense')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      const transactions = (data ?? []) as ExportTransaction[];
      const XLSX = await import('xlsx');
      const categoryTotals = transactions.reduce<Record<string, number>>((totals, transaction) => {
        const category = getCategoryName(transaction.category);
        totals[category] = (totals[category] ?? 0) + Number(transaction.amount);
        return totals;
      }, {});
      const totalSpent = transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);

      const summaryRows = [
        ['Finance Tracker Export'],
        ['Period', `${startDate} to ${endDate}`],
        ['Transactions', transactions.length],
        ['Total spent', totalSpent],
        [],
        ['Category', 'Amount'],
        ...Object.entries(categoryTotals).sort(([first], [second]) => first.localeCompare(second)),
      ];
      const transactionRows = [
        ['Date', 'Description', 'Category', 'Payment Method', 'Amount', 'Notes'],
        ...transactions.map((transaction) => [
          transaction.date,
          transaction.description,
          getCategoryName(transaction.category),
          transaction.payment_method,
          Number(transaction.amount),
          transaction.notes ?? '',
        ]),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionRows);
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 26 }];
      transactionsSheet['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 36 }];
      summarySheet['A1'].s = { font: { bold: true, sz: 16 } };
      summarySheet['A6'].s = { font: { bold: true } };
      summarySheet['B6'].s = { font: { bold: true } };
      transactionsSheet['!autofilter'] = { ref: `A1:F${Math.max(transactionRows.length, 1)}` };

      const summaryAmountCells = ['B4', ...Object.keys(categoryTotals).map((_, index) => `B${index + 7}`)];
      summaryAmountCells.forEach((cell) => {
        if (summarySheet[cell]) summarySheet[cell].z = '₹#,##0.00';
      });
      transactions.forEach((_, index) => {
        const amountCell = transactionsSheet[`E${index + 2}`];
        if (amountCell) amountCell.z = '₹#,##0.00';
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      XLSX.writeFile(workbook, `finance-export-${startDate}-to-${endDate}.xlsx`);
    } catch (error) {
      alert(`Could not export transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/30 dark:to-teal-950/30 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-black text-emerald-950 dark:text-emerald-100">Export spending report</h2>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">Download actual expenses for any date range as an Excel workbook.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-white" />
          </label>
          <label className="text-xs font-bold text-emerald-900 dark:text-emerald-100">End date
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-emerald-800 dark:bg-slate-900 dark:text-white" />
          </label>
          <button type="button" onClick={handleExport} disabled={exporting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
            {exporting ? 'Creating file…' : 'Export Excel'}
          </button>
        </div>
      </div>
    </section>
  );
}
