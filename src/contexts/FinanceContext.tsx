import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;
type Category = Tables<'categories'>;
type CreditCard = Tables<'credit_cards'>;

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  loading: boolean;
  fetchData: () => Promise<void>;
  addTransaction: (t: TablesInsert<'transactions'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (c: TablesInsert<'categories'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addCreditCard: (c: TablesInsert<'credit_cards'>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [t, c, cc] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
      supabase.from('credit_cards').select('*').order('name'),
    ]);
    setTransactions(t.data ?? []);
    setCategories(c.data ?? []);
    setCreditCards(cc.data ?? []);
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

  return (
    <FinanceContext.Provider value={{
      transactions, categories, creditCards, loading, fetchData,
      addTransaction, deleteTransaction,
      addCategory, deleteCategory,
      addCreditCard, deleteCreditCard,
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
