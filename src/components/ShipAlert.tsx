
import { useState, useEffect } from 'react';
import { useShipStore } from '@/store/shipStore';
import { ShipClassification } from '@/types';
import { AlertTriangle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const classifications: { value: ShipClassification; color: string }[] = [
  { value: "HOSTILE", color: "bg-alert" },
  { value: "SUSPECT", color: "bg-suspect" },
  { value: "INCONNU", color: "bg-unknown" },
  { value: "PRESUME AMI", color: "bg-presumed" },
  { value: "NEUTRE", color: "bg-neutral" },
  { value: "AMI", color: "bg-friendly" }
];

const ShipAlert = () => {
  const { toast } = useToast();
  const [isClassifying, setIsClassifying] = useState(false);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const { alertActive, currentShip, classifyShip, dismissAlert, takeScreenshot } = useShipStore();
  
  useEffect(() => {
    if (alertActive && !isClassifying) {
      setIsClassifying(true);
      toast({
        title: "⚠️ Alerte!",
        description: "Un navire militaire détecté ! Classifiez-le.",
        variant: "destructive"
      });
    }
  }, [alertActive, isClassifying, toast]);
  
  useEffect(() => {
    if (!alertActive) {
      setIsClassifying(false);
      setScreenshotTaken(false);
    }
  }, [alertActive]);
  
  const handleClassify = (classification: ShipClassification) => {
    if (!screenshotTaken) {
      toast({
        title: "Action requise",
        description: "Prenez une capture d'écran avant de classifier",
        variant: "default"
      });
      return;
    }
    
    classifyShip(classification);
    toast({
      title: "Classifié avec succès",
      description: `Navire classifié comme ${classification}`,
    });
  };
  
  const handleScreenshot = () => {
    // Simuler une capture d'écran
    const mockImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    takeScreenshot(mockImageData);
    setScreenshotTaken(true);
    toast({
      title: "Capture effectuée",
      description: "Image enregistrée avec succès.",
    });
  };
  
  if (!alertActive || !isClassifying) return null;
  
  return (
    <Dialog open={isClassifying} onOpenChange={dismissAlert}>
      <DialogContent className="sm:max-w-xl animate-scale-up bg-navy-dark text-white border-accent">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <AlertTriangle className="mr-2 h-6 w-6 text-alert animate-pulse-red" />
            Alerte: Navire Militaire Détecté
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          <Card className="bg-navy-light border-none text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Informations de détection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><span className="font-medium">Date:</span> {currentShip?.detectionTime.toLocaleString()}</p>
                <p><span className="font-medium">Position:</span> {currentShip?.position.lat.toFixed(4)}°, {currentShip?.position.long.toFixed(4)}°</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center mb-4">
            <Button 
              variant="outline" 
              onClick={handleScreenshot}
              disabled={screenshotTaken}
              className={`border-accent text-accent hover:bg-accent/20 ${screenshotTaken ? 'bg-accent/20' : ''}`}
            >
              <Camera className="mr-2 h-4 w-4" />
              {screenshotTaken ? "Capture effectuée" : "Prendre une capture d'écran"}
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium mb-3">Classification du navire:</h3>
            <div className="grid grid-cols-3 gap-3">
              {classifications.map((classification) => (
                <button
                  key={classification.value}
                  onClick={() => handleClassify(classification.value)}
                  className={`classification-chip ${classification.color} animate-fade-in`}
                  disabled={!screenshotTaken}
                >
                  {classification.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShipAlert;
