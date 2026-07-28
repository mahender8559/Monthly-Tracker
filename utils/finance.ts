import type { LedgerEntry } from '@/types/finance';

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export const formatCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getOrdinal = (value: number) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const remainder = value % 100;
  return `${value}${suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]}`;
};

export const sumEntries = (entries: LedgerEntry[], type: LedgerEntry['type']) => entries.filter((entry) => entry.type === type).reduce((sum, entry) => sum + Number(entry.amount), 0);
