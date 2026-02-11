import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

interface Props {
  onClose: () => void;
  editData?: Transaction;
}

const AddTransactionModal = ({ onClose, editData }: Props) => {
  const { categories, creditCards, addTransaction, updateTransaction } = useFinance();
  const isEdit = !!editData;

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(
    (editData?.type as 'INCOME' | 'EXPENSE') || 'EXPENSE'
  );
  const [description, setDescription] = useState(editData?.description || '');
  const [amount, setAmount] = useState(editData ? String(editData.amount) : '');
  const [date, setDate] = useState(editData?.date || new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(editData?.category_id || '');
  const [cardId, setCardId] = useState(editData?.card_id || '');
  const [installments, setInstallments] = useState(editData?.installments || 1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !date) return;
    setSubmitting(true);
    if (isEdit) {
      await updateTransaction(editData.id, {
        type,
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        category_id: categoryId || null,
        card_id: type === 'EXPENSE' && cardId ? cardId : null,
      });
    } else {
      await addTransaction({
        type,
        description: description.trim(),
        amount: parseFloat(amount),
        date,
        category_id: categoryId || null,
        card_id: type === 'EXPENSE' && cardId ? cardId : null,
        installments: type === 'EXPENSE' ? installments : 1,
        current_installment: 1,
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
          <h2 className="text-xl font-black text-foreground">{isEdit ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(['INCOME', 'EXPENSE'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  type === t
                    ? (t === 'INCOME' ? 'gradient-income text-foreground' : 'gradient-expense text-foreground')
                    : 'bg-muted text-muted-foreground'
                }`}
              >{t === 'INCOME' ? 'Receita' : 'Despesa'}</button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição do lançamento</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Salário, Aluguel, Supermercado" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor {!isEdit && installments > 1 ? '(total, será dividido nas parcelas)' : ''}</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data do lançamento</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria (organiza seus gastos)</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {type === 'EXPENSE' && (
            <>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cartão de crédito (opcional)</label>
                <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
                  <option value="">Saldo (sem cartão)</option>
                  {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {cardId && !isEdit && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Número de parcelas</label>
                  <input type="number" min={1} max={48} value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 1)} placeholder="1" className={inputClass} />
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
