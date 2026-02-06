import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import AddTransactionModal from '@/components/modals/AddTransactionModal';

const TransactionsPage = () => {
  const { transactions, categories } = useFinance();
  const { deleteTransaction } = useFinance();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = transactions.filter((t) => {
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 animate-in-delay-1">
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              filter === f ? 'gradient-primary text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2 rounded-2xl text-sm bg-muted text-foreground border border-border"
        >
          <option value="all">Todas categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2 animate-in-delay-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhuma transação encontrada</p>}
        {filtered.map((t) => {
          const cat = getCat(t.category_id);
          return (
            <div key={t.id} className="glass rounded-2xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  t.type === 'income' ? 'gradient-income' : 'gradient-expense'
                }`}>
                  {cat?.icon || (t.type === 'income' ? '💰' : '💸')}
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{t.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}
                    {t.installments && t.installments > 1 && (
                      <span className="ml-2 text-primary">{t.current_installment}/{t.installments}x</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'income' ? '+' : '-'} {fmt(Number(t.amount))}
                </span>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default TransactionsPage;
