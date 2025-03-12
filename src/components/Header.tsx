
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const logout = useAuthStore((state) => state.logout);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <header className="bg-[#03224c] text-white py-3 px-4 flex justify-between items-center shadow-md animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="bg-logo w-12 h-12 bg-contain bg-no-repeat bg-center rounded-full" />
        <h1 className="text-lg font-semibold tracking-wide">Système de Surveillance Navale</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <time className="text-lg font-medium">
          {format(currentDateTime, 'dd MMMM yyyy HH:mm:ss', { locale: fr })}
        </time>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="text-white hover:bg-white/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

export default Header;
