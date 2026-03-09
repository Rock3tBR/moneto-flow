import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PlanType, PLAN_CONFIG, canAccessPage } from '@/lib/planLimits';

interface PlanContextType {
  plan: PlanType;
  loading: boolean;
  canAccess: (page: string) => boolean;
  limits: typeof PLAN_CONFIG['free'];
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const { data, error } = await supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching plan:', error);
      }

      if (!data) {
        // Ensure row exists for existing users
        await supabase.from('user_plans').insert({ user_id: user.id, plan: 'free' });
        setPlan('free');
      } else {
        setPlan(data.plan as PlanType);
      }

      setLoading(false);
    };

    fetchPlan();
  }, [user]);

  // Show upgrade notification for free users
  useEffect(() => {
    if (!loading && plan === 'free' && user && !hasShownToast) {
      setHasShownToast(true);
      const timer = setTimeout(() => {
        toast('🚀 Upgrade seu plano!', {
          description: 'Plus por R$ 10/mês • Pro por R$ 15/mês — Desbloqueie recursos avançados!',
          duration: 8000,
          action: {
            label: 'Ver planos',
            onClick: () => {
              // Future: navigate to plans page
            },
          },
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, plan, user, hasShownToast]);

  return (
    <PlanContext.Provider value={{ plan, loading }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used within PlanProvider');
  return context;
};
