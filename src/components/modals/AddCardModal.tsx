import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type CreditCard = Tables<'credit_cards'>;

interface Props { onClose: () => void; editData?: CreditCard; }

const AddCardModal = ({ onClose, editData }: Props) => {
  const { addCreditCard, updateCreditCard } = useFinance();
  const isEdit = !!editData;

  const [name, setName] = useState(editData?.name || '');
  const [limitAmount, setLimitAmount] = useState(editData ? String(editData.limit_amount) : '');
  const [closingDay, setClosingDay] = useState(editData ? String(editData.closing_day) : '');
  const [dueDay, setDueDay] = useState(editData ? String(editData.due_day) : '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !closingDay || !dueDay) return;
    setSubmitting(true);
    if (isEdit) {
      await updateCreditCard(editData.id, {
        name: name.trim(),
        limit_amount: parseFloat(limitAmount) || 0,
        closing_day: parseInt(closingDay),
        due_day: parseInt(dueDay),
      });
    } else {
      await addCreditCard({
        name: name.trim(),
        limit_amount: parseFloat(limitAmount) || 0,
        closing_day: parseInt(closingDay),
        due_day: parseInt(dueDay),
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
          <h2 className="text-xl font-black text-foreground">{isEdit ? 'Editar Cartão' : 'Novo Cartão'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nome do cartão</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Inter, C6" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Limite total do cartão</label>
            <input type="number" step="0.01" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} placeholder="0,00" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia de fechamento da fatura</label>
            <input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} placeholder="Ex: 15" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia de vencimento da fatura</label>
            <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Ex: 25" className={inputClass} required />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Cartão')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;
