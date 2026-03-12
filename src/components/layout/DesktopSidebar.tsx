import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, BarChart3, Receipt, Settings, Plus, Wallet, LogOut, ArrowUpRight, ListChecks } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { getCurrentCycleMonthKey, getCycleMonthKey } from '@/lib/app-settings';
import { formatCurrency, getDisplayStatus, getMonthLabel } from '@/lib/formatters';

const tabs = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
  { path: '/month', label: 'Mes', icon: BarChart3 },
  { path: '/payments', label: 'Pagos', icon: ListChecks },
  { path: '/history', label: 'Historial', icon: Receipt },
  { path: '/settings', label: 'Ajustes', icon: Settings },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { state } = useApp();

  const currentMonth = getCurrentCycleMonthKey(state.settings.monthStartDay);
  const monthInstances = state.instances.filter(instance => getCycleMonthKey(instance.dueDate, state.settings.monthStartDay) === currentMonth);
  const totalMonth = monthInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const pendingCount = monthInstances.filter(instance => {
    const status = getDisplayStatus(instance);
    return status === 'pending' || status === 'overdue';
  }).length;
  const balance = state.settings.incomeEstimate - totalMonth;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-white/40 bg-background/70 px-4 py-5 backdrop-blur-xl dark:border-white/8 dark:bg-background/52 md:flex">
      <div className="page-surface overflow-hidden border-primary/10 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--secondary)/0.7)_100%)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Wallet size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">Finzy</h1>
            <p className="text-xs text-muted-foreground">Control de pagos inteligente</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-background/75 p-4">
          <p className="page-section-label">Mes actual</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{getMonthLabel(currentMonth)}</p>
              <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalMonth, state.settings.currency)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-card px-3 py-2.5">
                <p className="text-muted-foreground">Pendientes</p>
                <p className="mt-1 font-semibold text-foreground">{pendingCount}</p>
              </div>
              <div className="rounded-2xl bg-card px-3 py-2.5">
                <p className="text-muted-foreground">Saldo</p>
                <p className={`mt-1 font-semibold ${balance >= 0 ? 'text-status-paid' : 'text-status-overdue'}`}>
                  {formatCurrency(balance, state.settings.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                  : 'text-muted-foreground hover:bg-card/75 hover:text-foreground'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
                  active ? 'bg-white/14' : 'bg-muted/70 text-muted-foreground group-hover:text-foreground'
                }`}
              >
                <tab.icon size={19} />
              </span>
              <span className="flex-1 text-left">{tab.label}</span>
              {active && <ArrowUpRight size={16} className="opacity-70" />}
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => navigate('/add-payment')}
        className="mt-4 flex items-center justify-center gap-2 rounded-[22px] bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.99]"
      >
        <Plus size={20} />
        Agregar pago
      </button>

      <div className="page-surface mt-4 flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{initial}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Cerrar sesion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
