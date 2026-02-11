import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type RecurringExpense = Tables<'recurring_expenses'>;

interface Props { onClose: () => void; editData?: RecurringExpense; }

const AddRecurringExpenseModal = ({ onClose, editData }: Props) => {
  const { categories, creditCards, addRecurringExpense, updateRecurringExpense } = useFinance();
  const isEdit = !!editData;

  const [description, setDescription] = useState(editData?.description || '');
  const [amount, setAmount] = useState(editData ? String(editData.amount) : '');
  const [dayOfMonth, setDayOfMonth] = useState(editData ? String(editData.day_of_month) : '1');
  const [categoryId, setCategoryId] = useState(editData?.category_id || '');
  const [cardId, setCardId] = useState(editData?.card_id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSubmitting(true);
    if (isEdit) {
      await updateRecurringExpense(editData.id, {
        description: description.trim(),
        amount: parseFloat(amount),
        day_of_month: parseInt(dayOfMonth) || 1,
        category_id: categoryId || null,
        card_id: cardId || null,
      });
    } else {
      await addRecurringExpense({
        description: description.trim(),
        amount: parseFloat(amount),
        day_of_month: parseInt(dayOfMonth) || 1,
        category_id: categoryId || null,
        card_id: cardId || null,
        user_id: '',
      });
    }
    setSubmitting(false);
    onClose();
  };

  const inputClass = "w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">{isEdit ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição do gasto recorrente</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel, Netflix, Academia" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor mensal</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia do mês em que é cobrado</label>
            <input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="Ex: 5" className={inputClass} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cartão de crédito (opcional)</label>
            <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
              <option value="">Saldo (sem cartão)</option>
              {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Gasto Fixo')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRecurringExpenseModal;
