import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, BarChart3, Receipt, Settings } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
  { path: '/month', label: 'Mes', icon: BarChart3 },
  { path: '/history', label: 'Historial', icon: Receipt },
  { path: '/settings', label: 'Ajustes', icon: Settings },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/40 bg-card/90 shadow-[0_-10px_30px_-24px_hsl(var(--foreground)/0.4)] backdrop-blur-xl dark:border-white/8 dark:bg-card/78 dark:shadow-[0_-16px_38px_-30px_hsl(220_45%_2%/0.95)] md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex min-w-[60px] flex-col items-center gap-0.5 py-1"
            >
              <div className={`flex h-8 w-16 items-center justify-center rounded-full transition-all ${active ? 'bg-primary/12' : ''}`}>
                <tab.icon size={22} className={`transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-[11px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
