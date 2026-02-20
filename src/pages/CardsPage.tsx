import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Trash2, Plus, Pencil, CreditCard } from 'lucide-react';
import AddCardModal from '@/components/modals/AddCardModal';

import type { Tables } from '@/integrations/supabase/types';

type CreditCardType = Tables<'credit_cards'>;

const CardsPage = () => {
  const { creditCards, transactions, recurringExpenses, deleteCreditCard } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<CreditCardType | null>(null);

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
          const now = new Date();
          const refMonth = now.getMonth();
          const refYear = now.getFullYear();
          const closingDay = card.closing_day;
          const used = transactions
            .filter((t) => t.card_id === card.id && t.type === 'EXPENSE')
            .filter((t) => {
              const [y, m, d] = t.date.split('-').map(Number);
              const txDate = new Date(y, m - 1, d);
              // Bank logic: on or after closing day → next month's invoice
              const invoiceDate = txDate.getDate() >= closingDay
                ? new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1)
                : new Date(txDate.getFullYear(), txDate.getMonth(), 1);
              return invoiceDate.getMonth() === refMonth && invoiceDate.getFullYear() === refYear;
            })
            .reduce((s, t) => s + Number(t.amount), 0)
            + recurringExpenses.filter((r) => r.active && r.card_id === card.id).reduce((s, r) => s + Number(r.amount), 0);
          const limit = Number(card.limit_amount);
          const pct = limit > 0 ? (used / limit) * 100 : 0;
          return (
            <div key={card.id} className="relative overflow-hidden rounded-3xl p-6 gradient-primary shadow-2xl group min-h-[200px] flex flex-col justify-between">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-foreground/5" />
              <div className="absolute -right-4 top-12 w-24 h-24 rounded-full bg-foreground/5" />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-foreground/70 text-xs uppercase tracking-widest">Cartão de Crédito</p>
                  <p className="text-foreground text-xl font-black mt-1">{card.name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditItem(card)} className="opacity-0 group-hover:opacity-100 text-foreground/50 hover:text-foreground transition-all">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteCreditCard(card.id)} className="opacity-0 group-hover:opacity-100 text-foreground/50 hover:text-foreground transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                <div className="flex justify-between text-sm text-foreground/80">
                  <span>Utilizado: {fmt(used)}</span>
                  <span>Limite: {fmt(limit)}</span>
                </div>
                <div className="w-full bg-foreground/20 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all bg-foreground/70" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>Fecha dia {card.closing_day}</span>
                  <span>Vence dia {card.due_day}</span>
                </div>
              </div>
            </div>
          );
        })}

        {creditCards.length === 0 && (
          <div className="col-span-full glass rounded-3xl p-8 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-foreground font-bold">Nenhum cartão cadastrado</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Cadastre seus cartões de crédito para acompanhar faturas, limites disponíveis e gastos parcelados.
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
