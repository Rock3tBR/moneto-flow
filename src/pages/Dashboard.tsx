import React, { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import AddTransactionModal from '@/components/modals/AddTransactionModal';

const COLORS = ['hsl(234, 89%, 74%)', 'hsl(160, 84%, 39%)', 'hsl(347, 77%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(200, 70%, 55%)'];

const Dashboard = () => {
  const { transactions, categories, creditCards, savingsGoals, savingsTransactions, recurringExpenses } = useFinance();
  const [showAddTx, setShowAddTx] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dayRange, setDayRange] = useState(30);

  const refDate = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(refDate);
  const monthEnd = endOfMonth(refDate);

  const monthTxs = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const income = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

  // Pé de Meia total
  const totalSavings = savingsGoals.reduce((sum, g) => {
    return sum + savingsTransactions
      .filter((t) => t.goal_id === g.id)
      .reduce((s, t) => s + (t.type === 'DEPOSIT' ? Number(t.amount) : -Number(t.amount)), 0);
  }, 0);

  // Saldo correto: Receitas - Despesas - Pé de Meia
  const balance = income - expense - totalSavings;

  // Limite dos cartões - calculado com TODAS as transações vinculadas (não só do mês)
  const totalLimit = creditCards.reduce((s, c) => s + Number(c.limit_amount), 0);
  const usedLimit = transactions
    .filter((t) => t.card_id && t.type === 'EXPENSE')
    .reduce((s, t) => s + Number(t.amount), 0);

  // Area chart - gastos nos últimos N dias a partir da data de referência
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

  // Gastos por categoria
  const pieData = categories
    .map((cat) => {
      const total = monthTxs
        .filter((t) => t.category_id === cat.id && t.type === 'EXPENSE')
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter((d) => d.value > 0);

  // Gastos por cartão
  const cardData = creditCards.map((card) => {
    const total = monthTxs
      .filter((t) => t.card_id === card.id && t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0);
    return { name: card.name, value: total };
  }).filter((d) => d.value > 0);

  // Pé de Meia por meta (para gráfico)
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
    { label: 'RECEITAS', value: income, icon: TrendingUp, variant: 'income' as const },
    { label: 'DESPESAS', value: expense, icon: TrendingDown, variant: 'expense' as const },
    { label: 'SALDO', value: balance, icon: Wallet, variant: 'primary' as const },
    { label: 'PÉ DE MEIA', value: totalSavings, icon: PiggyBank, variant: 'warning' as const },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Dashboard</h1>
          {/* Month nav */}
          <div className="flex items-center gap-3 mt-1 animate-in-delay-1">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-muted-foreground text-sm uppercase tracking-widest capitalize">
              {format(refDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setMonthOffset((o) => o + 1)} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAddTx(true)}
          className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          + Transação
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {summaryCards.map((card, i) => (
          <div
            key={card.label}
            className={`glass rounded-3xl p-4 lg:p-5 animate-in-delay-${Math.min(i + 1, 3)}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              card.variant === 'income' ? 'gradient-income' :
              card.variant === 'expense' ? 'gradient-expense' :
              card.variant === 'warning' ? 'gradient-warning' : 'gradient-primary'
            }`}>
              <card.icon className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{card.label}</p>
            <p className="text-xl lg:text-2xl font-black text-foreground mt-1">{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Limite dos cartões */}
      {creditCards.length > 0 && (
        <div className="glass rounded-3xl p-5 animate-in-delay-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Limite de Cartões</h3>
            <span className="text-foreground font-bold">{fmt(totalLimit - usedLimit)} disponível</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="h-3 rounded-full gradient-warning transition-all"
              style={{ width: `${Math.min((usedLimit / totalLimit) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Usado: {fmt(usedLimit)}</span>
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
                <button
                  key={d}
                  onClick={() => setDayRange(d)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    dayRange === d ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d}d
                </button>
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
              <Tooltip
                contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '1rem', color: 'hsl(210, 40%, 96%)' }}
                formatter={(v: number) => [fmt(v), 'Gastos']}
              />
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
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
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

      {/* Charts Row 2: Por cartão + Pé de Meia */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Gastos por cartão */}
        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Gastos por Cartão</h3>
          {cardData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cardData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 17%)', borderRadius: '1rem', color: 'hsl(210, 40%, 96%)' }}
                  formatter={(v: number) => [fmt(v), 'Gasto']}
                />
                <Bar dataKey="value" fill="hsl(234, 89%, 74%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Sem gastos em cartão este mês</p>
          )}
        </div>

        {/* Pé de Meia */}
        <div className="glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Pé de Meia</h3>
          {savingsPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={savingsPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                    {savingsPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
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
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Nenhuma reserva criada</p>
          )}
        </div>
      </div>

      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
    </div>
  );
};

export default Dashboard;
