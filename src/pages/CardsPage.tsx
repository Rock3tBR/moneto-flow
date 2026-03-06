import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Trash2, Plus, Pencil, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddCardModal from '@/components/modals/AddCardModal';
import { calculateCardUsedLimit } from '@/lib/cardLimitUtils';

import type { Tables } from '@/integrations/supabase/types';

type CreditCardType = Tables<'credit_cards'>;

const CardsPage = () => {
  const { creditCards, transactions, recurringExpenses, deleteCreditCard } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<CreditCardType | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const refDate = addMonths(now, monthOffset);
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();
  const isCurrentMonth = refMonth === now.getMonth() && refYear === now.getFullYear();

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-4 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-3xl font-black text-foreground animate-in">Cartões</h1>
          <div className="flex items-center gap-2 mt-1 animate-in-delay-1">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors active:scale-90">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-muted-foreground text-xs lg:text-sm uppercase tracking-widest capitalize">
              {format(refDate, "MMM 'de' yyyy", { locale: ptBR })}
            </span>
            {isCurrentMonth && (
              <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold uppercase tracking-wider animate-pulse">
                live
              </span>
            )}
            <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors active:scale-90">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="gradient-primary px-4 py-2.5 rounded-2xl text-foreground font-bold text-xs lg:text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 inline mr-1" /> Novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in-delay-1">
        {creditCards.map((card) => {
          const used = calculateCardUsedLimit(card, transactions, recurringExpenses, refMonth, refYear);
          const limit = Number(card.limit_amount);
          const pct = limit > 0 ? (used / limit) * 100 : 0;
          return (
            <div key={card.id} className="relative overflow-hidden rounded-2xl lg:rounded-3xl p-4 lg:p-6 gradient-primary shadow-2xl group min-h-[170px] lg:min-h-[200px] flex flex-col justify-between">
              <div className="absolute -right-8 -top-8 w-32 lg:w-40 h-32 lg:h-40 rounded-full bg-foreground/5" />
              <div className="absolute -right-4 top-10 w-20 lg:w-24 h-20 lg:h-24 rounded-full bg-foreground/5" />

              <div className="flex items-start justify-between relative z-10">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground/70 text-[10px] lg:text-xs uppercase tracking-widest">Cartão de Crédito</p>
                  <p className="text-foreground text-lg lg:text-xl font-black mt-0.5 truncate">{card.name}</p>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button onClick={() => setEditItem(card)} className="lg:opacity-0 lg:group-hover:opacity-100 text-foreground/50 hover:text-foreground transition-all p-1.5">
                    <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                  <button onClick={() => deleteCreditCard(card.id)} className="lg:opacity-0 lg:group-hover:opacity-100 text-foreground/50 hover:text-foreground transition-all p-1.5">
                    <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>

              <div className="relative z-10 space-y-2 lg:space-y-3">
                <div className="flex justify-between text-xs lg:text-sm text-foreground/80">
                  <span>Usado: {fmt(used)}</span>
                  <span>{Math.min(pct, 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-foreground/20 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-foreground/70'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] lg:text-xs text-foreground/60">
                  <span>Fecha dia {card.closing_day} • Vence dia {card.due_day}</span>
                  <span>{fmt(limit)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {creditCards.length === 0 && (
          <div className="col-span-full glass rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center space-y-3">
            <CreditCard className="w-10 h-10 lg:w-12 lg:h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-bold text-sm lg:text-base">Nenhum cartão cadastrado</p>
            <p className="text-muted-foreground text-xs lg:text-sm max-w-sm mx-auto">
              Cadastre seus cartões de crédito para acompanhar faturas, limites e gastos parcelados.
            </p>
          </div>
        )}
      </div>

      {(showAdd || editItem) && (
        <AddCardModal
          editData={editItem || undefined}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
        />
      )}
    </div>
  );
};

export default CardsPage;
