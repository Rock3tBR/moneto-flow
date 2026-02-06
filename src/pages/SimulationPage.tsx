import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const SimulationPage = () => {
  const { creditCards, transactions } = useFinance();
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState(creditCards[0]?.id || '');
  const [installments, setInstallments] = useState(1);

  const card = creditCards.find((c) => c.id === cardId);
  const totalAmount = parseFloat(amount) || 0;
  const installmentValue = installments > 0 ? totalAmount / installments : 0;

  const usedLimit = transactions
    .filter((t) => t.card_id === cardId && t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const availableLimit = card ? Number(card.limit_amount) - usedLimit : 0;
  const willExceed = totalAmount > availableLimit;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const projection = useMemo(() => {
    if (!totalAmount || !installments) return [];
    const now = new Date();
    return Array.from({ length: installments }, (_, i) => {
      const month = addMonths(now, i + 1);
      return {
        month: format(month, "MMM yyyy", { locale: ptBR }),
        value: installmentValue,
      };
    });
  }, [totalAmount, installments, installmentValue]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Simulação</h1>
      <p className="text-muted-foreground text-sm animate-in-delay-1">Projete o impacto de uma compra nas suas faturas futuras.</p>

      <div className="glass rounded-3xl p-6 space-y-4 max-w-lg animate-in-delay-2">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Valor Total</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Cartão</label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border"
          >
            {creditCards.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Parcelas</label>
          <input
            type="number"
            min={1}
            max={48}
            value={installments}
            onChange={(e) => setInstallments(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {totalAmount > 0 && card && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${willExceed ? 'bg-expense/10 border border-expense/30' : 'bg-income/10 border border-income/30'}`}>
            {willExceed ? (
              <>
                <AlertTriangle className="w-5 h-5 text-expense flex-shrink-0" />
                <p className="text-sm text-expense">O limite será estourado! Disponível: {fmt(availableLimit)}</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-income flex-shrink-0" />
                <p className="text-sm text-income">Dentro do limite. Restante: {fmt(availableLimit - totalAmount)}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Projection */}
      {projection.length > 0 && (
        <div className="space-y-3 max-w-lg">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Impacto nas Faturas</h3>
          {projection.map((p) => (
            <div key={p.month} className="glass rounded-2xl p-4 flex items-center justify-between">
              <span className="text-foreground capitalize">{p.month}</span>
              <span className="text-foreground font-bold">{fmt(p.value)}</span>
            </div>
          ))}
          <div className="glass rounded-2xl p-4 flex items-center justify-between border border-primary/30">
            <span className="text-foreground font-bold">Total</span>
            <span className="text-primary font-black text-lg">{fmt(totalAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
