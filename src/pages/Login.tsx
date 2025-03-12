
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        toast.success("Connexion réussie");
        navigate('/');
      } else {
        toast.error("Email ou mot de passe incorrect");
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
            <h1 className="text-3xl font-bold text-white text-center mb-6">LOGIN</h1>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
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
              
              <Button
                type="submit"
                className="w-full bg-accent text-white hover:bg-accent/90 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Sign In"}
              </Button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-black/20 flex justify-center text-sm">
            <p className="text-white/60">
              <span>Have an account?</span>{" "}
              <Link to="/register" className="text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
