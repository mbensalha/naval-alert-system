import React, { useRef, useEffect, useState } from 'react';
import { useMqttStore } from '@/services/mqttService';
import { useShipStore } from '@/store/shipStore';
import { Map, MapPin, Anchor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const OpenSeaMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const { lastPosition, deviceId } = useMqttStore();
  const { ships } = useShipStore();

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
      
      iframe.onload = () => {
        try {
          const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDocument) {
            const styleElement = iframeDocument.createElement('style');
            styleElement.textContent = `
              .ol-zoom, .ol-attribution, .ol-zoom-panel, .ol-rotate, .ol-scale-line {
                display: none !important;
              }
            `;
            iframeDocument.head.appendChild(styleElement);
          }
        } catch (e) {
          console.error("Could not access iframe document: ", e);
        }
      };
      
      console.log("Map initialized with default position");
    }
  }, [mapInitialized]);

  useEffect(() => {
    if (mapInitialized && lastPosition) {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      
      updateTimerRef.current = setInterval(() => {
        updateMarkerPosition();
      }, 3000);
      
      updateMarkerPosition();
    }
    
    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [lastPosition, deviceId, mapInitialized]);

  const updateMarkerPosition = () => {
    if (!lastPosition || !iframeRef.current) return;
    
    console.log("Updating marker position on OpenSeaMap:", lastPosition);
    const { lat, long } = lastPosition;
    
    const markerLabel = deviceId ? 
      `${deviceId}` : 
      `Position GPS`;
    
    try {
      const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDocument) {
        const iframeWindow = iframeRef.current.contentWindow;
        
        if (iframeWindow && iframeWindow.hasOwnProperty('ol')) {
          console.log("OpenLayers API available, but not implemented");
        } else {
          const currentUrl = new URL(iframeRef.current.src);
          const currentZoom = currentUrl.searchParams.get('zoom') || '14';
          
          const baseUrl = `https://map.openseamap.org/?zoom=${currentZoom}&lat=${currentUrl.searchParams.get('lat')}&lon=${currentUrl.searchParams.get('lon')}`;
          
          let shipMarkers = '';
          ships.forEach((ship, index) => {
            if (ship.position && ship.classification) {
              const shipColor = getShipMarkerColor(ship.classification);
              shipMarkers += `&mlat${index+1}=${ship.position.lat}&mlon${index+1}=${ship.position.long}`;
              shipMarkers += `&mtext${index+1}=${encodeURIComponent(ship.classification)}&marker${index+1}=triangle&color${index+1}=${shipColor}`;
            }
          });
          
          const tempIframe = document.createElement('iframe');
          tempIframe.style.display = 'none';
          tempIframe.src = baseUrl + `&mlat=${lat}&mlon=${long}&mtext=${encodeURIComponent(markerLabel)}&marker=ship` + shipMarkers;
          
          tempIframe.onload = () => {
            if (iframeRef.current) {
              iframeRef.current.src = tempIframe.src;
              document.body.removeChild(tempIframe);
            }
          };
          
          document.body.appendChild(tempIframe);
          console.log("Updated marker via URL parameters");
        }
      }
    } catch (e) {
      console.error("Error updating marker:", e);
    }
  };

  const getShipMarkerColor = (classification: string) => {
    switch (classification) {
      case 'HOSTILE':
        return 'red';
      case 'SUSPECT':
        return 'orange';
      case 'INCONNU':
        return 'blue';
      case 'PRESUME AMI':
        return 'purple';
      case 'NEUTRE':
        return 'gray';
      case 'AMI':
        return 'green';
      default:
        return 'blue';
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
