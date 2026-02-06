import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Trash2, Plus } from 'lucide-react';
import AddCardModal from '@/components/modals/AddCardModal';

const CardsPage = () => {
  const { creditCards, transactions, deleteCreditCard } = useFinance();
  const [showAdd, setShowAdd] = useState(false);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Cartões</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in-delay-1">
        {creditCards.map((card) => {
          const used = transactions.filter((t) => t.card_id === card.id && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          const limit = Number(card.limit_amount);
          const pct = limit > 0 ? (used / limit) * 100 : 0;
          return (
            <div key={card.id} className="relative overflow-hidden rounded-3xl p-6 gradient-primary shadow-2xl group min-h-[200px] flex flex-col justify-between">
              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-foreground/5" />
              <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-foreground/5" />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-foreground/70 text-xs uppercase tracking-widest">Cartão de Crédito</p>
                  <p className="text-foreground text-xl font-black mt-1">{card.name}</p>
                </div>
                <button onClick={() => deleteCreditCard(card.id)} className="opacity-0 group-hover:opacity-100 text-foreground/50 hover:text-foreground transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="relative z-10 space-y-3">
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>Utilizado: {fmt(used)}</span>
                  <span>Limite: {fmt(limit)}</span>
                </div>
                <div className="w-full bg-foreground/20 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all bg-foreground/70"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>Fecha dia {card.closing_day}</span>
                  <span>Vence dia {card.due_day}</span>
                </div>
              </div>
            </div>
          );
        })}
        {creditCards.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">Nenhum cartão cadastrado</p>}
      </div>

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default CardsPage;
