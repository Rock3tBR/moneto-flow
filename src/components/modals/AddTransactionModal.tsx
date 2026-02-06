import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';

interface Props { onClose: () => void; }

const AddTransactionModal = ({ onClose }: Props) => {
  const { categories, creditCards, addTransaction } = useFinance();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [cardId, setCardId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !date) return;
    setSubmitting(true);
    await addTransaction({
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category_id: categoryId || null,
      card_id: type === 'expense' && cardId ? cardId : null,
      installments: type === 'expense' ? installments : 1,
      current_installment: 1,
    });
    setSubmitting(false);
    onClose();
  };

  const inputClass = "w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">Nova Transação</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['income', 'expense'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  type === t
                    ? (t === 'income' ? 'gradient-income text-foreground' : 'gradient-expense text-foreground')
                    : 'bg-muted text-muted-foreground'
                }`}
              >{t === 'income' ? 'Receita' : 'Despesa'}</button>
            ))}
          </div>

          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" className={inputClass} required />
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor" className={inputClass} required />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          {type === 'expense' && (
            <>
              <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass}>
                <option value="">Saldo (sem cartão)</option>
                {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {cardId && (
                <input type="number" min={1} max={48} value={installments} onChange={(e) => setInstallments(parseInt(e.target.value) || 1)} placeholder="Parcelas" className={inputClass} />
              )}
            </>
          )}

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
