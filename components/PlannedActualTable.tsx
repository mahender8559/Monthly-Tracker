'use client';

import { useState } from 'react';
import { formatCurrency } from '@/utils/finance';

interface PlannedActualRow {
  category: string;
  planned: number;
  actual: number;
}

interface Props {
  data: PlannedActualRow[];
  onSavePlanned?: (category: string, amount: string) => void;
  className?: string;
}

export function PlannedActualTable({ data, onSavePlanned, className }: Props) {
  const [filter, setFilter] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredData = data.filter((row) =>
    row.category.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPlanned = data.reduce((sum, row) => sum + row.planned, 0);
  const totalActual = data.reduce((sum, row) => sum + row.actual, 0);
  const totalVariance = totalPlanned - totalActual;

  const handleStartEdit = (category: string, currentPlanned: number) => {
    setEditingCategory(category);
    setEditValue(currentPlanned ? currentPlanned.toString() : '');
  };

  const handleSaveEdit = (category: string) => {
    if (onSavePlanned) {
      onSavePlanned(category, editValue);
    }
    setEditingCategory(null);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black sm:text-base text-slate-900 dark:text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Planned vs Actual Breakdown
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Compare budget targets against real monthly spending
          </p>
        </div>

        <input
          type="text"
          placeholder="Filter category..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </div>

      {/* MOBILE CARD VIEW (No horizontal scrolling required) */}
      <div className="block divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
        {filteredData.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No budget categories found.</div>
        ) : (
          filteredData.map((row) => {
            const diff = row.planned - row.actual;
            const percent = row.planned > 0 ? (row.actual / row.planned) * 100 : row.actual > 0 ? 100 : 0;
            const isOver = row.actual > row.planned && row.planned > 0;
            const isBudgetNotSet = row.actual > 0 && row.planned <= 0;
            const isEditing = editingCategory === row.category;

            return (
              <div key={row.category} className="space-y-2.5 p-3.5 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{row.category}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      isOver
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : isBudgetNotSet
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : row.actual === 0
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {isOver ? 'Budget Exceeded' : isBudgetNotSet ? 'Budget Not Set' : row.actual === 0 ? 'Unspent' : 'Within Budget'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Planned</span>
                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full rounded border border-indigo-500 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(row.category)}
                          className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(row.category, row.planned)}
                        className="mt-0.5 inline-flex cursor-pointer items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        <span>₹{formatCurrency(row.planned)}</span>
                        <span className="text-[10px] text-slate-400">✏️</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actual</span>
                    <span className="mt-0.5 block font-bold text-slate-900 dark:text-white">
                      ₹{formatCurrency(row.actual)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Difference</span>
                    <span
                      className={`mt-0.5 block font-bold ${
                        diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {diff < 0 ? `-₹${formatCurrency(Math.abs(diff))}` : `+₹${formatCurrency(diff)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full ${
                        percent > 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {Math.round(percent)}%
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Total Footer */}
        <div className="bg-slate-100/90 p-3.5 dark:bg-slate-800 font-bold text-xs space-y-1">
          <div className="flex justify-between text-slate-900 dark:text-white font-black uppercase">
            <span>Total Planned:</span>
            <span className="text-emerald-600 dark:text-emerald-400">₹{formatCurrency(totalPlanned)}</span>
          </div>
          <div className="flex justify-between text-slate-900 dark:text-white font-black uppercase">
            <span>Total Actual:</span>
            <span>₹{formatCurrency(totalActual)}</span>
          </div>
          <div className="flex justify-between font-black uppercase">
            <span>Net Variance:</span>
            <span className={totalVariance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {totalVariance < 0 ? `-₹${formatCurrency(Math.abs(totalVariance))}` : `+₹${formatCurrency(totalVariance)}`}
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Planned (Budget)</th>
              <th className="px-4 py-3 text-right">Actual (Spent)</th>
              <th className="px-4 py-3 text-right">Difference</th>
              <th className="px-4 py-3 text-center">Usage</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No budget categories found.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const diff = row.planned - row.actual;
                const percent = row.planned > 0 ? (row.actual / row.planned) * 100 : row.actual > 0 ? 100 : 0;
                const isOver = row.actual > row.planned && row.planned > 0;
                const isBudgetNotSet = row.actual > 0 && row.planned <= 0;
                const isEditing = editingCategory === row.category;

                return (
                  <tr
                    key={row.category}
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                      {row.category}
                    </td>

                    {/* Planned */}
                    <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(row.category);
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                            autoFocus
                            className="w-24 rounded border border-indigo-500 bg-white px-2 py-1 text-right text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                          />
                          <button
                            onClick={() => handleSaveEdit(row.category)}
                            className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-500"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(row.category, row.planned)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Click to edit budget"
                        >
                          <span>₹{formatCurrency(row.planned)}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">✏️</span>
                        </div>
                      )}
                    </td>

                    {/* Actual */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{formatCurrency(row.actual)}
                    </td>

                    {/* Difference */}
                    <td
                      className={`px-4 py-3 text-right font-bold ${
                        diff < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : diff > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {diff < 0 ? `-₹${formatCurrency(Math.abs(diff))}` : `+₹${formatCurrency(diff)}`}
                    </td>

                    {/* Usage bar */}
                    <td className="px-4 py-3 text-center">
                      <div className="mx-auto flex w-28 items-center gap-2">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full ${
                              percent > 100
                                ? 'bg-rose-500'
                                : percent >= 80
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {Math.round(percent)}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          isOver
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : isBudgetNotSet
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : row.actual === 0
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {isOver ? 'Budget Exceeded' : isBudgetNotSet ? 'Budget Not Set' : row.actual === 0 ? 'Unspent' : 'Within Budget'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Summary Row */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white">
              <td className="px-4 py-3 uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Total
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                ₹{formatCurrency(totalPlanned)}
              </td>
              <td className="px-4 py-3 text-right text-slate-900 dark:text-white">
                ₹{formatCurrency(totalActual)}
              </td>
              <td
                className={`px-4 py-3 text-right ${
                  totalVariance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {totalVariance < 0 ? `-₹${formatCurrency(Math.abs(totalVariance))}` : `+₹${formatCurrency(totalVariance)}`}
              </td>
              <td colSpan={2} className="px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                {totalPlanned > 0
                  ? `${Math.round((totalActual / totalPlanned) * 100)}% Overall Spent`
                  : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
