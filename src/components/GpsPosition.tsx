
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMqttStore } from "@/services/mqttService";
import { useShipStore } from "@/store/shipStore";
import { Compass, MapPinIcon } from "lucide-react";
import { useEffect, useState } from "react";

const GpsPosition = () => {
  const { lastPosition } = useMqttStore();
  const { currentShip } = useShipStore();
  const [displayPosition, setDisplayPosition] = useState({ lat: 0, long: 0 });
  
  useEffect(() => {
    console.log("MQTT lastPosition:", lastPosition);
    
    if (lastPosition) {
      console.log("Updating display with MQTT position:", lastPosition);
      // When we receive a position from MQTT, update the display
      setDisplayPosition(lastPosition);
    } else if (currentShip?.position) {
      console.log("Using ship position:", currentShip.position);
      // If we have no MQTT position but there's a detected ship, show its position
      setDisplayPosition(currentShip.position);
    }
  }, [lastPosition, currentShip]);
  
  return (
    <Card className="bg-navy text-white border-none shadow-lg">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-base flex items-center">
          <Compass className="mr-2 h-4 w-4 text-accent" />
          Position GPS:
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="h-20 bg-navy-light rounded flex flex-col items-center justify-center">
          <div className="flex items-center mb-2">
            <MapPinIcon className="h-5 w-5 text-accent mr-2" />
            <span className="text-white">Position actuelle</span>
          </div>
          <span className="text-white/80">
            {displayPosition.lat.toFixed(6)}° N, {displayPosition.long.toFixed(6)}° E
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsPosition;
