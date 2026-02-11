import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { addMonths } from 'date-fns';

type Transaction = Tables<'transactions'>;
type Category = Tables<'categories'>;
type CreditCard = Tables<'credit_cards'>;
type SavingsGoal = Tables<'savings_goals'>;
type SavingsTransaction = Tables<'savings_transactions'>;
type RecurringExpense = Tables<'recurring_expenses'>;

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  fetchData: () => Promise<void>;
  addTransaction: (t: TablesInsert<'transactions'>) => Promise<void>;
  updateTransaction: (id: string, t: TablesUpdate<'transactions'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: TablesInsert<'categories'>) => Promise<void>;
  updateCategory: (id: string, c: TablesUpdate<'categories'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addCreditCard: (c: TablesInsert<'credit_cards'>) => Promise<void>;
  updateCreditCard: (id: string, c: TablesUpdate<'credit_cards'>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addSavingsGoal: (g: TablesInsert<'savings_goals'>) => Promise<void>;
  updateSavingsGoal: (id: string, g: TablesUpdate<'savings_goals'>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsTransaction: (t: TablesInsert<'savings_transactions'>) => Promise<void>;
  deleteSavingsTransaction: (id: string) => Promise<void>;
  addRecurringExpense: (r: TablesInsert<'recurring_expenses'>) => Promise<void>;
  updateRecurringExpense: (id: string, data: TablesUpdate<'recurring_expenses'>) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [t, c, cc, sg, st, re] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('credit_cards').select('*').order('name'),
      supabase.from('savings_goals').select('*').order('name'),
      supabase.from('savings_transactions').select('*').order('date', { ascending: false }),
      supabase.from('recurring_expenses').select('*').order('description'),
    ]);
    setTransactions(t.data ?? []);
    setCategories(c.data ?? []);
    setCreditCards(cc.data ?? []);
    setSavingsGoals(sg.data ?? []);
    setSavingsTransactions(st.data ?? []);
    setRecurringExpenses(re.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When adding a transaction with installments > 1, create one row per installment
  const addTransaction = async (t: TablesInsert<'transactions'>) => {
    const installments = t.installments && t.installments > 1 ? t.installments : 1;
    const installmentAmount = Number(t.amount) / installments;

    if (installments === 1) {
      const { error } = await supabase.from('transactions').insert({ ...t, user_id: user!.id });
      if (!error) await fetchData();
      return;
    }

    // Create multiple installment rows
    const rows: TablesInsert<'transactions'>[] = [];
    const baseDate = new Date(t.date + 'T00:00:00');
    for (let i = 0; i < installments; i++) {
      const installmentDate = addMonths(baseDate, i);
      const dateStr = installmentDate.toISOString().slice(0, 10);
      rows.push({
        ...t,
        user_id: user!.id,
        amount: installmentAmount,
        date: dateStr,
        installments,
        current_installment: i + 1,
        description: t.description,
      });
    }
    const { error } = await supabase.from('transactions').insert(rows);
    if (!error) await fetchData();
  };

  const updateTransaction = async (id: string, t: TablesUpdate<'transactions'>) => {
    await supabase.from('transactions').update(t).eq('id', id);
    await fetchData();
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    await fetchData();
  };

  const addCategory = async (c: TablesInsert<'categories'>) => {
    const { error } = await supabase.from('categories').insert({ ...c, user_id: user!.id });
    if (!error) await fetchData();
  };

  const updateCategory = async (id: string, c: TablesUpdate<'categories'>) => {
    await supabase.from('categories').update(c).eq('id', id);
    await fetchData();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    await fetchData();
  };

  const addCreditCard = async (c: TablesInsert<'credit_cards'>) => {
    const { error } = await supabase.from('credit_cards').insert({ ...c, user_id: user!.id });
    if (!error) await fetchData();
  };

  const updateCreditCard = async (id: string, c: TablesUpdate<'credit_cards'>) => {
    await supabase.from('credit_cards').update(c).eq('id', id);
    await fetchData();
  };

  const deleteCreditCard = async (id: string) => {
    await supabase.from('credit_cards').delete().eq('id', id);
    await fetchData();
  };

  const addSavingsGoal = async (g: TablesInsert<'savings_goals'>) => {
    const { error } = await supabase.from('savings_goals').insert({ ...g, user_id: user!.id });
    if (!error) await fetchData();
  };

  const updateSavingsGoal = async (id: string, g: TablesUpdate<'savings_goals'>) => {
    await supabase.from('savings_goals').update(g).eq('id', id);
    await fetchData();
  };

  const deleteSavingsGoal = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id);
    await fetchData();
  };

  const addSavingsTransaction = async (t: TablesInsert<'savings_transactions'>) => {
    const { error } = await supabase.from('savings_transactions').insert({ ...t, user_id: user!.id });
    if (!error) await fetchData();
  };

  const deleteSavingsTransaction = async (id: string) => {
    await supabase.from('savings_transactions').delete().eq('id', id);
    await fetchData();
  };

  const addRecurringExpense = async (r: TablesInsert<'recurring_expenses'>) => {
    const { error } = await supabase.from('recurring_expenses').insert({ ...r, user_id: user!.id });
    if (!error) await fetchData();
  };

  const updateRecurringExpense = async (id: string, data: TablesUpdate<'recurring_expenses'>) => {
    await supabase.from('recurring_expenses').update(data).eq('id', id);
    await fetchData();
  };

  const deleteRecurringExpense = async (id: string) => {
    await supabase.from('recurring_expenses').delete().eq('id', id);
    await fetchData();
  };

  return (
    <FinanceContext.Provider value={{
      transactions, categories, creditCards, savingsGoals, savingsTransactions, recurringExpenses,
      loading, fetchData,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addCreditCard, updateCreditCard, deleteCreditCard,
      addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
      addSavingsTransaction, deleteSavingsTransaction,
      addRecurringExpense, updateRecurringExpense, deleteRecurringExpense,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
