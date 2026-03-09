import React, { useState } from 'react';
import { Sparkles, Crown, ChevronDown } from 'lucide-react';
import { usePlan } from '@/contexts/PlanContext';
import { PLAN_LABELS, PLAN_PRICES, PlanType } from '@/lib/planLimits';

const planIcons: Record<PlanType, React.ElementType> = {
  free: Sparkles,
  plus: Sparkles,
  pro: Crown,
};

const planColors: Record<PlanType, string> = {
  free: 'bg-muted text-muted-foreground',
  plus: 'bg-blue-500/15 text-blue-400',
  pro: 'bg-amber-500/15 text-amber-400',
};

const PlanBadge = () => {
  const { plan } = usePlan();
  const [open, setOpen] = useState(false);
  const Icon = planIcons[plan];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full ${planColors[plan]} hover:opacity-80`}
      >
        <Icon className="w-4 h-4" />
        Plano {PLAN_LABELS[plan]}
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 glass-strong rounded-2xl p-3 shadow-2xl border border-border/50 space-y-2 z-50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">Trocar plano</p>
          {(['free', 'plus', 'pro'] as PlanType[]).map((p) => {
            const PIcon = planIcons[p];
            const isActive = p === plan;
            return (
              <button
                key={p}
                disabled
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive ? planColors[p] + ' font-bold' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <PIcon className="w-4 h-4" />
                <span className="flex-1 text-left">{PLAN_LABELS[p]}</span>
                {PLAN_PRICES[p] > 0 ? (
                  <span className="text-xs">R$ {PLAN_PRICES[p]}/mês</span>
                ) : (
                  <span className="text-xs">Grátis</span>
                )}
                {isActive && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">Atual</span>}
              </button>
            );
          })}
          <p className="text-[10px] text-muted-foreground text-center pt-1">Em breve: upgrade pelo app</p>
        </div>
      )}
    </div>
  );
};

export default PlanBadge;
