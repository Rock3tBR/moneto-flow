import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, Banknote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type InvoiceStatus = 'PAID' | 'OPEN' | 'OVERDUE';

const InvoicesPage = () => {
  const { transactions, creditCards, categories, recurringExpenses, addTransaction } = useFinance();
  const [selectedCard, setSelectedCard] = useState<string>(creditCards[0]?.id || '');
  const [monthOffset, setMonthOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [paying, setPaying] = useState(false);

  const card = creditCards.find((c) => c.id === selectedCard);
  const refDate = addMonths(new Date(), monthOffset);
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();

  // Check if this invoice has been paid by looking for a payment transaction
  const isInvoicePaid = useMemo(() => {
    if (!card) return false;
    return transactions.some((t) => {
      if (t.type !== 'EXPENSE' || t.card_id !== null) return false;
      const monthDate = new Date(refYear, refMonth, 1);
      const expectedDesc = `Pgto Fatura ${card.name} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`;
      return t.description.toLowerCase() === expectedDesc.toLowerCase();
    });
  }, [transactions, card, refMonth, refYear]);

  // Determine invoice status
  const invoiceStatus: InvoiceStatus = useMemo(() => {
    if (isInvoicePaid) return 'PAID';
    if (!card) return 'OPEN';
    const now = new Date();
    const dueDate = new Date(refYear, refMonth, card.due_day);
    if (now > dueDate) return 'OVERDUE';
    return 'OPEN';
  }, [isInvoicePaid, card, refMonth, refYear]);

  const invoiceItems = useMemo(() => {
    if (!card) return [];
    const closingDay = card.closing_day;
    const items: { description: string; amount: number; date: string; installmentLabel?: string; categoryIcon?: string; isRecurring?: boolean }[] = [];

    transactions
      .filter((t) => t.card_id === card.id && t.type === 'EXPENSE')
      .forEach((t) => {
        const [year, month, day] = t.date.split('-').map(Number);
        const txDate = new Date(year, month - 1, day);

        let invoiceDate: Date;
        if (txDate.getDate() >= closingDay) {
          invoiceDate = new Date(txDate.getFullYear(), txDate.getMonth(), 1);
        } else {
          invoiceDate = new Date(txDate.getFullYear(), txDate.getMonth() - 1, 1);
        }

        if (invoiceDate.getMonth() === refMonth && invoiceDate.getFullYear() === refYear) {
          const cat = categories.find((c) => c.id === t.category_id);
          const totalInstallments = t.installments || 1;
          const currentInstallment = t.current_installment || 1;
          items.push({
            description: t.description,
            amount: Number(t.amount),
            date: t.date,
            installmentLabel: totalInstallments > 1 ? `${currentInstallment}/${totalInstallments}` : undefined,
            categoryIcon: cat?.icon,
          });
        }
      });

    // Only show recurring expenses from the month they were created onwards
    const refAbsMonth = refYear * 12 + refMonth;
    recurringExpenses
      .filter((r) => r.active && r.card_id === card.id)
      .filter((r) => {
        if (!r.created_at) return true;
        const createdDate = new Date(r.created_at);
        const createdAbsMonth = createdDate.getFullYear() * 12 + createdDate.getMonth();
        return refAbsMonth >= createdAbsMonth;
      })
      .forEach((r) => {
        const cat = categories.find((c) => c.id === r.category_id);
        items.push({
          description: r.description,
          amount: Number(r.amount),
          date: '',
          categoryIcon: cat?.icon,
          isRecurring: true,
        });
      });

    return items;
  }, [transactions, recurringExpenses, card, refMonth, refYear, categories]);

  const total = invoiceItems.reduce((s, i) => s + i.amount, 0);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handlePayInvoice = async () => {
    if (!card || total <= 0) return;
    setPaying(true);
    try {
      const monthDate = new Date(refYear, refMonth, 1);
      const description = `Pgto Fatura ${card.name} - ${format(monthDate, "MMM/yyyy", { locale: ptBR })}`;
      const today = new Date().toISOString().slice(0, 10);
      await addTransaction({
        description,
        amount: total,
        type: 'EXPENSE',
        date: today,
        card_id: null,
        category_id: null,
      });
      toast.success('Fatura marcada como paga!');
    } catch {
      toast.error('Erro ao pagar fatura');
    } finally {
      setPaying(false);
    }
  };

  const statusConfig = {
    PAID: { label: 'Paga', icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    OPEN: { label: 'Em aberto', icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    OVERDUE: { label: 'Atrasada', icon: AlertTriangle, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };

  const currentStatusConfig = statusConfig[invoiceStatus];
  const StatusIcon = currentStatusConfig.icon;

  const showInvoice = statusFilter === 'all' || statusFilter === invoiceStatus;

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

          {/* Status filter */}
          <div className="flex flex-wrap gap-2 animate-in-delay-1">
            {([
              { key: 'all', label: 'Todas' },
              { key: 'OVERDUE', label: '⚠️ Atrasadas' },
              { key: 'OPEN', label: '🕐 Em aberto' },
              { key: 'PAID', label: '✅ Pagas' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                  statusFilter === f.key ? 'gradient-primary text-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
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

          {showInvoice ? (
            <>
              {/* Total + Status */}
              <div className="glass rounded-3xl p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className={currentStatusConfig.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {currentStatusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Total da Fatura</p>
                <p className={`text-3xl font-black mt-1 ${
                  invoiceStatus === 'PAID' ? 'text-green-400' : invoiceStatus === 'OVERDUE' ? 'text-red-400' : 'text-foreground'
                }`}>{fmt(total)}</p>
                {card && <p className="text-xs text-muted-foreground mt-1">Vence dia {card.due_day}</p>}

                {/* Pay invoice button */}
                {invoiceStatus !== 'PAID' && total > 0 && (
                  <button
                    onClick={handlePayInvoice}
                    disabled={paying}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    {paying ? 'Pagando...' : 'Marcar como Paga'}
                  </button>
                )}
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
                          {item.isRecurring ? (
                            <span className="text-primary">🔄 Gasto fixo</span>
                          ) : (
                            <>
                              Compra em {format(parseISO(item.date), 'dd/MM/yyyy')}
                              {item.installmentLabel && <span className="ml-2 text-primary">{item.installmentLabel}</span>}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-foreground font-bold">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-10">Nenhuma fatura com este status neste mês</p>
          )}
        </>
      )}
    </div>
  );
};

export default InvoicesPage;
