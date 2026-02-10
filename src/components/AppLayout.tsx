import React from 'react';
import { NavLink as RouterNavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Extrato' },
  { to: '/categories', icon: Tag, label: 'Categorias' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/invoices', icon: FileText, label: 'Faturas' },
  { to: '/savings', icon: PiggyBank, label: 'Pé de Meia' },
  { to: '/recurring', icon: Repeat, label: 'Gastos Fixos' },
  { to: '/simulation', icon: Calculator, label: 'Simulação' },
];

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const { fetchData, loading } = useFinance();
  const navigate = useNavigate();

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
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-4 right-4 glass-strong rounded-3xl py-2 px-2 flex justify-around z-30 shadow-2xl">
        {navItems.slice(0, 6).map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-xs transition-all ${
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </RouterNavLink>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
