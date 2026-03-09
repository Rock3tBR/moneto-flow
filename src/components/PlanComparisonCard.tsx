import React from 'react';
import { Sparkles, Crown, Check } from 'lucide-react';
import { PLAN_LABELS, PLAN_PRICES, PlanType } from '@/lib/planLimits';

const plans: { key: PlanType; icon: React.ElementType; color: string; features: string[] }[] = [
  {
    key: 'free',
    icon: Sparkles,
    color: 'text-muted-foreground',
    features: ['3 cartões', '30 transações/mês', '1 meta de economia'],
  },
  {
    key: 'plus',
    icon: Sparkles,
    color: 'text-blue-400',
    features: ['10 cartões', '200 transações/mês', '5 metas', 'Categorias', 'Faturas'],
  },
  {
    key: 'pro',
    icon: Crown,
    color: 'text-amber-400',
    features: ['Tudo ilimitado', 'Simulação de compras', 'Gastos fixos', 'Pé de Meia'],
  },
];

const PlanComparisonCard = () => {
  return (
    <div className="glass rounded-2xl lg:rounded-3xl p-4 lg:p-6 animate-in-delay-1">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm lg:text-base font-bold text-foreground">Conheça nossos planos</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((p) => (
          <div
            key={p.key}
            className={`rounded-2xl p-4 border transition-all ${
              p.key === 'pro'
                ? 'border-amber-400/30 bg-amber-400/5'
                : p.key === 'plus'
                  ? 'border-blue-400/30 bg-blue-400/5'
                  : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <p.icon className={`w-4 h-4 ${p.color}`} />
              <span className="font-bold text-foreground text-sm">{PLAN_LABELS[p.key]}</span>
            </div>
            <p className="text-xl font-black text-foreground">
              {PLAN_PRICES[p.key] === 0 ? (
                'R$ 0'
              ) : (
                <>R$ {PLAN_PRICES[p.key]}<span className="text-xs font-normal text-muted-foreground">/mês</span></>
              )}
            </p>
            <ul className="mt-3 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className={`w-3 h-3 flex-shrink-0 ${p.color}`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanComparisonCard;
