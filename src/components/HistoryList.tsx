
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { ShipClassification } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, HelpCircle, Shield, AlertTriangle, Sailboat, Handshake } from "lucide-react";
import { useEffect, useState } from "react";

const getClassificationIcon = (classification: ShipClassification) => {
  switch (classification) {
    case "HOSTILE":
      return <AlertTriangle className="h-5 w-5 text-alert" />;
    case "SUSPECT":
      return <Shield className="h-5 w-5 text-suspect" />;
    case "INCONNU":
      return <HelpCircle className="h-5 w-5 text-unknown" />;
    case "PRESUME AMI":
      return <Handshake className="h-5 w-5 text-presumed" />;
    case "NEUTRE":
      return <Sailboat className="h-5 w-5 text-neutral" />;
    case "AMI":
      return <Check className="h-5 w-5 text-friendly" />;
  }
};

const getClassificationColor = (classification: ShipClassification) => {
  switch (classification) {
    case "HOSTILE":
      return "bg-alert/10 text-alert border-alert/30";
    case "SUSPECT":
      return "bg-suspect/10 text-black border-suspect/30";
    case "INCONNU":
      return "bg-unknown/10 text-black border-unknown/30";
    case "PRESUME AMI":
      return "bg-presumed/10 text-black border-presumed/30";
    case "NEUTRE":
      return "bg-neutral/10 text-black border-neutral/30";
    case "AMI":
      return "bg-friendly/10 text-friendly border-friendly/30";
  }
};

const HistoryList = () => {
  // Use useState to store the ships instead of calling getHistory() directly in render
  const [ships, setShips] = useState(useShipStore((state) => state.getHistory()));
  
  // Update ships when store changes
  useEffect(() => {
    const updateShips = () => {
      setShips(useShipStore.getState().getHistory());
    };
    
    // Subscribe to store changes
    const unsubscribe = useShipStore.subscribe(updateShips);
    
    // Initial fetch
    updateShips();
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  if (ships.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-navy">
        <p>Aucun navire dans l'historique</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      {ships.map((ship) => (
        <Card 
          key={ship.id} 
          className="bg-white/90 backdrop-blur border overflow-hidden transition-all hover:shadow-md hover-scale"
        >
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Détecté {formatDistanceToNow(ship.detectionTime, { addSuffix: true, locale: fr })}</span>
              {ship.classification && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getClassificationColor(ship.classification)}`}>
                  {getClassificationIcon(ship.classification)}
                  {ship.classification}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-4 flex gap-3">
            <div className="w-24 h-24 bg-navy/20 rounded overflow-hidden flex items-center justify-center">
              {ship.screenshot ? (
                <img 
                  src={ship.screenshot} 
                  alt="Capture navire" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-navy/50">Pas d'image</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm mb-1">
                <span className="font-medium">Position:</span> {ship.position.lat.toFixed(4)}°, {ship.position.long.toFixed(4)}°
              </p>
              <p className="text-sm">
                <span className="font-medium">Date et heure:</span> {ship.detectionTime.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HistoryList;
