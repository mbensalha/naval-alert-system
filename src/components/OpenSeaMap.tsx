
import React, { useRef, useEffect, useState } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { Map, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { lastPosition, deviceId } = useMqttStore();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

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
      
      // Add custom styles to hide zoom controls and top window elements
      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const style = iframeDoc.createElement('style');
            style.textContent = `
              .olControlZoom, 
              .olControlAttribution,
              .olControlPermalink,
              .olControlLayerSwitcher,
              .olControlNavigation,
              .olControlPanZoomBar,
              .olControlMousePosition,
              #permalink,
              #map_header,
              #menu,
              #javascriptRequired { 
                display: none !important; 
              }
            `;
            iframeDoc.head.appendChild(style);
          }
        } catch (e) {
          console.log("Cannot inject styles due to cross-origin restrictions");
        }
      };
      
      mapContainerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      setMapInitialized(true);
      
      console.log("Map initialized with default position");
    }
  }, [mapInitialized]);

  // Function to update the map position
  const updateMapPosition = () => {
    if (!lastPosition || !iframeRef.current || !mapInitialized) return;
    
    const currentTime = Date.now();
    // Only update every 3 seconds (3000ms)
    if (currentTime - lastUpdateTime < 3000) return;
    
    console.log("Updating marker position on OpenSeaMap (3s interval):", lastPosition);
    const { lat, long } = lastPosition;
    
    const markerLabel = deviceId ? 
      `${deviceId} - ${new Date().toLocaleTimeString()}` : 
      `Position GPS - ${new Date().toLocaleTimeString()}`;
    
    try {
      // We need to recreate the URL to maintain the same view but update the marker
      const currentUrl = new URL(iframeRef.current.src);
      const currentZoom = currentUrl.searchParams.get('zoom') || '10';
      
      iframeRef.current.src = `https://map.openseamap.org/?zoom=${currentZoom}&lat=${lat}&lon=${long}&mlat=${lat}&mlon=${long}&mtext=${encodeURIComponent(markerLabel)}`;
      console.log("Updated marker via URL parameters");
      
      setLastUpdateTime(currentTime);
    } catch (e) {
      console.error("Error updating marker:", e);
    }
  };

  // Set up interval for updating the map position
  useEffect(() => {
    const interval = setInterval(() => {
      updateMapPosition();
    }, 3000);
    
    // Initial update
    updateMapPosition();
    
    return () => clearInterval(interval);
  }, [lastPosition, deviceId, mapInitialized, lastUpdateTime]);

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
