import React from 'react';
import { Lock, Sparkles, Crown } from 'lucide-react';
import { PlanType, PLAN_LABELS, PLAN_PRICES, getRequiredPlan } from '@/lib/planLimits';
import { usePlan } from '@/contexts/PlanContext';
import { useLocation } from 'react-router-dom';

const UpgradeGate = () => {
  const { plan } = usePlan();
  const location = useLocation();
  const requiredPlan = getRequiredPlan(location.pathname);

  const plans = [
    { key: 'plus' as PlanType, icon: Sparkles, features: ['10 cartões', '200 transações/mês', '5 metas', 'Categorias personalizadas', 'Faturas detalhadas'] },
    { key: 'pro' as PlanType, icon: Crown, features: ['Cartões ilimitados', 'Transações ilimitadas', 'Metas ilimitadas', 'Simulação de compras', 'Gastos fixos'] },
  ];

  return (
    <div className="p-4 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] animate-in">
      <div className="glass rounded-3xl p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Recurso Exclusivo</h2>
          <p className="text-muted-foreground mt-2">
            Esta funcionalidade requer o plano <span className="text-primary font-bold">{PLAN_LABELS[requiredPlan]}</span> ou superior.
          </p>
        </div>

        <div className="grid gap-3">
          {plans
            .filter((p) => PLAN_CONFIG_ORDER.indexOf(p.key) >= PLAN_CONFIG_ORDER.indexOf(requiredPlan))
            .map((p) => (
              <div key={p.key} className="glass rounded-2xl p-5 text-left space-y-3 border border-border/50 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p.icon className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">{PLAN_LABELS[p.key]}</span>
                  </div>
                  <span className="text-primary font-black text-lg">R$ {PLAN_PRICES[p.key]}<span className="text-xs text-muted-foreground font-normal">/mês</span></span>
                </div>
                <ul className="space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        <p className="text-xs text-muted-foreground">Em breve você poderá fazer upgrade diretamente pelo app.</p>
      </div>
    </div>
  );
};

const PLAN_CONFIG_ORDER: PlanType[] = ['free', 'plus', 'pro'];

export default UpgradeGate;
