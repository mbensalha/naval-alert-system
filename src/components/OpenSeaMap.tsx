
import React, { useRef, useEffect, useState } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { useShipStore } from '@/store/shipStore';
import { Map, Anchor, Gauge } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { formatCoordinate, kmhToMph } from '@/utils/formatUtils';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { lastPosition, deviceId, speed } = useMqttStore();
  const { ships } = useShipStore();
  const [mapUrl, setMapUrl] = useState<string>("");

  // Update map URL when position changes
  useEffect(() => {
    if (lastPosition) {
      const { lat, long } = lastPosition;
      console.log("Updating OpenSeaMap with position:", { lat, long });
      
      // Base URL with position
      let url = `https://map.openseamap.org/?zoom=14&lat=${lat}&lon=${long}`;
      
      // Add marker for current position
      url += `&marker=ship&mtext=${encodeURIComponent(deviceId || "Position GPS")}`;
      
      // Add ship markers (if available)
      ships.forEach((ship, index) => {
        if (ship.position && ship.classification) {
          const shipColor = getShipMarkerColor(ship.classification);
          url += `&mlat${index+1}=${ship.position.lat}&mlon${index+1}=${ship.position.long}`;
          url += `&mtext${index+1}=${encodeURIComponent(ship.classification)}&marker${index+1}=triangle&color${index+1}=${shipColor}`;
        }
      });
      
      setMapUrl(url);
      console.log("Map URL updated:", url);
    } else {
      // Default position (Marseille)
      setMapUrl("https://map.openseamap.org/?zoom=10&lat=43.2965&lon=5.3698");
    }
  }, [lastPosition, ships, deviceId]);

  const getShipMarkerColor = (classification: string) => {
    switch (classification) {
      case 'HOSTILE': return 'red';
      case 'SUSPECT': return 'orange';
      case 'INCONNU': return 'blue';
      case 'PRESUME AMI': return 'purple';
      case 'NEUTRE': return 'gray';
      case 'AMI': return 'green';
      default: return 'blue';
    }
  };

  return (
    <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-lg flex items-center">
          <Anchor className="mr-2 h-5 w-5 text-accent" />
          CARTE MARITIME
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative min-h-[400px]">
        {mapUrl ? (
          <iframe 
            src={mapUrl}
            className="w-full h-full border-none" 
            title="OpenSeaMap"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-light/50">
            <span className="text-white/50">Chargement de la carte...</span>
          </div>
        )}
        
        {!lastPosition && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy-light/50 z-10">
            <span className="text-white/50">En attente de position GPS...</span>
          </div>
        )}
      </CardContent>
      {lastPosition && (
        <div className="bg-navy-light/60 py-2 px-4 flex flex-col text-sm">
          <div className="flex items-center">
            <span className="text-accent mr-2">Position:</span>
            <span>{formatCoordinate(lastPosition.lat, true)} {formatCoordinate(lastPosition.long, false)}</span>
          </div>
          {speed !== null && (
            <div className="flex items-center mt-1">
              <Gauge className="h-4 w-4 text-accent mr-2" />
              <span>Vitesse: {kmhToMph(speed).toFixed(1)} mph</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default OpenSeaMap;
