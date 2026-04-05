import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/auth-provider';
import {
  Store, Gift, Users, ArrowLeftRight, BarChart3, CreditCard,
  Settings, Bell, Menu, X, LogOut, LayoutDashboard, Building2,
  Trophy, Megaphone, UserCog,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Visao Geral' },
  { to: '/dashboard/loja', icon: Store, label: 'Minha Loja' },
  { to: '/dashboard/programas', icon: Trophy, label: 'Programas' },
  { to: '/dashboard/premios', icon: Gift, label: 'Premios' },
  { to: '/dashboard/membros', icon: Users, label: 'Membros' },
  { to: '/dashboard/transacoes', icon: ArrowLeftRight, label: 'Transacoes' },
  { to: '/dashboard/campanhas', icon: Megaphone, label: 'Campanhas' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/equipe', icon: Building2, label: 'Equipe' },
  { to: '/dashboard/funcionarios', icon: UserCog, label: 'Funcionarios' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Assinatura' },
  { to: '/dashboard/configuracoes', icon: Settings, label: 'Configuracoes' },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="font-heading text-xl font-bold text-white">
            Fidel<span className="text-brand-primary">Craft</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground"><X size={20} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-auto p-3">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut size={18} />Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground"><Menu size={20} /></button>
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative text-muted-foreground hover:text-foreground"><Bell size={20} /></button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {user?.name?.charAt(0) || '?'}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
