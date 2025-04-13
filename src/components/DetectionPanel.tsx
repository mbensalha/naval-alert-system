
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { Camera } from "lucide-react";
import OpenSeaMap from "./OpenSeaMap";
import GpsPosition from "./GpsPosition";

const DetectionPanel = () => {
  const detectShip = useShipStore((state) => state.detectShip);
  
  return (
    <div className="grid grid-cols-2 gap-6 h-full animate-fade-in">
      <div className="flex flex-col gap-6">
        <OpenSeaMap />
        <GpsPosition />
      </div>
      
      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-lg flex items-center">
            <Camera className="mr-2 h-5 w-5 text-accent" />
            CAMERA
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="w-full h-full min-h-[340px] bg-navy-light flex flex-col items-center justify-center gap-4">
            <div className="w-full h-full relative">
              <img 
                src="/entrance-camera.jpg"
                alt="Entrance camera"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-navy/40 backdrop-blur-sm text-accent px-3 py-1 rounded-full text-sm">
                Entrance camera
              </div>
              <div className="absolute top-4 right-4 flex items-center">
                <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>
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
