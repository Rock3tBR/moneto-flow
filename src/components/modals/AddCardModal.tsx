import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';

interface Props { onClose: () => void; }

const AddCardModal = ({ onClose }: Props) => {
  const { addCreditCard } = useFinance();
  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !closingDay || !dueDay) return;
    setSubmitting(true);
    await addCreditCard({
      name: name.trim(),
      limit_amount: parseFloat(limitAmount) || 0,
      closing_day: parseInt(closingDay),
      due_day: parseInt(dueDay),
    });
    setSubmitting(false);
    onClose();
  };

  const inputClass = "w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">Novo Cartão</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cartão" className={inputClass} required />
          <input type="number" step="0.01" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} placeholder="Limite (R$)" className={inputClass} />
          <input type="number" min={1} max={31} value={closingDay} onChange={(e) => setClosingDay(e.target.value)} placeholder="Dia de fechamento" className={inputClass} required />
          <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Dia de vencimento" className={inputClass} required />

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : 'Criar Cartão'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;
