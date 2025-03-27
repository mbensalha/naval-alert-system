
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { Camera, Map, MapPin } from "lucide-react";
import { useMqttStore } from "@/services/mqttService";

const DetectionPanel = () => {
  const detectShip = useShipStore((state) => state.detectShip);
  const { lastPosition } = useMqttStore();
  
  return (
    <div className="grid grid-cols-2 gap-6 h-full animate-fade-in">
      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-lg flex items-center">
            <Map className="mr-2 h-5 w-5 text-accent" />
            CARTE
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div className="w-full h-full min-h-[400px] bg-navy-light flex items-center justify-center">
            <span className="text-white/50">Carte maritime</span>
            
            {lastPosition && (
              <div className="absolute" style={{ 
                left: `${50 + (lastPosition.long * 2)}%`, 
                top: `${50 - (lastPosition.lat * 2)}%`,
                transform: 'translate(-50%, -50%)'
              }}>
                <MapPin className="h-6 w-6 text-red-500 animate-pulse" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-lg flex items-center">
            <Camera className="mr-2 h-5 w-5 text-accent" />
            CAMERA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="w-full h-full min-h-[340px] bg-navy-light flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-16 flex items-center justify-center border border-accent/50 rounded bg-navy-dark">
              <Camera className="h-8 w-8 text-accent" />
            </div>
            <p className="text-accent">Entrance camera</p>
            <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent">Active</span>
          </div>
        </CardContent>
        <CardFooter className="p-4">
          <Button 
            className="w-full bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors" 
            size="lg"
            onClick={detectShip}
          >
            <span className="text-xl">ALERTE</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DetectionPanel;
