import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Pencil } from 'lucide-react';
import AddTransactionModal from '@/components/modals/AddTransactionModal';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

const TransactionsPage = () => {
  const { transactions, categories, recurringExpenses, deleteTransaction } = useFinance();
  const [filter, setFilter] = useState<'all' | 'INCOME' | 'EXPENSE' | 'FIXED'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);

  const fixedDescriptions = new Set(recurringExpenses.map((r) => r.description.toLowerCase()));

  const filtered = transactions.filter((t) => {
    if (filter === 'FIXED') return t.type === 'EXPENSE' && fixedDescriptions.has(t.description.toLowerCase());
    if (filter !== 'all' && t.type !== filter) return false;
    if (catFilter !== 'all' && t.category_id !== catFilter) return false;
    return true;
  });

  const getCat = (id: string | null) => categories.find((c) => c.id === id);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Extrato</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm">
          + Transação
        </button>
      </div>

      <div className="flex flex-wrap gap-2 animate-in-delay-1">
        {([
          { key: 'all', label: 'Todos' },
          { key: 'INCOME', label: 'Receitas' },
          { key: 'EXPENSE', label: 'Despesas' },
          { key: 'FIXED', label: 'Gastos Fixos' },
        ] as const).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              filter === f.key ? 'gradient-primary text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >{f.label}</button>
        ))}
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl text-sm bg-muted text-foreground border border-border"
        >
          <option value="all">Todas categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="space-y-2 animate-in-delay-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhuma transação encontrada</p>}
        {filtered.map((t) => {
          const cat = getCat(t.category_id);
          const isFixed = fixedDescriptions.has(t.description.toLowerCase());
          return (
            <div key={t.id} className="glass rounded-2xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  t.type === 'INCOME' ? 'gradient-income' : 'gradient-expense'
                }`}>
                  {cat?.icon || (t.type === 'INCOME' ? '💰' : '💸')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-semibold text-sm">{t.description}</p>
                    {isFixed && (
                      <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-lg">Fixo</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}
                    {t.installments && t.installments > 1 && (
                      <span className="ml-2 text-primary">{t.current_installment}/{t.installments}x</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${t.type === 'INCOME' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'INCOME' ? '+' : '-'} {fmt(Number(t.amount))}
                </span>
                <button onClick={() => setEditItem(t)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(showAdd || editItem) && (
        <AddTransactionModal
          editData={editItem || undefined}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
