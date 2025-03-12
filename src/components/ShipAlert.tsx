
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShipClassification } from '@/types';
import { useShipStore } from '@/store/shipStore';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ShipAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { currentShip, classifyShip } = useShipStore();
  
  const classifications: ShipClassification[] = [
    "HOSTILE",
    "SUSPECT",
    "INCONNU",
    "PRESUME AMI",
    "NEUTRE",
    "AMI"
  ];
  
  useEffect(() => {
    if (currentShip && !currentShip.classification) {
      setIsVisible(true);
      setIsFlashing(true);
      
      // Show toast notification
      toast.warning("Un navire militaire détecté ! Classifier le", {
        description: "Veuillez classifier le navire détecté",
        duration: 5000,
      });
    } else {
      setIsVisible(false);
      setIsFlashing(false);
    }
  }, [currentShip]);
  
  const handleClassify = (classification: ShipClassification) => {
    if (currentShip) {
      classifyShip(classification);
      setIsVisible(false);
      setIsFlashing(false);
      
      toast.success(`Navire classifié comme ${classification}`, {
        duration: 3000,
      });
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Alert className="bg-navy border border-accent shadow-lg max-w-md">
        <Bell className={`h-5 w-5 ${isFlashing ? 'text-red-500 animate-pulse' : 'text-accent'}`} />
        <AlertTitle className="text-white font-bold text-lg">
          Alerte: Navire Militaire Détecté!
        </AlertTitle>
        <AlertDescription className="text-white/80 mt-2">
          Un navire militaire a été détecté. Veuillez le classifier immédiatement.
        </AlertDescription>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {classifications.map((classification) => (
            <Button
              key={classification}
              variant="outline"
              className={`border-accent text-white hover:bg-accent/20 ${
                classification === "HOSTILE" ? "border-red-500 text-red-400 hover:bg-red-900/20" : 
                classification === "AMI" ? "border-green-500 text-green-400 hover:bg-green-900/20" : ""
              }`}
              onClick={() => handleClassify(classification)}
            >
              {classification}
            </Button>
          ))}
        </div>
      </Alert>
    </div>
  );
};

export default ShipAlert;
