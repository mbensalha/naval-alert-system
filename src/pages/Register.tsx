
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      const success = register(email, password);
      
      if (success) {
        toast.success("Compte créé avec succès");
        navigate('/login');
      } else {
        toast.error("Cet email est déjà utilisé");
      }
      
      setIsLoading(false);
    }, 800);
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-naval-bg bg-cover bg-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 bg-logo bg-contain bg-no-repeat bg-center mb-6" />
        
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-scale-up">
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-3xl font-bold text-white text-center mb-6">INSCRIPTION</h1>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-accent"
                  placeholder="academienavale@gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-accent pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-accent"
                  placeholder="••••••••"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-accent text-white hover:bg-accent/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Création..." : "Créer un compte"}
              </Button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-black/20 flex justify-center text-sm">
            <p className="text-white/60">
              <span>Déjà un compte?</span>{" "}
              <Link to="/login" className="text-accent hover:underline">
                Connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
