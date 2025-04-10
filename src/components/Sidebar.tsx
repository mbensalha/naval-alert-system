
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { History, Home, Route, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <aside className="w-16 bg-navy-dark text-white h-[calc(100vh-3.5rem)] flex flex-col items-center py-4 animate-slide-in-left">
      <div className="text-3xl font-bold mb-8 tracking-wider">
        AN
      </div>
      
      <nav className="flex flex-col gap-6 items-center">
        <Link 
          to="/"
          className={cn(
            "p-2 rounded-md transition-all hover:bg-white/10 hover-scale",
            isActive('/') && "bg-white/20"
          )}
          aria-label="Accueil"
        >
          <Home size={24} />
        </Link>
        
        <Link 
          to="/history"
          className={cn(
            "p-2 rounded-md transition-all hover:bg-white/10 hover-scale",
            isActive('/history') && "bg-white/20"
          )}
          aria-label="Historique"
        >
          <History size={24} />
        </Link>
        
        <Link 
          to="/route"
          className={cn(
            "p-2 rounded-md transition-all hover:bg-white/10 hover-scale",
            isActive('/route') && "bg-white/20"
          )}
          aria-label="Historique de route"
        >
          <Route size={24} />
        </Link>
        
        <Link 
          to="/settings"
          className={cn(
            "p-2 rounded-md transition-all hover:bg-white/10 hover-scale",
            isActive('/settings') && "bg-white/20"
          )}
          aria-label="Configuration"
        >
          <Settings size={24} />
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
