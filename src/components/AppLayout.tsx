import React from 'react';
import { NavLink as RouterNavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  CreditCard,
  FileText,
  Calculator,
  LogOut,
  Wallet,
  RefreshCw,
  PiggyBank,
  Repeat,
  Lock,
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { usePlan } from '@/contexts/PlanContext';
import UpgradeGate from '@/components/UpgradeGate';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', mobileLabel: 'Home' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Extrato', mobileLabel: 'Extrato' },
  { to: '/categories', icon: Tag, label: 'Categorias', mobileLabel: 'Categorias' },
  { to: '/cards', icon: CreditCard, label: 'Cartões', mobileLabel: 'Cartões' },
  { to: '/invoices', icon: FileText, label: 'Faturas', mobileLabel: 'Faturas' },
  { to: '/savings', icon: PiggyBank, label: 'Pé de Meia', mobileLabel: 'Metas' },
  { to: '/recurring', icon: Repeat, label: 'Gastos Fixos', mobileLabel: 'Fixos' },
  { to: '/simulation', icon: Calculator, label: 'Simulação', mobileLabel: 'Simular' },
];

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { fetchData, loading } = useFinance();
  const { canAccess } = usePlan();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageAllowed = canAccess(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/40 backdrop-blur-xl fixed inset-y-0 left-0 z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-xl font-black text-foreground">Moneto</span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="p-3 space-y-2">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>

          <div className="border-t border-border pt-3 px-4 pb-3">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-expense mt-2 hover:underline"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-28 lg:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <div className="mx-3 mb-4 bg-card/90 backdrop-blur-2xl border border-border/40 rounded-[1.75rem] py-1.5 px-1 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 5).map((item) => (
              <RouterNavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:scale-90'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-1 rounded-xl bg-primary/12 transition-all duration-300" />
                    )}
                    <item.icon className={`relative w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
                    <span className={`relative text-[9px] font-semibold mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                      {item.mobileLabel}
                    </span>
                  </>
                )}
              </RouterNavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
