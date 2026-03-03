import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type Transaction = Tables<'transactions'>;

interface Props {
  onClose: () => void;
  editData?: Transaction;
}

interface OpenInvoice {
  cardId: string;
  cardName: string;
  month: number;
  year: number;
  total: number;
  label: string;
  key: string;
  status: 'OPEN' | 'OVERDUE';
}

const AddTransactionModal = ({ onClose, editData }: Props) => {
  const { categories, creditCards, transactions, recurringExpenses, addTransaction, updateTransaction } = useFinance();
  const isEdit = !!editData;

  const [mode, setMode] = useState<'normal' | 'invoice'>('normal');
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

  // Invoice payment state
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [invoiceManualAmount, setInvoiceManualAmount] = useState('');
  const [invoiceManualDate, setInvoiceManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceManualMonth, setInvoiceManualMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [invoiceManualCardId, setInvoiceManualCardId] = useState('');

  // Helper: check if invoice is already paid
  const isInvoicePaid = (cardName: string, month: number, year: number) => {
    const monthDate = new Date(year, month, 1);
    const expectedDesc = `Pgto Fatura ${cardName} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`;
    return transactions.some((t) =>
      t.type === 'EXPENSE' && !t.card_id && t.description.toLowerCase() === expectedDesc.toLowerCase()
    );
  };

  // Calculate open invoices (only OPEN and OVERDUE — exclude PAID)
  const openInvoices = useMemo(() => {
    const invoices: OpenInvoice[] = [];
    const now = new Date();

    creditCards.forEach((card) => {
      const closingDay = card.closing_day;
      const invoiceMap = new Map<string, number>();

      transactions
        .filter((t) => t.card_id === card.id && t.type === 'EXPENSE')
        .forEach((t) => {
          const [year, month, day] = t.date.split('-').map(Number);
          const txDate = new Date(year, month - 1, day);

          let invoiceMonth: number, invoiceYear: number;
          if (txDate.getDate() >= closingDay) {
            const next = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 1);
            invoiceMonth = next.getMonth();
            invoiceYear = next.getFullYear();
          } else {
            invoiceMonth = txDate.getMonth();
            invoiceYear = txDate.getFullYear();
          }

          const key = `${invoiceYear}-${invoiceMonth}`;
          invoiceMap.set(key, (invoiceMap.get(key) || 0) + Number(t.amount));
        });

      const activeRecurring = recurringExpenses.filter((r) => r.active && r.card_id === card.id);
      
      const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
      if (!invoiceMap.has(currentKey) && activeRecurring.length > 0) {
        invoiceMap.set(currentKey, 0);
      }

      invoiceMap.forEach((txTotal, key) => {
        const [year, month] = key.split('-').map(Number);
        const recurringTotal = activeRecurring.reduce((s, r) => s + Number(r.amount), 0);
        const total = txTotal + recurringTotal;

        if (total > 0 && !isInvoicePaid(card.name, month, year)) {
          const monthDate = new Date(year, month, 1);
          const dueDate = new Date(year, month, card.due_day);
          const status: 'OPEN' | 'OVERDUE' = now > dueDate ? 'OVERDUE' : 'OPEN';
          const statusLabel = status === 'OVERDUE' ? '⚠️ ATRASADA' : '🕐 Em aberto';

          invoices.push({
            cardId: card.id,
            cardName: card.name,
            month,
            year,
            total,
            label: `${card.name} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })} (${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) ${statusLabel}`,
            key: `${card.id}-${key}`,
            status,
          });
        }
      });
    });

    // Sort: overdue first, then by date desc
    invoices.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'OVERDUE' ? -1 : 1;
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return invoices;
  }, [creditCards, transactions, recurringExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === 'invoice') {
      if (selectedInvoice === 'all') {
        for (const inv of openInvoices) {
          const monthDate = new Date(inv.year, inv.month, 1);
          await addTransaction({
            type: 'EXPENSE',
            description: `Pgto Fatura ${inv.cardName} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`,
            amount: inv.total,
            date: new Date().toISOString().slice(0, 10),
            category_id: null,
            card_id: null,
            installments: 1,
            current_installment: 1,
          });
        }
      } else if (selectedInvoice === 'manual') {
        if (!invoiceManualAmount || !invoiceManualDate || !invoiceManualCardId) {
          setSubmitting(false);
          return;
        }
        const [y, m] = invoiceManualMonth.split('-').map(Number);
        const monthDate = new Date(y, m - 1, 1);
        const card = creditCards.find((c) => c.id === invoiceManualCardId);
        await addTransaction({
          type: 'EXPENSE',
          description: `Pgto Fatura ${card?.name || 'Cartão'} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`,
          amount: parseFloat(invoiceManualAmount),
          date: invoiceManualDate,
          category_id: null,
          card_id: null,
          installments: 1,
          current_installment: 1,
        });
      } else {
        const inv = openInvoices.find((i) => i.key === selectedInvoice);
        if (inv) {
          const monthDate = new Date(inv.year, inv.month, 1);
          await addTransaction({
            type: 'EXPENSE',
            description: `Pgto Fatura ${inv.cardName} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`,
            amount: inv.total,
            date: new Date().toISOString().slice(0, 10),
            category_id: null,
            card_id: null,
            installments: 1,
            current_installment: 1,
          });
        }
      }
      setSubmitting(false);
      onClose();
      return;
    }

    // Normal flow
    if (!description.trim() || !amount || !date) {
      setSubmitting(false);
      return;
    }
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

  const hasOpenInvoices = openInvoices.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">{isEdit ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { setMode('normal'); setType('EXPENSE'); }}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  mode === 'normal' ? 'gradient-primary text-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >Transação</button>
              <button type="button" onClick={() => { setMode('invoice'); setSelectedInvoice(hasOpenInvoices ? '' : 'manual'); }}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  mode === 'invoice' ? 'gradient-expense text-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >💳 Pagar Fatura</button>
            </div>
          )}

          {mode === 'invoice' ? (
            <>
              {hasOpenInvoices ? (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Selecione a fatura</label>
                    <select value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} className={inputClass} required>
                      <option value="" disabled>Escolha uma fatura...</option>
                      {openInvoices.map((inv) => (
                        <option key={inv.key} value={inv.key}>{inv.label}</option>
                      ))}
                      {openInvoices.length > 1 && (
                        <option value="all">🔄 Pagar todas as faturas</option>
                      )}
                      <option value="manual">✏️ Inserir manualmente</option>
                    </select>
                  </div>

                  {selectedInvoice && selectedInvoice !== 'all' && selectedInvoice !== 'manual' && (
                    <div className="glass rounded-2xl p-4 space-y-1">
                      {(() => {
                        const inv = openInvoices.find((i) => i.key === selectedInvoice);
                        if (!inv) return null;
                        const monthDate = new Date(inv.year, inv.month, 1);
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                inv.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {inv.status === 'OVERDUE' ? '⚠️ Atrasada' : '🕐 Em aberto'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">Cartão</p>
                            <p className="text-foreground font-semibold text-sm">{inv.cardName}</p>
                            <p className="text-xs text-muted-foreground mt-2">Referente a</p>
                            <p className="text-foreground font-semibold text-sm capitalize">{format(monthDate, "MMMM/yyyy", { locale: ptBR })}</p>
                            <p className="text-xs text-muted-foreground mt-2">Valor</p>
                            <p className="text-expense font-bold text-lg">{inv.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {selectedInvoice === 'all' && (
                    <div className="glass rounded-2xl p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">Faturas a pagar</p>
                      {openInvoices.map((inv) => {
                        const monthDate = new Date(inv.year, inv.month, 1);
                        return (
                          <div key={inv.key} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                inv.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {inv.status === 'OVERDUE' ? '⚠️' : '🕐'}
                              </span>
                              <span className="text-foreground text-sm">{inv.cardName} - <span className="capitalize">{format(monthDate, "MMM/yy", { locale: ptBR })}</span></span>
                            </div>
                            <span className="text-expense font-bold text-sm">{inv.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="text-foreground font-bold text-sm">Total</span>
                        <span className="text-expense font-bold">{openInvoices.reduce((s, i) => s + i.total, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    </div>
                  )}

                  {selectedInvoice === 'manual' && (
                    <InvoiceManualFields
                      inputClass={inputClass}
                      creditCards={creditCards}
                      cardId={invoiceManualCardId}
                      setCardId={setInvoiceManualCardId}
                      amount={invoiceManualAmount}
                      setAmount={setInvoiceManualAmount}
                      date={invoiceManualDate}
                      setDate={setInvoiceManualDate}
                      month={invoiceManualMonth}
                      setMonth={setInvoiceManualMonth}
                    />
                  )}
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm text-center py-2">Nenhuma fatura em aberto encontrada. Insira manualmente:</p>
                  <InvoiceManualFields
                    inputClass={inputClass}
                    creditCards={creditCards}
                    cardId={invoiceManualCardId}
                    setCardId={setInvoiceManualCardId}
                    amount={invoiceManualAmount}
                    setAmount={setInvoiceManualAmount}
                    date={invoiceManualDate}
                    setDate={setInvoiceManualDate}
                    month={invoiceManualMonth}
                    setMonth={setInvoiceManualMonth}
                  />
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : mode === 'invoice' ? '💳 Pagar Fatura' : (isEdit ? 'Atualizar' : 'Salvar')}
          </button>
        </form>
      </div>
    </div>
  );
};

// Extracted manual fields component
interface ManualFieldsProps {
  inputClass: string;
  creditCards: Tables<'credit_cards'>[];
  cardId: string;
  setCardId: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
}

const InvoiceManualFields = ({ inputClass, creditCards, cardId, setCardId, amount, setAmount, date, setDate, month, setMonth }: ManualFieldsProps) => (
  <>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Cartão</label>
      <select value={cardId} onChange={(e) => setCardId(e.target.value)} className={inputClass} required>
        <option value="" disabled>Selecione o cartão</option>
        {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Valor da fatura</label>
      <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={inputClass} required />
    </div>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Data do pagamento</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
    </div>
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Mês referente</label>
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} required />
    </div>
  </>
);

export default AddTransactionModal;
