export type LedgerType = 'Income' | 'Planned Expense' | 'Actual Expense' | 'Future Purchases' | 'Billed Credit Card' | 'Unbilled Credit Card' | 'Summary' | 'IDFC Breakdown' | 'Asset Breakdown';

export interface LedgerEntry {
  id: string | number;
  month: string;
  category: string;
  amount: number | string;
  type: LedgerType;
  target_date?: string | null;
}

export interface OverallStats { investments: number; savings: number; }
export interface UserSettings { bank_name: string; show_bank_breakdown: boolean; cc_billing_day: number; cc_due_day: number; billing_cycle_start_day: number; }
export interface NewEntry { category: string; amount: string; }
export type NewInputs = Partial<Record<LedgerType, NewEntry>>;

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  display_order: number;
  is_default: boolean;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Wallet' | 'Savings';
export type TransactionType = 'Income' | 'Planned Expense' | 'Actual Expense' | 'Future Purchase' | 'Billed Credit Card' | 'Unbilled Credit Card' | 'Investment' | 'Savings' | 'Legacy Other';
export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  date: string;
  month: string;
  payment_method: PaymentMethod;
  notes: string | null;
  transaction_type: TransactionType;
  recurring_frequency: 'Weekly' | 'Monthly' | 'Yearly' | null;
  next_due_date: string | null;
  created_at: string;
  category?: Category | null;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
}

export interface TransactionDraft {
  amount: string;
  category_id: string;
  description: string;
  date: string;
  payment_method: PaymentMethod;
  notes: string;
}
