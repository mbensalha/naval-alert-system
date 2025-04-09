
import React, { useRef, useEffect } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { Map, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { lastPosition, deviceId } = useMqttStore();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the iframe for OpenSeaMap
    if (!iframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.title = "OpenSeaMap";
      
      // Set default view of the map (will be updated when position is available)
      const defaultLat = 43.2965;  // Default to Mediterranean Sea
      const defaultLong = 5.3698;  // (Marseille coordinates)
      iframe.src = `https://map.openseamap.org/?zoom=10&lat=${defaultLat}&lon=${defaultLong}&mlat=${defaultLat}&mlon=${defaultLong}&mtext=${encodeURIComponent("Position Initiale")}`;
      
      mapContainerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
    }
  }, []);

  // Update map when position changes
  useEffect(() => {
    if (lastPosition && iframeRef.current) {
      console.log("Updating OpenSeaMap with new position:", lastPosition);
      const { lat, long } = lastPosition;
      
      // Create a label for the marker
      const markerLabel = deviceId ? 
        `${deviceId} - ${new Date().toLocaleTimeString()}` : 
        `Position GPS - ${new Date().toLocaleTimeString()}`;
      
      iframeRef.current.src = `https://map.openseamap.org/?zoom=14&lat=${lat}&lon=${long}&mlat=${lat}&mlon=${long}&mtext=${encodeURIComponent(markerLabel)}`;
    }
  }, [lastPosition, deviceId]);

  return (
    <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-lg flex items-center">
          <Map className="mr-2 h-5 w-5 text-accent" />
          CARTE MARITIME
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative min-h-[400px]">
        <div ref={mapContainerRef} className="w-full h-full">
          {!lastPosition && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-light/50 z-10">
              <span className="text-white/50">En attente de position GPS...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenSeaMap;
