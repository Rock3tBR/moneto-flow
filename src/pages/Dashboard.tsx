import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import AddTransactionModal from '@/components/modals/AddTransactionModal';
import { calculateTotalUsedLimit } from '@/lib/cardLimitUtils';

const COLORS = ['hsl(234, 89%, 74%)', 'hsl(160, 84%, 39%)', 'hsl(347, 77%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(200, 70%, 55%)'];

const Dashboard = () => {
  const { transactions, categories, creditCards, savingsGoals, savingsTransactions, recurringExpenses } = useFinance();
  const [showAddTx, setShowAddTx] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dayRange, setDayRange] = useState(30);

  const now = new Date();
  const refDate = addMonths(now, monthOffset);
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();

  const isCurrentMonth = refMonth === now.getMonth() && refYear === now.getFullYear();
  const effectiveEnd = isCurrentMonth ? now : monthEnd;
  const effectiveEndStr = format(effectiveEnd, 'yyyy-MM-dd');

  const monthTxs = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: monthStart, end: effectiveEnd });
  });

  const activeRecurring = recurringExpenses.filter((r) => r.active);
  const recurringMonthTotal = activeRecurring.reduce((s, r) => s + Number(r.amount), 0);

  const monthIncome = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0) + recurringMonthTotal;

  const txsUpToEnd = transactions.filter((t) => t.date <= effectiveEndStr);
  const cumulativeIncome = txsUpToEnd.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const cumulativeExpense = txsUpToEnd.filter((t) => t.type === 'EXPENSE' && !t.card_id).reduce((s, t) => s + Number(t.amount), 0);
  const balance = cumulativeIncome - cumulativeExpense;

  const totalSavings = savingsTransactions.reduce(
    (s, t) => s + (t.type === 'DEPOSIT' ? Number(t.amount) : -Number(t.amount)), 0
  );

  // Card limit — new logic using shared utility
  const usedLimitByMonth = useMemo(() => {
    return calculateTotalUsedLimit(creditCards, transactions, recurringExpenses, refMonth, refYear);
  }, [transactions, creditCards, recurringExpenses, refMonth, refYear]);

  const totalLimit = creditCards.reduce((s, c) => s + Number(c.limit_amount), 0);
  const limitPct = totalLimit > 0 ? (usedLimitByMonth / totalLimit) * 100 : 0;

  // Area chart
  const areaData = useMemo(() => {
    return Array.from({ length: dayRange }, (_, i) => {
      const d = new Date(refDate);
      d.setDate(d.getDate() - dayRange + 1 + i);
      const dayStr = format(d, 'yyyy-MM-dd');
      const dayExpense = transactions
        .filter((t) => t.date === dayStr && t.type === 'EXPENSE')
        .reduce((s, t) => s + Number(t.amount), 0);
      return { day: format(d, 'dd/MM'), value: dayExpense };
    });
  }, [transactions, dayRange, monthOffset]);

  // Expenses by category (including recurring)
  const pieData = useMemo(() => {
    const catMap = new Map<string, number>();
    monthTxs.filter((t) => t.type === 'EXPENSE').forEach((t) => {
      const key = t.category_id || '__none__';
      catMap.set(key, (catMap.get(key) || 0) + Number(t.amount));
    });
    activeRecurring.forEach((r) => {
      const key = r.category_id || '__none__';
      catMap.set(key, (catMap.get(key) || 0) + Number(r.amount));
    });
    return Array.from(catMap.entries()).map(([catId, value]) => {
      const cat = categories.find((c) => c.id === catId);
      return { name: cat?.name || 'Sem categoria', value, icon: cat?.icon || '📋' };
    }).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [monthTxs, activeRecurring, categories]);

  // Expenses by card
  const cardData = creditCards.map((card) => {
    const total = monthTxs
      .filter((t) => t.card_id === card.id && t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0)
      + activeRecurring.filter((r) => r.card_id === card.id).reduce((s, r) => s + Number(r.amount), 0);
    return { name: card.name, value: total };
  }).filter((d) => d.value > 0);

  // Income chart
  const incomeData = useMemo(() => {
    return monthTxs
      .filter((t) => t.type === 'INCOME')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 8)
      .map((t) => ({ name: t.description.length > 15 ? t.description.slice(0, 15) + '…' : t.description, value: Number(t.amount) }));
  }, [monthTxs]);

  // Savings pie
  const savingsPieData = savingsGoals
    .map((g) => {
      const bal = savingsTransactions
        .filter((t) => t.goal_id === g.id)
        .reduce((s, t) => s + (t.type === 'DEPOSIT' ? Number(t.amount) : -Number(t.amount)), 0);
      return { name: g.name, value: Math.max(bal, 0), icon: g.icon };
    })
    .filter((d) => d.value > 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const summaryCards = [
    { label: 'RECEITAS', value: monthIncome, icon: TrendingUp, variant: 'income' as const },
    { label: 'DESPESAS', value: monthExpense, icon: TrendingDown, variant: 'expense' as const },
    { label: 'SALDO', value: balance, icon: Wallet, variant: 'primary' as const },
    { label: 'PÉ DE MEIA', value: totalSavings, icon: PiggyBank, variant: 'warning' as const },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-5">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-3xl font-black text-foreground animate-in">Dashboard</h1>
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
        <button onClick={() => setShowAddTx(true)} className="gradient-primary px-4 py-2.5 rounded-2xl text-foreground font-bold text-xs lg:text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
          + Novo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
        {summaryCards.map((card, i) => (
          <div key={card.label} className={`glass rounded-2xl lg:rounded-3xl p-3 lg:p-5 animate-in-delay-${Math.min(i + 1, 3)}`}>
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center mb-2 lg:mb-3 ${
              card.variant === 'income' ? 'gradient-income' :
              card.variant === 'expense' ? 'gradient-expense' :
              card.variant === 'warning' ? 'gradient-warning' : 'gradient-primary'
            }`}>
              <card.icon className="w-4 h-4 lg:w-5 lg:h-5 text-foreground" />
            </div>
            <p className="text-[10px] lg:text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p>
            <p className="text-base lg:text-2xl font-black text-foreground mt-0.5">{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Card limit */}
      {creditCards.length > 0 && (
        <div className="glass rounded-3xl p-5 animate-in-delay-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Limite de Cartões</h3>
            <span className="text-foreground font-bold">{fmt(totalLimit - usedLimitByMonth)} disponível</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${limitPct >= 90 ? 'bg-red-500' : limitPct >= 70 ? 'bg-yellow-500' : 'gradient-warning'}`}
              style={{ width: `${Math.min(limitPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Usado: {fmt(usedLimitByMonth)} ({Math.min(limitPct, 100).toFixed(1)}%)</span>
            <span>Limite: {fmt(totalLimit)}</span>
          </div>
        </div>
      )}

      {/* Charts Row 1: Evolução + Categorias */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Evolução de Gastos</h3>
            <div className="flex gap-1">
              {[7, 15, 30].map((d) => (
                <button key={d} onClick={() => setDayRange(d)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    dayRange === d ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >{d}d</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(234, 89%, 74%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(234, 89%, 74%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '1rem', color: 'hsl(210, 40%, 96%)' }} formatter={(v: number) => [fmt(v), 'Gastos']} />
              <Area type="monotone" dataKey="value" stroke="hsl(234, 89%, 74%)" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Gastos por Categoria</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.icon} {d.name}</span>
                    </div>
                    <span className="text-foreground font-semibold">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem dados este mês</p>
          )}
        </div>
      </div>

      {/* Charts Row 2: Receitas + Por cartão */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Receitas do Mês</h3>
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '1rem', color: 'hsl(210, 40%, 96%)' }} formatter={(v: number) => [fmt(v), 'Receita']} />
                <Bar dataKey="value" fill="hsl(160, 84%, 39%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem receitas este mês</p>
          )}
        </div>

        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Gastos por Cartão</h3>
          {cardData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cardData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '1rem', color: 'hsl(210, 40%, 96%)' }} formatter={(v: number) => [fmt(v), 'Gasto']} />
                <Bar dataKey="value" fill="hsl(234, 89%, 74%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem gastos em cartão este mês</p>
          )}
        </div>
      </div>

      {/* Pé de Meia */}
      {savingsPieData.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Pé de Meia</h3>
          <div className="grid lg:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={savingsPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {savingsPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex flex-col justify-center">
              {savingsPieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.icon} {d.name}</span>
                  </div>
                  <span className="text-foreground font-semibold">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
    </div>
  );
};

export default Dashboard;
