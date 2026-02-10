import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { PiggyBank, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddSavingsGoalModal from '@/components/modals/AddSavingsGoalModal';
import AddSavingsTransactionModal from '@/components/modals/AddSavingsTransactionModal';

const COLORS = ['hsl(234, 89%, 74%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(347, 77%, 50%)', 'hsl(200, 70%, 55%)'];

const SavingsPage = () => {
  const { savingsGoals, savingsTransactions, deleteSavingsGoal, deleteSavingsTransaction } = useFinance();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddTx, setShowAddTx] = useState<string | null>(null);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getGoalBalance = (goalId: string) => {
    return savingsTransactions
      .filter((t) => t.goal_id === goalId)
      .reduce((sum, t) => sum + (t.type === 'DEPOSIT' ? Number(t.amount) : -Number(t.amount)), 0);
  };

  const totalSaved = savingsGoals.reduce((sum, g) => sum + getGoalBalance(g.id), 0);

  const pieData = savingsGoals
    .map((g) => ({ name: g.name, value: Math.max(getGoalBalance(g.id), 0), icon: g.icon }))
    .filter((d) => d.value > 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-foreground animate-in">Pé de Meia</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest animate-in-delay-1">Suas reservas</p>
        </div>
        <button onClick={() => setShowAddGoal(true)} className="gradient-primary px-5 py-2.5 rounded-2xl text-foreground font-semibold text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Nova Meta
        </button>
      </div>

      {/* Total card */}
      <div className="glass rounded-3xl p-5 text-center animate-in-delay-1">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
          <PiggyBank className="w-6 h-6 text-foreground" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Guardado</p>
        <p className="text-3xl font-black text-foreground mt-1">{fmt(totalSaved)}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        {pieData.length > 0 && (
          <div className="glass rounded-3xl p-5 animate-in-delay-2">
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Distribuição</h3>
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
          </div>
        )}

        {/* Goals */}
        <div className={`${pieData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3 animate-in-delay-2`}>
          {savingsGoals.length === 0 && (
            <p className="text-muted-foreground text-center py-10">Crie sua primeira meta de economia</p>
          )}
          {savingsGoals.map((goal) => {
            const balance = getGoalBalance(goal.id);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min((balance / target) * 100, 100) : 0;
            const goalTxs = savingsTransactions.filter((t) => t.goal_id === goal.id);

            return (
              <div key={goal.id} className="glass rounded-3xl p-5 space-y-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <p className="text-foreground font-bold">{goal.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Meta: {fmt(target)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddTx(goal.id)}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-expense transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-semibold">{fmt(balance)}</span>
                    <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full gradient-income transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Recent transactions */}
                {goalTxs.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-border/50">
                    {goalTxs.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm group/tx">
                        <div className="flex items-center gap-2">
                          {t.type === 'DEPOSIT' ? (
                            <ArrowUpCircle className="w-4 h-4 text-income" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 text-expense" />
                          )}
                          <span className="text-muted-foreground text-xs">
                            {format(parseISO(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${t.type === 'DEPOSIT' ? 'text-income' : 'text-expense'}`}>
                            {t.type === 'DEPOSIT' ? '+' : '-'}{fmt(Number(t.amount))}
                          </span>
                          <button
                            onClick={() => deleteSavingsTransaction(t.id)}
                            className="opacity-0 group-hover/tx:opacity-100 text-muted-foreground hover:text-expense"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddGoal && <AddSavingsGoalModal onClose={() => setShowAddGoal(false)} />}
      {showAddTx && <AddSavingsTransactionModal goalId={showAddTx} onClose={() => setShowAddTx(null)} />}
    </div>
  );
};

export default SavingsPage;
