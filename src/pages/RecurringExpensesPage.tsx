import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import AddRecurringExpenseModal from '@/components/modals/AddRecurringExpenseModal';

const RecurringExpensesPage = () => {
  const { recurringExpenses, categories, creditCards, updateRecurringExpense, deleteRecurringExpense } = useFinance();
  const [showAdd, setShowAdd] = useState(false);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalActive = recurringExpenses
    .filter((r) => r.active)
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Gastos Fixos</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest animate-in-delay-1">Recorrentes mensais</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Novo
        </button>
      </div>

      {/* Total */}
      <div className="glass rounded-3xl p-5 text-center animate-in-delay-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Mensal Ativo</p>
        <p className="text-3xl font-black text-expense mt-1">{fmt(totalActive)}</p>
      </div>

      {/* List */}
      <div className="space-y-2 animate-in-delay-2">
        {recurringExpenses.length === 0 && (
          <p className="text-muted-foreground text-center py-10">Nenhum gasto fixo cadastrado</p>
        )}
        {recurringExpenses.map((r) => {
          const cat = categories.find((c) => c.id === r.category_id);
          const card = creditCards.find((c) => c.id === r.card_id);
          return (
            <div key={r.id} className={`glass rounded-2xl p-4 flex items-center justify-between group transition-opacity ${!r.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat?.icon || '📋'}</span>
                <div>
                  <p className="text-foreground font-semibold text-sm">{r.description}</p>
                  <p className="text-muted-foreground text-xs">
                    Dia {r.day_of_month}
                    {card && <span className="ml-2">• {card.name}</span>}
                    {cat && <span className="ml-2">• {cat.name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-expense font-bold">{fmt(Number(r.amount))}</span>
                <button
                  onClick={() => updateRecurringExpense(r.id, !r.active)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={r.active ? 'Desativar' : 'Ativar'}
                >
                  {r.active ? <ToggleRight className="w-6 h-6 text-income" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => deleteRecurringExpense(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddRecurringExpenseModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default RecurringExpensesPage;
