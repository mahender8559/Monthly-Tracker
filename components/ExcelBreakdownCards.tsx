'use client';

import { useState } from 'react';
import type { LedgerEntry, Transaction } from '@/types/finance';
import { formatCurrency } from '@/utils/finance';

interface Props {
  bankName?: string;
  creditCardTransactions?: Transaction[];
  idfcItems: LedgerEntry[];
  assetItems: LedgerEntry[];
  onAddBankItem: (label: string, amount: number) => Promise<void>;
  onUpdateBankItem: (id: string | number, label: string, amount: number) => Promise<void>;
  onDeleteBankItem: (id: string | number) => Promise<void>;
  onAddAssetItem: (label: string, amount: number) => Promise<void>;
  onUpdateAssetItem: (id: string | number, label: string, amount: number) => Promise<void>;
  onDeleteAssetItem: (id: string | number) => Promise<void>;
  className?: string;
}

export function ExcelBreakdownCards({
  bankName = 'IDFC Account Money Breakdown',
  creditCardTransactions = [],
  idfcItems,
  assetItems,
  onAddBankItem,
  onUpdateBankItem,
  onDeleteBankItem,
  onAddAssetItem,
  onUpdateAssetItem,
  onDeleteAssetItem,
  className,
}: Props) {
  // Form states for adding items
  const [newBankLabel, setNewBankLabel] = useState('');
  const [newBankAmount, setNewBankAmount] = useState('');

  const [newAssetLabel, setNewAssetLabel] = useState('');
  const [newAssetAmount, setNewAssetAmount] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalBankMoney = idfcItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalAssets = assetItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // Credit Card usage automatically calculated from creditCardTransactions
  const totalCcUnbilled = creditCardTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const handleAddBankItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankLabel.trim() || !newBankAmount) return;
    setSubmitting(true);
    try {
      await onAddBankItem(newBankLabel.trim(), Number(newBankAmount));
      setNewBankLabel('');
      setNewBankAmount('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAssetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetLabel.trim() || !newAssetAmount) return;
    setSubmitting(true);
    try {
      await onAddAssetItem(newAssetLabel.trim(), Number(newAssetAmount));
      setNewAssetLabel('');
      setNewAssetAmount('');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: LedgerEntry) => {
    setEditingId(item.id);
    setEditLabel(item.category);
    setEditAmount(item.amount.toString());
  };

  const saveBankEdit = async (id: string | number) => {
    if (!editLabel.trim()) return;
    setSubmitting(true);
    try {
      await onUpdateBankItem(id, editLabel.trim(), Number(editAmount) || 0);
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const saveAssetEdit = async (id: string | number) => {
    if (!editLabel.trim()) return;
    setSubmitting(true);
    try {
      await onUpdateAssetItem(id, editLabel.trim(), Number(editAmount) || 0);
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`grid grid-cols-1 gap-5 md:grid-cols-3 ${className ?? ''}`}>
      {/* 1. IDFC Account Money Breakdown (Stored in Supabase Database) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {bankName}
            </h3>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
              ₹{formatCurrency(totalBankMoney)}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {idfcItems.length === 0 ? (
              <li className="py-2 text-center text-slate-400">No items added yet</li>
            ) : (
              idfcItems.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <li key={item.id} className="group flex items-center justify-between py-2 text-slate-700 dark:text-slate-300">
                    {isEditing ? (
                      <div className="flex w-full items-center gap-1">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-1/2 rounded border border-blue-500 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-white"
                        />
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-1/3 rounded border border-blue-500 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          onClick={() => saveBankEdit(item.id)}
                          disabled={submitting}
                          className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-blue-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{formatCurrency(Number(item.amount))}
                          </span>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-xs text-slate-400 hover:text-blue-600 transition"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteBankItem(item.id)}
                            className="p-1 text-xs text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <form onSubmit={handleAddBankItem} className="mt-4 flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            placeholder="Item (e.g. Rent, Debt)"
            value={newBankLabel}
            onChange={(e) => setNewBankLabel(e.target.value)}
            className="w-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newBankAmount}
            onChange={(e) => setNewBankAmount(e.target.value)}
            className="w-1/3 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-500">
            +
          </button>
        </form>
      </div>

      {/* 2. Asset Holdings / Liquid Funds & Savings (Stored in Supabase Database) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Liquid Funds & Savings
            </h3>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(totalAssets)}
            </span>
          </div>

          <ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {assetItems.length === 0 ? (
              <li className="py-2 text-center text-slate-400">No savings added yet</li>
            ) : (
              assetItems.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <li key={item.id} className="group flex items-center justify-between py-2 text-slate-700 dark:text-slate-300">
                    {isEditing ? (
                      <div className="flex w-full items-center gap-1">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-1/2 rounded border border-emerald-500 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-white"
                        />
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-1/3 rounded border border-emerald-500 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-900 dark:bg-slate-800 dark:text-white"
                        />
                        <button
                          onClick={() => saveAssetEdit(item.id)}
                          disabled={submitting}
                          className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-500"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{formatCurrency(Number(item.amount))}
                          </span>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-xs text-slate-400 hover:text-emerald-600 transition"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteAssetItem(item.id)}
                            className="p-1 text-xs text-slate-400 hover:text-rose-600 transition"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <form onSubmit={handleAddAssetItem} className="mt-4 flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            placeholder="Savings item (e.g. Mutual Funds, FD)"
            value={newAssetLabel}
            onChange={(e) => setNewAssetLabel(e.target.value)}
            className="w-1/2 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newAssetAmount}
            onChange={(e) => setNewAssetAmount(e.target.value)}
            className="w-1/3 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button type="submit" disabled={submitting} className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500">
            +
          </button>
        </form>
      </div>

      {/* 3. Credit Card Unbilled Usage (Automatic from Credit Card transactions) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Credit Card Usage (Auto)
            </h3>
            <span className="text-sm font-black text-rose-600 dark:text-rose-400">
              ₹{formatCurrency(totalCcUnbilled)}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto pr-1">
            {creditCardTransactions.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                No credit card transactions logged yet this month. <br />
                <span className="mt-1 block text-[10px] text-slate-400 font-normal">
                  (Logged transactions with Payment Method = &quot;Credit Card&quot; appear here automatically)
                </span>
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {creditCardTransactions.map((tx) => (
                  <li key={tx.id} className="flex justify-between py-2 text-slate-700 dark:text-slate-300">
                    <div className="flex flex-col pr-2">
                      <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {tx.description}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.date} • {tx.category?.name ?? 'General'}
                      </span>
                    </div>
                    <span className="whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                      ₹{formatCurrency(Number(tx.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-medium text-slate-400 dark:border-slate-800">
          💳 Auto-synced with Money Spent transactions
        </div>
      </div>
    </div>
  );
}
