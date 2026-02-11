import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, CalendarClock } from 'lucide-react';
import AddRecurringExpenseModal from '@/components/modals/AddRecurringExpenseModal';
import type { Tables } from '@/integrations/supabase/types';

type RecurringExpense = Tables<'recurring_expenses'>;

const RecurringExpensesPage = () => {
  const { recurringExpenses, categories, creditCards, updateRecurringExpense, deleteRecurringExpense } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<RecurringExpense | null>(null);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalActive = recurringExpenses.filter((r) => r.active).reduce((s, r) => s + Number(r.amount), 0);

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

      <div className="glass rounded-3xl p-5 text-center animate-in-delay-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Mensal Ativo</p>
        <p className="text-3xl font-black text-expense mt-1">{fmt(totalActive)}</p>
      </div>

      <div className="space-y-2 animate-in-delay-2">
        {recurringExpenses.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center space-y-3">
            <CalendarClock className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-bold">Nenhum gasto fixo cadastrado</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Cadastre seus gastos recorrentes como aluguel, streaming, academia, etc. Eles serão contabilizados automaticamente todo mês.
            </p>
          </div>
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
                <button onClick={() => setEditItem(r)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateRecurringExpense(r.id, { active: !r.active })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={r.active ? 'Desativar' : 'Ativar'}
                >
                  {r.active ? <ToggleRight className="w-6 h-6 text-income" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => deleteRecurringExpense(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-expense transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(showAdd || editItem) && (
        <AddRecurringExpenseModal
          editData={editItem || undefined}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
};

export default RecurringExpensesPage;
