
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShipClassification } from '@/types';
import { useShipStore } from '@/store/shipStore';
import { Bell, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { playDetectionAlert, speakMessage } from '@/services/audioService';

const ShipAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { currentShip, classifyShip, alertActive } = useShipStore();
  
  const classifications: ShipClassification[] = [
    "HOSTILE",
    "SUSPECT",
    "INCONNU",
    "PRESUME AMI",
    "NEUTRE",
    "AMI"
  ];
  
  useEffect(() => {
    if (currentShip && !currentShip.classification || alertActive) {
      setIsVisible(true);
      setIsFlashing(true);
      
      // Play audio alert when ship is detected
      playDetectionAlert();
      
      // Speak alert message
      speakMessage("Alerte! Navire militaire détecté! Veuillez le classifier immédiatement.");
      
      // Show toast notification
      toast.warning("Un navire militaire détecté ! Classifier le", {
        description: "Veuillez classifier le navire détecté",
        duration: 5000,
      });
    } else {
      setIsVisible(false);
      setIsFlashing(false);
    }
  }, [currentShip, alertActive]);
  
  const handleClassify = (classification: ShipClassification) => {
    if (currentShip) {
      classifyShip(classification);
      setIsVisible(false);
      setIsFlashing(false);
      
      // Speak classification message
      speakMessage(`Navire classifié comme ${classification}`);
      
      toast.success(`Navire classifié comme ${classification}`, {
        duration: 3000,
      });
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in">
      <Alert className="bg-navy border border-accent shadow-lg max-w-md">
        <AlertTriangle className={`h-5 w-5 ${isFlashing ? 'text-red-500 animate-pulse-red' : 'text-accent'}`} />
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
              className={`border-accent ${
                classification === "HOSTILE" ? "border-red-500 text-red-400 hover:bg-red-900/20" : 
                classification === "AMI" ? "border-green-500 text-green-400 hover:bg-green-900/20" : 
                classification === "SUSPECT" || 
                classification === "INCONNU" || 
                classification === "PRESUME AMI" || 
                classification === "NEUTRE" ? "border-accent text-black hover:bg-accent/20" :
                "border-accent text-white hover:bg-accent/20"
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
