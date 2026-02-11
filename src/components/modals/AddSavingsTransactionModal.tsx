import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';

interface Props { goalId: string; onClose: () => void; }

const AddSavingsTransactionModal = ({ goalId, onClose }: Props) => {
  const { addSavingsTransaction } = useFinance();
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    await addSavingsTransaction({
      goal_id: goalId,
      type,
      amount: parseFloat(amount),
      date,
      description: description.trim() || undefined,
      user_id: '',
    });
    setSubmitting(false);
    onClose();
  };

  const inputClass = "w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">Movimentação</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            {(['DEPOSIT', 'WITHDRAW'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  type === t
                    ? (t === 'DEPOSIT' ? 'gradient-income text-foreground' : 'gradient-expense text-foreground')
                    : 'bg-muted text-muted-foreground'
                }`}
              >{t === 'DEPOSIT' ? 'Depositar' : 'Retirar'}</button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor da movimentação</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Sobra do mês" className={inputClass} />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSavingsTransactionModal;
