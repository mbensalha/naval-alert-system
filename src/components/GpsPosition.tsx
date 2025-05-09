
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMqttStore } from "@/services/mqttService";
import { useShipStore } from "@/store/shipStore";
import { Compass, MapPinIcon, Gauge, Clock, Calendar, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCoordinate, kmhToMph } from "@/utils/formatUtils";

const GpsPosition = () => {
  const { lastPosition, connected, deviceId, speed, lastUpdate, dateTime } = useMqttStore();
  const { currentShip } = useShipStore();
  const [displayPosition, setDisplayPosition] = useState({ lat: 0, long: 0 });
  const [positionSource, setPositionSource] = useState<'mqtt' | 'ship' | 'none'>('none');
  
  useEffect(() => {
    console.log("GpsPosition component - MQTT connected:", connected);
    console.log("GpsPosition component - MQTT lastPosition:", lastPosition);
    console.log("GpsPosition component - MQTT deviceId:", deviceId);
    console.log("GpsPosition component - MQTT speed:", speed);
    console.log("GpsPosition component - MQTT lastUpdate:", lastUpdate);
    
    if (lastPosition) {
      console.log("Updating display with MQTT position:", lastPosition);
      // When we receive a position from MQTT, update the display
      setDisplayPosition(lastPosition);
      setPositionSource('mqtt');
    } else if (currentShip?.position) {
      console.log("Using ship position:", currentShip.position);
      // If we have no MQTT position but there's a detected ship, show its position
      setDisplayPosition(currentShip.position);
      setPositionSource('ship');
    } else {
      setPositionSource('none');
    }
  }, [lastPosition, currentShip, connected, deviceId, speed, lastUpdate, dateTime]);
  
  // Format the last update time if available
  const formattedLastUpdate = lastUpdate 
    ? lastUpdate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    : null;
  
  return (
    <Card className="bg-navy text-white border-none shadow-lg">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <Compass className="mr-2 h-4 w-4 text-accent" />
            Position GPS:
            {deviceId && <span className="text-xs text-accent ml-2">({deviceId})</span>}
          </div>
          {connected ? (
            <div className="flex items-center text-green-400">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="text-xs">Connecté</span>
            </div>
          ) : (
            <div className="flex items-center text-red-400">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-xs">Déconnecté</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <div className="bg-navy-light rounded p-4 space-y-4">
          <div className="flex items-center">
            <MapPinIcon className="h-5 w-5 text-accent mr-2" />
            <span className="text-white">Position actuelle</span>
            {positionSource === 'mqtt' && (
              <span className="text-xs text-green-400 ml-2">(MQTT)</span>
            )}
          </div>
          
          {positionSource !== 'none' ? (
            <span className="text-white/80 block">
              {formatCoordinate(displayPosition.lat, true)} {formatCoordinate(displayPosition.long, false)}
            </span>
          ) : (
            <span className="text-white/50 text-sm block">En attente de données GPS...</span>
          )}
          
          {/* Affichage de la vitesse si disponible */}
          {speed !== null && (
            <div className="flex items-center mt-4">
              <Gauge className="h-5 w-5 text-accent mr-2" />
              <span className="text-white">Vitesse:</span>
              <span className="text-white/80 ml-2">{speed.toFixed(2)} mph</span>
            </div>
          )}
          
          {/* Affichage du dernier moment de mise à jour */}
          {formattedLastUpdate && (
            <div className="flex items-center mt-2 text-xs text-white/60">
              <Clock className="h-3 w-3 mr-1" />
              <span>Dernière mise à jour: {formattedLastUpdate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GpsPosition;
