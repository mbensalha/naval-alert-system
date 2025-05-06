
import React, { useRef, useEffect, useState } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { useShipStore } from '@/store/shipStore';
import { Map, Anchor, Gauge, Route } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { formatCoordinate, kmhToMph } from '@/utils/formatUtils';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { lastPosition, deviceId, speed } = useMqttStore();
  const { ships } = useShipStore();
  const [mapUrl, setMapUrl] = useState<string>("");
  const [positions, setPositions] = useState<{lat: number, long: number}[]>([]);
  
  // Keep track of positions to draw trajectory
  useEffect(() => {
    if (lastPosition) {
      setPositions(prev => {
        // Only add new position if it's different from the last one
        if (prev.length > 0) {
          const lastPos = prev[prev.length - 1];
          if (lastPos.lat === lastPosition.lat && lastPos.long === lastPosition.long) {
            return prev;
          }
        }
        // Keep last 100 positions to avoid performance issues
        const newPositions = [...prev, lastPosition];
        if (newPositions.length > 100) {
          return newPositions.slice(-100);
        }
        return newPositions;
      });
    }
  }, [lastPosition]);

  // Update map URL when position changes
  useEffect(() => {
    if (lastPosition) {
      const { lat, long } = lastPosition;
      console.log("Updating OpenSeaMap with position:", { lat, long });
      
      // Base URL with position
      let url = `https://map.openseamap.org/?zoom=14&lat=${lat}&lon=${long}`;
      
      // Add marker for current position
      url += `&marker=ship&mtext=${encodeURIComponent(deviceId || "ESP32")}`;
      
      // Add trajectory points (limited to 10 for URL length constraints)
      const trajectoryPoints = positions.slice(-10);
      if (trajectoryPoints.length > 1) {
        trajectoryPoints.forEach((point, index) => {
          if (index === 0) return; // Skip the first point as it's the current position
          url += `&mlat${index}=${point.lat}&mlon${index}=${point.long}`;
          url += `&marker${index}=dot&color${index}=blue`;
        });
      }
      
      // Add ship markers (if available)
      ships.forEach((ship, index) => {
        if (ship.position && ship.classification) {
          const shipColor = getShipMarkerColor(ship.classification);
          const idx = index + trajectoryPoints.length;
          url += `&mlat${idx}=${ship.position.lat}&mlon${idx}=${ship.position.long}`;
          url += `&mtext${idx}=${encodeURIComponent(ship.classification)}&marker${idx}=triangle&color${idx}=${shipColor}`;
        }
      });
      
      setMapUrl(url);
      console.log("Map URL updated:", url);
    } else {
      // Default position (Marseille)
      setMapUrl("https://map.openseamap.org/?zoom=10&lat=43.2965&lon=5.3698");
    }
  }, [lastPosition, positions, ships, deviceId]);

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
          <div className="flex items-center mt-1">
            <Route className="h-4 w-4 text-accent mr-2" />
            <span>Points de trajectoire: {positions.length}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OpenSeaMap;
