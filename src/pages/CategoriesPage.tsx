import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';
import AddCategoryModal from '@/components/modals/AddCategoryModal';

const CategoriesPage = () => {
  const { categories, transactions, deleteCategory } = useFinance();
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd })
  );
  const totalExpense = monthExpenses.reduce((s, t) => s + Number(t.amount), 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Categorias</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Nova
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in-delay-1">
        {categories.map((cat) => {
          const spent = monthExpenses.filter((t) => t.category_id === cat.id).reduce((s, t) => s + Number(t.amount), 0);
          const pct = totalExpense > 0 ? (spent / totalExpense) * 100 : 0;
          return (
            <div key={cat.id} className="glass rounded-3xl p-5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: cat.color + '22' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-foreground font-bold">{cat.name}</p>
                    <p className="text-muted-foreground text-xs">{fmt(spent)} este mês</p>
                  </div>
                </div>
                <button onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: cat.color }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% do total</p>
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">Nenhuma categoria criada</p>}
      </div>

      {showAdd && <AddCategoryModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default CategoriesPage;
