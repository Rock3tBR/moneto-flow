import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import AddTransactionModal from '@/components/modals/AddTransactionModal';

const COLORS = ['hsl(234, 89%, 74%)', 'hsl(160, 84%, 39%)', 'hsl(347, 77%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(200, 70%, 55%)'];

const Dashboard = () => {
  const { transactions, categories, creditCards } = useFinance();
  const [showAddTx, setShowAddTx] = useState(false);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthTxs = transactions.filter((t) => {
    const d = parseISO(t.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd });
  });

  const income = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const totalLimit = creditCards.reduce((s, c) => s + Number(c.limit_amount), 0);
  const usedLimit = monthTxs.filter((t) => t.card_id).reduce((s, t) => s + Number(t.amount), 0);

  // Area chart data - last 30 days grouped by day
  const areaData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 29 + i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const dayExpense = transactions
      .filter((t) => t.date === dayStr && t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    return { day: format(d, 'dd/MM'), value: dayExpense };
  });

  // Pie chart data
  const pieData = categories
    .map((cat) => {
      const total = monthTxs
        .filter((t) => t.category_id === cat.id && t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter((d) => d.value > 0);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const summaryCards = [
    { label: 'RECEITAS', value: income, icon: TrendingUp, variant: 'income' as const },
    { label: 'DESPESAS', value: expense, icon: TrendingDown, variant: 'expense' as const },
    { label: 'SALDO', value: balance, icon: Wallet, variant: 'primary' as const },
    { label: 'LIMITE DISPONÍVEL', value: totalLimit - usedLimit, icon: CreditCard, variant: 'warning' as const },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Dashboard</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest animate-in-delay-1">
            {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
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

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-5">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Evolução de Gastos</h3>
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

      {showAddTx && <AddTransactionModal onClose={() => setShowAddTx(false)} />}
    </div>
  );
};

export default Dashboard;
