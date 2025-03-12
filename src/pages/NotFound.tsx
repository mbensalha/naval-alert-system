
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-naval-bg bg-cover bg-center flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8 animate-scale-up">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-xl text-white/80 mb-6">Page non trouvée</p>
          <p className="text-white/60 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button asChild className="bg-accent text-white hover:bg-accent/90">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
