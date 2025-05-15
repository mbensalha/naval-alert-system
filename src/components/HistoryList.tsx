
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { ShipClassification } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check, HelpCircle, Shield, AlertTriangle, Sailboat, Handshake, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  // Use a simple state to store ships
  const [ships, setShips] = useState([]);
  const exportHistory = useShipStore(state => state.exportHistory);
  
  // Get ships from store once on component mount, not during render
  useEffect(() => {
    const ships = useShipStore.getState().getHistory();
    setShips(ships);
    
    // Subscribe to store changes
    const unsubscribe = useShipStore.subscribe((state) => {
      // Only update when the ships array changes
      const updatedShips = state.getHistory();
      setShips(updatedShips);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  const handleExport = () => {
    try {
      const jsonStr = exportHistory();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
      
      // Create download link
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `navires_detection_${new Date().toISOString().split('T')[0]}.json`);
      
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast.success("Historique des détections exporté avec succès");
    } catch (error) {
      console.error("Error exporting history:", error);
      toast.error("Erreur lors de l'exportation de l'historique");
    }
  };
  
  const handleImageDownload = (imageData: string, shipId: string) => {
    if (!imageData) {
      toast.error("Pas d'image disponible pour cette détection");
      return;
    }
    
    try {
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = imageData;
      downloadLink.download = `detection_navire_${shipId.substring(0, 8)}.png`;
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      
      toast.success("Image téléchargée avec succès");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Erreur lors du téléchargement de l'image");
    }
  };
  
  if (ships.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-navy">
        <p>Aucun navire dans l'historique</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Détections enregistrées : {ships.length}</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport} 
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>
      
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
            <div className="w-24 h-24 bg-navy/20 rounded overflow-hidden flex items-center justify-center relative group">
              {ship.screenshot ? (
                <>
                  <img 
                    src={ship.screenshot} 
                    alt="Capture navire" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-white p-1 h-auto" 
                      onClick={() => handleImageDownload(ship.screenshot, ship.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </>
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
