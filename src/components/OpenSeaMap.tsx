import React, { useRef, useEffect, useState } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { Map, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { lastPosition, deviceId } = useMqttStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapInitialized) return;

    if (!iframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.title = "OpenSeaMap";
      
      const defaultLat = 43.2965;
      const defaultLong = 5.3698;
      iframe.src = `https://map.openseamap.org/?zoom=10&lat=${defaultLat}&lon=${defaultLong}`;
      
      mapContainerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      setMapInitialized(true);
      
      console.log("Map initialized with default position");
    }
  }, [mapInitialized]);

  useEffect(() => {
    if (lastPosition && iframeRef.current && mapInitialized) {
      console.log("Updating marker position on OpenSeaMap:", lastPosition);
      const { lat, long } = lastPosition;
      
      const markerLabel = deviceId ? 
        `${deviceId} - ${new Date().toLocaleTimeString()}` : 
        `Position GPS - ${new Date().toLocaleTimeString()}`;
      
      try {
        const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (iframeDocument) {
          const iframeWindow = iframeRef.current.contentWindow;
          if (iframeWindow && iframeWindow.hasOwnProperty('ol')) {
            console.log("Updating marker using OpenLayers API");
          } else {
            const currentUrl = new URL(iframeRef.current.src);
            const currentZoom = currentUrl.searchParams.get('zoom') || '14';
            
            iframeRef.current.src = `https://map.openseamap.org/?zoom=${currentZoom}&lat=${lat}&lon=${long}&mlat=${lat}&mlon=${long}&mtext=${encodeURIComponent(markerLabel)}`;
            console.log("Updated marker via URL parameters");
          }
        }
      } catch (e) {
        console.error("Error updating marker:", e);
      }
    }
  }, [lastPosition, deviceId, mapInitialized]);

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
