import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

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
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: TablesInsert<'categories'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addCreditCard: (c: TablesInsert<'credit_cards'>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addSavingsGoal: (g: TablesInsert<'savings_goals'>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addSavingsTransaction: (t: TablesInsert<'savings_transactions'>) => Promise<void>;
  deleteSavingsTransaction: (id: string) => Promise<void>;
  addRecurringExpense: (r: TablesInsert<'recurring_expenses'>) => Promise<void>;
  updateRecurringExpense: (id: string, active: boolean) => Promise<void>;
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

  const addTransaction = async (t: TablesInsert<'transactions'>) => {
    const { error } = await supabase.from('transactions').insert({ ...t, user_id: user!.id });
    if (!error) await fetchData();
  };

  const deleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    await fetchData();
  };

  const addCategory = async (c: TablesInsert<'categories'>) => {
    const { error } = await supabase.from('categories').insert({ ...c, user_id: user!.id });
    if (!error) await fetchData();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    await fetchData();
  };

  const addCreditCard = async (c: TablesInsert<'credit_cards'>) => {
    const { error } = await supabase.from('credit_cards').insert({ ...c, user_id: user!.id });
    if (!error) await fetchData();
  };

  const deleteCreditCard = async (id: string) => {
    await supabase.from('credit_cards').delete().eq('id', id);
    await fetchData();
  };

  const addSavingsGoal = async (g: TablesInsert<'savings_goals'>) => {
    const { error } = await supabase.from('savings_goals').insert({ ...g, user_id: user!.id });
    if (!error) await fetchData();
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

  const updateRecurringExpense = async (id: string, active: boolean) => {
    await supabase.from('recurring_expenses').update({ active }).eq('id', id);
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
      addTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addCreditCard, deleteCreditCard,
      addSavingsGoal, deleteSavingsGoal,
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
