'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { PlannedActualTable } from '@/components/PlannedActualTable';
import { MoneySpentTable } from '@/components/MoneySpentTable';
import { ExcelBreakdownCards } from '@/components/ExcelBreakdownCards';
import { useCategories } from '@/hooks/use-categories';
import { useMonthOptions } from '@/hooks/use-month-options';
import type { Category, LedgerEntry, LedgerType, NewInputs, OverallStats, PaymentMethod, Transaction } from '@/types/finance';
import { formatCurrency, getOrdinal, sumEntries } from '@/utils/finance';
import { getBillingCycle } from '@/utils/billing-cycle';

type DashboardTransactionRaw = {
  id?: string;
  amount: number | string;
  description?: string;
  date?: string;
  payment_method?: PaymentMethod;
  category_id?: string;
  category?: Category | Category[] | { name: string } | { name: string }[] | null;
};

const summaryFallback = (category: string): LedgerEntry => ({ id: 'new', month: '', category, amount: 0, type: 'Summary' });

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [savingsPaymentsToDate, setSavingsPaymentsToDate] = useState(0);
  const [fundCategoryContributionsToDate, setFundCategoryContributionsToDate] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [newInputs, setNewInputs] = useState<NewInputs>({});
  const [overallStats, setOverallStats] = useState<OverallStats>({ investments: 0, savings: 0 });
  const [bankName, setBankName] = useState('IDFC Account Money Breakdown');
  const [showBankBreakdown, setShowBankBreakdown] = useState(false);
  const [ccBillingDay, setCcBillingDay] = useState(15);
  const [ccDueDay, setCcDueDay] = useState(5);
  const [billingCycleStartDay, setBillingCycleStartDay] = useState(1);

  const { categories } = useCategories(session?.user.id);
  const monthOptions = useMonthOptions();
  const billingCycle = useMemo(() => getBillingCycle(selectedMonth, billingCycleStartDay), [selectedMonth, billingCycleStartDay]);

  const ccDueDateString = useMemo(() => {
    const date = new Date(`${selectedMonth} 1`);
    if (ccDueDay < ccBillingDay) date.setMonth(date.getMonth() + 1);
    return `${getOrdinal(ccDueDay)} ${date.toLocaleString('en-US', { month: 'short' })}`;
  }, [selectedMonth, ccBillingDay, ccDueDay]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsInitializing(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single();
    if (data) {
      setBankName(data.bank_name);
      setShowBankBreakdown(data.show_bank_breakdown === true);
      setCcBillingDay(data.cc_billing_day || 15);
      setCcDueDay(data.cc_due_day || 5);
      setBillingCycleStartDay(data.billing_cycle_start_day || 1);
    } else {
      await supabase.from('user_settings').insert([{ user_id: session.user.id, bank_name: 'IDFC Account Money Breakdown', show_bank_breakdown: false, cc_billing_day: 15, cc_due_day: 5, billing_cycle_start_day: 1 }]);
      setBankName('IDFC Account Money Breakdown');
      setShowBankBreakdown(false);
    }
  }, [session]);

  const fetchData = useCallback(async (month: string) => {
    if (!session) return;
    setDataLoading(true);
    setLedgerData([]);
    const cycle = getBillingCycle(month, billingCycleStartDay);
    const [{ data: monthly }, { data: future }, { data: savingsPayments }, { data: fundCategoryTransactions }] = await Promise.all([
      supabase.from('ledger').select('*').eq('user_id', session.user.id).eq('month', month).neq('type', 'Future Purchases'),
      supabase.from('ledger').select('*').eq('user_id', session.user.id).eq('type', 'Future Purchases'),
      supabase.from('transactions').select('amount').eq('user_id', session.user.id).eq('payment_method', 'Savings').lt('date', cycle.endDateExclusive),
      supabase.from('transactions').select('amount, category:categories(name)').eq('user_id', session.user.id).eq('transaction_type', 'Actual Expense').lt('date', cycle.endDateExclusive),
    ]);
    setSavingsPaymentsToDate((savingsPayments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0));
    const fundTransactions = (fundCategoryTransactions ?? []) as DashboardTransactionRaw[];
    setFundCategoryContributionsToDate(fundTransactions.reduce((sum, transaction) => {
      const category = Array.isArray(transaction.category) ? transaction.category[0] : transaction.category;
      return category?.name === 'Savings' || category?.name === 'Investments' ? sum + Number(transaction.amount) : sum;
    }, 0));
    const monthEntries = (monthly ?? []) as LedgerEntry[];

    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('show_bank_breakdown')
      .eq('user_id', session.user.id)
      .maybeSingle();

    // Carry over or initialize IDFC Breakdown for this month only when enabled for the user.
    const hasIdfcInMonth = monthEntries.some((e) => e.type === 'IDFC Breakdown');
    const idfcMonthKey = `idfc_init_${session.user.id}_${month}`;
    if (userSettings?.show_bank_breakdown === true && !hasIdfcInMonth && typeof window !== 'undefined' && !localStorage.getItem(idfcMonthKey)) {
      localStorage.setItem(idfcMonthKey, 'true');
      const { data: existingIdfc } = await supabase
        .from('ledger')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('type', 'IDFC Breakdown');

      if (existingIdfc && existingIdfc.length > 0) {
        const uniqueCategories = new Map<string, number>();
        existingIdfc.forEach((item) => {
          uniqueCategories.set(item.category, Number(item.amount));
        });
        const newMonthIdfc = Array.from(uniqueCategories.entries()).map(([category, amount]) => ({
          month,
          category,
          amount,
          type: 'IDFC Breakdown' as LedgerType,
          user_id: session.user.id,
        }));
        if (newMonthIdfc.length > 0) {
          const { data: insertedIdfc } = await supabase.from('ledger').insert(newMonthIdfc).select();
          if (insertedIdfc) monthEntries.push(...(insertedIdfc as LedgerEntry[]));
        }
      } else {
        const defaultIdfc = [
          { month, category: 'Debt Repayment', amount: 35000, type: 'IDFC Breakdown', user_id: session.user.id },
          { month, category: 'Akka', amount: 10000, type: 'IDFC Breakdown', user_id: session.user.id },
          { month, category: 'Expenses', amount: 7091.63, type: 'IDFC Breakdown', user_id: session.user.id },
          { month, category: 'Credit Card Repayment', amount: 3528.21, type: 'IDFC Breakdown', user_id: session.user.id },
          { month, category: 'Mine', amount: 1.65, type: 'IDFC Breakdown', user_id: session.user.id },
        ];
        const { data: insertedIdfc } = await supabase.from('ledger').insert(defaultIdfc).select();
        if (insertedIdfc) monthEntries.push(...(insertedIdfc as LedgerEntry[]));
      }
    }

    const existingSummaryCategories = new Set(monthEntries.filter((entry) => entry.type === 'Summary').map((entry) => entry.category));
    const missingSummaryEntries = ['Investments'].filter((category) => !existingSummaryCategories.has(category)).map((category) => ({ month, category, amount: 0, type: 'Summary', user_id: session.user.id }));
    const { data: createdSummaries } = missingSummaryEntries.length ? await supabase.from('ledger').insert(missingSummaryEntries).select() : { data: [] };
    setLedgerData([...monthEntries, ...((createdSummaries ?? []) as LedgerEntry[]), ...((future ?? []) as LedgerEntry[])]);
    setDataLoading(false);
  }, [session, billingCycleStartDay]);

  const fetchOverallStats = useCallback(async () => {
    if (!session) return;
    const [{ data: summaryData }, { data: transactionData }] = await Promise.all([
      supabase.from('ledger').select('category, amount').eq('type', 'Summary').eq('user_id', session.user.id),
      supabase.from('transactions').select('amount, category:categories(name)').eq('user_id', session.user.id).eq('transaction_type', 'Actual Expense'),
    ]);

    const summaryInvestments = (summaryData ?? []).filter((item) => item.category === 'Investments').reduce((sum, item) => sum + Number(item.amount), 0);
    const summarySavings = (summaryData ?? []).filter((item) => item.category === 'Savings').reduce((sum, item) => sum + Number(item.amount), 0);
    const normalizedTransactions = (transactionData ?? []) as DashboardTransactionRaw[];
    const isCategoryArray = (category: DashboardTransactionRaw['category']): category is { name: string }[] => Array.isArray(category);
    const transactionTotals = normalizedTransactions.reduce(
      (acc, item) => {
        const catObj = isCategoryArray(item.category) ? item.category[0] : item.category;
        const category = catObj && 'name' in catObj ? catObj.name : undefined;
        if (category === 'Investments') acc.investments += Number(item.amount);
        if (category === 'Savings') acc.savings += Number(item.amount);
        return acc;
      },
      { investments: 0, savings: 0 },
    );

    setOverallStats({
      investments: summaryInvestments + transactionTotals.investments,
      savings: summarySavings + transactionTotals.savings,
    });
  }, [session]);

  const fetchTransactions = useCallback(async (month: string) => {
    if (!session) return;
    const cycle = getBillingCycle(month, billingCycleStartDay);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', session.user.id)
      .gte('date', cycle.startDate)
      .lt('date', cycle.endDateExclusive)
      .eq('transaction_type', 'Actual Expense')
      .order('date', { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }
    setRawTransactions((data ?? []) as Transaction[]);
    void fetchOverallStats();
  }, [session, fetchOverallStats, billingCycleStartDay]);

  useEffect(() => {
    if (session) {
      void fetchData(selectedMonth);
      void fetchOverallStats();
      void fetchSettings();
      void fetchTransactions(selectedMonth);
    }
  }, [selectedMonth, session, fetchData, fetchOverallStats, fetchSettings, fetchTransactions]);

  async function handleSave(id: LedgerEntry['id'] | 'new', category: string, amount: string, type: LedgerType, targetDate: string | null = null) {
    if (!session?.user.id) {
      alert('Please sign in again to continue.');
      return;
    }
    if (!category.trim() && !amount && id === 'new') return;
    const payload = { month: selectedMonth, category, amount: parseFloat(amount) || 0, type, ...(targetDate !== null ? { target_date: targetDate || null } : {}) };
    if (id === 'new') {
      const { data, error } = await supabase.from('ledger').insert([{ ...payload, user_id: session.user.id }]).select();
      if (error) return alert(`SUPABASE ERROR: ${error.message}`);
      if (data?.[0]) setLedgerData((current) => [...current, data[0] as LedgerEntry]);
    } else {
      const { error } = await supabase.from('ledger').update(payload).eq('id', id).eq('user_id', session.user.id);
      if (error) alert(`UPDATE ERROR: ${error.message}`);
      else setLedgerData((current) => current.map((item) => item.id === id ? { ...item, ...payload } : item));
    }
    if (type === 'Summary') void fetchOverallStats();
  }

  async function handleSaveIncome(amountStr: string) {
    const existing = ledgerData.find((item) => item.type === 'Income');
    if (existing) {
      await handleSave(existing.id, existing.category || 'Salary', amountStr, 'Income');
    } else {
      await handleSave('new', 'Salary', amountStr, 'Income');
    }
  }

  async function handleSaveInvestments(amountStr: string) {
    const existing = ledgerData.find((item) => item.type === 'Summary' && item.category === 'Investments');
    if (existing) {
      await handleSave(existing.id, 'Investments', amountStr, 'Summary');
    } else {
      await handleSave('new', 'Investments', amountStr, 'Summary');
    }
  }

  async function handleAddBankItem(label: string, amount: number) {
    await handleSave('new', label, amount.toString(), 'IDFC Breakdown');
  }

  async function handleUpdateBankItem(id: string | number, label: string, amount: number) {
    await handleSave(id, label, amount.toString(), 'IDFC Breakdown');
  }

  async function handleDeleteBankItem(id: string | number) {
    if (!confirm('Delete this breakdown item?')) return;
    if (!session?.user.id) {
      alert('Please sign in again to delete this item.');
      return;
    }
    setLedgerData((prev) => prev.filter((item) => String(item.id) !== String(id)));

    const { data, error } = await supabase.from('ledger').delete().eq('id', id).eq('user_id', session.user.id).select('id');
    
    if (error) {
      alert(`Error deleting breakdown item: ${error.message}`);
      if (session) void fetchData(selectedMonth);
    } else if (!data || data.length === 0) {
      alert(`Error: Item could not be deleted. It may be locked or you might not have permission.`);
      if (session) void fetchData(selectedMonth);
    }
  }

  async function handleSavePlanned(category: string, amountStr: string) {
    const existing = ledgerData.find((item) => item.type === 'Planned Expense' && item.category.toLowerCase() === category.toLowerCase());
    if (existing) {
      await handleSave(existing.id, category, amountStr, 'Planned Expense');
    } else {
      await handleSave('new', category, amountStr, 'Planned Expense');
    }
  }

  async function handleAddTransaction(tx: {
    description: string;
    amount: number;
    category_id: string;
    payment_method: PaymentMethod;
    date: string;
  }) {
    if (!session) return;
    const payload = {
      ...tx,
      notes: null,
      user_id: session.user.id,
      month: selectedMonth,
      transaction_type: 'Actual Expense',
    };
    const { error } = await supabase.from('transactions').insert([payload]);
    if (error) {
      alert(error.message);
      return;
    }
    await fetchTransactions(selectedMonth);
    await fetchData(selectedMonth);
  }

  async function handleDeleteTransaction(id: string) {
    if (!confirm('Delete this spent transaction?')) return;
    if (!session?.user.id) {
      alert('Please sign in again to delete this transaction.');
      return;
    }
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) {
      alert(error.message);
    } else {
      await fetchTransactions(selectedMonth);
      await fetchData(selectedMonth);
    }
  }

  async function handleDelete(id: LedgerEntry['id'], type: LedgerType) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    if (!session?.user.id) {
      alert('Please sign in again to delete this entry.');
      return;
    }
    const { data, error } = await supabase.from('ledger').delete().eq('id', id).eq('user_id', session.user.id).select('id');
    if (error) {
      alert(`Error deleting: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert(`Error: Entry could not be deleted. It may be locked or you lack permission.`);
    } else {
      setLedgerData((current) => current.filter((item) => item.id !== id));
      if (type === 'Summary') void fetchOverallStats();
    }
  }

  async function handleNewSave(type: LedgerType) {
    const draft = newInputs[type];
    if (!draft || (!draft.category.trim() && !draft.amount)) return;
    if (type === 'Planned Expense' && ledgerData.some((item) => item.type === 'Planned Expense' && item.category.toLowerCase() === draft.category.trim().toLowerCase())) {
      alert('Each category can have only one planned budget per month.');
      return;
    }
    await handleSave('new', draft.category, draft.amount, type);
    setNewInputs((current) => ({ ...current, [type]: { category: '', amount: '' } }));
  }

  async function moveToActual(item: LedgerEntry) {
    if (!confirm(`Mark "${item.category}" as purchased and move it to this month's Actual Expenses?`)) return;
    const { error } = await supabase.from('ledger').update({ type: 'Actual Expense', month: selectedMonth }).eq('id', item.id);
    if (error) alert(`Error moving: ${error.message}`);
    else setLedgerData((current) => current.map((entry) => entry.id === item.id ? { ...entry, type: 'Actual Expense', month: selectedMonth } : entry));
  }

  async function handleRollover() {
    if (!confirm("Copy 'Income' and 'Planned Expenses' categories from the previous month? (Amounts will be set to ₹0)")) return;
    const prior = new Date(`${selectedMonth} 1`);
    prior.setMonth(prior.getMonth() - 1);
    const previousMonth = prior.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const { data } = await supabase.from('ledger').select('category, type').eq('month', previousMonth).in('type', ['Income', 'Planned Expense']);
    if (!data?.length) return alert(`No Income or Planned Expenses found in ${previousMonth}.`);
    const categoriesSet = new Set(ledgerData.map((item) => item.category.toLowerCase()));
    const additions = data.filter((item) => !categoriesSet.has(item.category.toLowerCase())).map((item) => ({ month: selectedMonth, category: item.category, amount: 0, type: item.type, user_id: session?.user.id }));
    if (!additions.length) return alert('All categories from the previous month already exist in this month.');
    const { data: inserted, error } = await supabase.from('ledger').insert(additions).select();
    if (error) alert(`Error copying: ${error.message}`);
    else if (inserted) {
      setLedgerData((current) => [...current, ...(inserted as LedgerEntry[])]);
      alert(`Successfully copied ${inserted.length} categories!`);
    }
  }

  async function handleRenameBank() {
    const name = prompt('Enter your bank name:', bankName);
    if (!name?.trim() || !session) return;
    setBankName(name);
    const { error } = await supabase.from('user_settings').update({ bank_name: name }).eq('user_id', session.user.id);
    if (error) await supabase.from('user_settings').upsert([{ user_id: session.user.id, bank_name: name }]);
  }

  async function handleCcSettings() {
    const billing = prompt('Enter your Credit Card Billing Date (e.g., 15):', String(ccBillingDay));
    const due = prompt('Enter your Credit Card Due Date (e.g., 5):', String(ccDueDay));
    if (!billing || !due || Number.isNaN(Number(billing)) || Number.isNaN(Number(due)) || !session) return;
    const cc_billing_day = parseInt(billing);
    const cc_due_day = parseInt(due);
    setCcBillingDay(cc_billing_day);
    setCcDueDay(cc_due_day);
    await supabase.from('user_settings').update({ cc_billing_day, cc_due_day }).eq('user_id', session.user.id);
  }

  async function handleBillingCycleStartDayChange(day: number) {
    if (!session) return;
    setBillingCycleStartDay(day);
    const { error } = await supabase.from('user_settings').update({ billing_cycle_start_day: day }).eq('user_id', session.user.id);
    if (error) alert(`Could not save billing cycle: ${error.message}`);
  }

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    setAuthLoading(true);
    const { error } = isLogin ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (error) alert(`${isLogin ? 'Login' : 'Signup'} failed: ${error.message}`);
    else if (!isLogin) alert('Account created successfully! Logging you in...');
    setAuthLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setLedgerData([]);
    setOverallStats({ investments: 0, savings: 0 });
    setBankName('IDFC Account Money Breakdown');
    setShowBankBreakdown(false);
  }

  const incomeTotal = sumEntries(ledgerData, 'Income');
  const billedTotal = sumEntries(ledgerData, 'Billed Credit Card');
  const unbilledTotal = sumEntries(ledgerData, 'Unbilled Credit Card');

  // Convert raw transactions into Ledger format by category
  const transactionLedgerEntries = rawTransactions
    .filter((transaction) => Number(transaction.amount) > 0)
    .reduce<Record<string, LedgerEntry>>((acc, transaction, index) => {
      const categoryName = transaction.category?.name ?? 'Other';
      const amount = Number(transaction.amount);
      if (!acc[categoryName]) {
        acc[categoryName] = {
          id: `tx-${categoryName}-${index}`,
          month: selectedMonth,
          category: categoryName,
          amount,
          type: 'Actual Expense',
        };
      } else {
        acc[categoryName].amount = Number(acc[categoryName].amount) + amount;
      }
      return acc;
    }, {});

  const investment = ledgerData.find((item) => item.type === 'Summary' && item.category === 'Investments') ?? summaryFallback('Investments');
  const actualEntries = ledgerData.filter((item) => item.type === 'Actual Expense');
  const actualTransactionEntries = Object.values(transactionLedgerEntries);

  const actualEntriesCombinedByCategory = [...actualEntries, ...actualTransactionEntries].reduce<Record<string, LedgerEntry>>((acc, entry, index) => {
    const categoryName = entry.category || 'Other';
    const amount = Number(entry.amount);
    if (!acc[categoryName]) {
      acc[categoryName] = {
        id: `actual-${categoryName}-${index}`,
        month: selectedMonth,
        category: categoryName,
        amount,
        type: 'Actual Expense',
      };
    } else {
      acc[categoryName].amount = Number(acc[categoryName].amount) + amount;
    }
    return acc;
  }, {});

  const actualLedgerEntries = Object.values(actualEntriesCombinedByCategory);
  const actualExpenseEntries = actualLedgerEntries.filter((entry) => entry.category !== 'Savings' && entry.category !== 'Investments');
  const savingsCategoryEntry = actualLedgerEntries.find((entry) => entry.category === 'Savings');
  const investmentCategoryEntry = actualLedgerEntries.find((entry) => entry.category === 'Investments');

  const investmentSummary = { ...investment, amount: Number(investment.amount) + Number(investmentCategoryEntry?.amount ?? 0) } as LedgerEntry;
  const savingsSummary = { ...summaryFallback('Savings'), amount: Number(savingsCategoryEntry?.amount ?? 0) } as LedgerEntry;
  const actualTotal = actualExpenseEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalOutflow = actualTotal + Number(investmentSummary.amount) + Number(savingsSummary.amount);

  const pieData = actualLedgerEntries.map((item) => ({ name: item.category, value: Number(item.amount) }));

  const plannedByCategory = ledgerData
    .filter((item) => item.type === 'Planned Expense')
    .reduce<Record<string, number>>((acc, item) => {
      const category = item.category || 'Other';
      acc[category] = (acc[category] ?? 0) + Number(item.amount);
      return acc;
    }, {});

  const actualByCategory = actualExpenseEntries.reduce<Record<string, number>>((acc, item) => {
    const category = item.category || 'Other';
    acc[category] = (acc[category] ?? 0) + Number(item.amount);
    return acc;
  }, {});

  const allCategoryNames = categories.filter((category) => category.show_in_comparison).map((category) => category.name);
  const _plannedActualKeys = allCategoryNames;
  const plannedActualData = _plannedActualKeys.map((category) => ({
    category,
    planned: plannedByCategory[category] ?? 0,
    actual: actualByCategory[category] ?? 0,
  }));

  const idfcItems = ledgerData.filter((item) => item.type === 'IDFC Breakdown');
  const totalSavingsLiquidFunds = fundCategoryContributionsToDate - savingsPaymentsToDate;
  const fundTransactions = rawTransactions.filter((transaction) => transaction.category?.name === 'Savings' || transaction.category?.name === 'Investments');

  const creditCardTransactions = rawTransactions.filter(
    (tx) => tx.payment_method === 'Credit Card'
  );

  if (isInitializing) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">Loading…</main>;
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-xl border-t-8 border-[#425b8f] bg-white p-7 shadow-lg dark:bg-slate-900">
          <h1 className="mb-6 text-center text-2xl font-black text-slate-800 dark:text-slate-100">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {[['email', 'Email address'], ['password', 'Password']].map(([type, label]) => (
              <label key={type} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
                <input
                  type={type}
                  required
                  value={type === 'email' ? email : password}
                  onChange={(event) => (type === 'email' ? setEmail(event.target.value) : setPassword(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
            ))}
            <button
              disabled={authLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {authLoading ? 'Processing…' : isLogin ? 'Login to Dashboard' : 'Sign Up'}
            </button>
          </form>
          <button
            onClick={() => setIsLogin((current) => !current)}
            className="mt-6 w-full text-sm font-semibold text-blue-600 hover:text-blue-500"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-3 dark:bg-slate-950 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <Header
          selectedMonth={selectedMonth}
          months={monthOptions}
          cycleStartDay={billingCycleStartDay}
          cycleLabel={billingCycle.label}
          userEmail={session.user.email}
          onMonthChange={setSelectedMonth}
          onCycleStartDayChange={handleBillingCycleStartDayChange}
          onRollover={handleRollover}
          onSignOut={handleSignOut}
        />

        {/* Executive Excel Financial Summary Banner */}
        <SummaryCards
          expenses={actualTotal}
          income={incomeTotal}
          investments={investmentSummary}
          stats={overallStats}
          netFlow={incomeTotal - totalOutflow}
          totalSavingsLiquidFunds={totalSavingsLiquidFunds}
          onSaveIncome={handleSaveIncome}
          onSaveInvestments={handleSaveInvestments}
        />

        {/* Section 1: Planned vs Actual Excel Table */}
        <PlannedActualTable
          data={plannedActualData}
          onSavePlanned={handleSavePlanned}
        />

        {/* Section 2: Money Spent So Far (Detailed Transaction Log Table) */}
        <MoneySpentTable
          transactions={rawTransactions}
          categories={categories}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />

        <ExcelBreakdownCards
          bankName={bankName}
          creditCardTransactions={creditCardTransactions}
          fundTransactions={fundTransactions}
          totalSavingsLiquidFunds={totalSavingsLiquidFunds}
          idfcItems={idfcItems}
          showBankBreakdown={showBankBreakdown}
          onAddBankItem={handleAddBankItem}
          onUpdateBankItem={handleUpdateBankItem}
          onDeleteBankItem={handleDeleteBankItem}
        />
      </div>
    </main>
  );
}
