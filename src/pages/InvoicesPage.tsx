import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const InvoicesPage = () => {
  const { transactions, creditCards, categories } = useFinance();
  const [selectedCard, setSelectedCard] = useState<string>(creditCards[0]?.id || '');
  const [monthOffset, setMonthOffset] = useState(0);

  const card = creditCards.find((c) => c.id === selectedCard);
  const refDate = addMonths(new Date(), monthOffset);
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();

  const invoiceItems = useMemo(() => {
    if (!card) return [];
    const closingDay = card.closing_day;
    const items: { description: string; amount: number; date: string; installmentLabel?: string; categoryIcon?: string }[] = [];

    transactions
      .filter((t) => t.card_id === card.id && t.type === 'expense')
      .forEach((t) => {
        const txDate = parseISO(t.date);
        const totalInstallments = t.installments || 1;

        for (let i = 0; i < totalInstallments; i++) {
          // Determine which invoice month this installment falls into
          let invoiceMonth: Date;
          const installmentDate = addMonths(txDate, i);

          if (installmentDate.getDate() > closingDay) {
            invoiceMonth = addMonths(installmentDate, 1);
          } else {
            invoiceMonth = installmentDate;
          }

          if (invoiceMonth.getMonth() === refMonth && invoiceMonth.getFullYear() === refYear) {
            const cat = categories.find((c) => c.id === t.category_id);
            items.push({
              description: t.description,
              amount: Number(t.amount) / totalInstallments,
              date: t.date,
              installmentLabel: totalInstallments > 1 ? `${i + 1}/${totalInstallments}` : undefined,
              categoryIcon: cat?.icon,
            });
          }
        }
      });

    return items;
  }, [transactions, card, refMonth, refYear, categories]);

  const total = invoiceItems.reduce((s, i) => s + i.amount, 0);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Faturas</h1>

      {creditCards.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">Cadastre um cartão para ver faturas</p>
      ) : (
        <>
          {/* Card selector */}
          <div className="flex flex-wrap gap-2 animate-in-delay-1">
            {creditCards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCard(c.id)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                  selectedCard === c.id ? 'gradient-primary text-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-center gap-6 animate-in-delay-2">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="p-2 rounded-xl bg-muted text-foreground hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-foreground font-bold text-lg capitalize">
              {format(refDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setMonthOffset((o) => o + 1)} className="p-2 rounded-xl bg-muted text-foreground hover:bg-accent transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Total */}
          <div className="glass rounded-3xl p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Total da Fatura</p>
            <p className="text-3xl font-black text-foreground mt-1">{fmt(total)}</p>
            {card && <p className="text-xs text-muted-foreground mt-1">Vence dia {card.due_day}</p>}
          </div>

          {/* Items */}
          <div className="space-y-2">
            {invoiceItems.length === 0 && <p className="text-muted-foreground text-center py-6">Nenhum item nesta fatura</p>}
            {invoiceItems.map((item, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.categoryIcon || '💳'}</span>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{item.description}</p>
                    <p className="text-muted-foreground text-xs">
                      {format(parseISO(item.date), 'dd/MM/yyyy')}
                      {item.installmentLabel && <span className="ml-2 text-primary">{item.installmentLabel}</span>}
                    </p>
                  </div>
                </div>
                <span className="text-foreground font-bold">{fmt(item.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicesPage;
