
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouteStore } from '@/store/routeStore';
import { useMqttStore } from '@/services/mqttService';
import { Route, Flag, FlagTriangleRight, Timer, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const RouteHistory = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isTracking, startTracking, stopTracking, getTracks, addTrackPoint, getActiveTrack } = useRouteStore();
  const { lastPosition } = useMqttStore();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    document.title = "Historique de Route | Système de Surveillance Navale";

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add position to active track when it changes
  useEffect(() => {
    if (isTracking && lastPosition) {
      addTrackPoint(lastPosition);
    }
  }, [lastPosition, isTracking, addTrackPoint]);

  // Initialize map
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
    }
  }, [mapInitialized]);

  // Update map to show selected track
  useEffect(() => {
    if (!selectedTrackId || !mapInitialized || !iframeRef.current) return;
    
    const tracks = getTracks();
    const selectedTrack = tracks.find(track => track.id === selectedTrackId);
    
    if (selectedTrack && selectedTrack.points.length > 0) {
      try {
        // Get center point of the track (usually the first point)
        const centerPoint = selectedTrack.points[0];
        
        // Create URL for the map with track points
        let trackUrl = `https://map.openseamap.org/?zoom=14&lat=${centerPoint.lat}&lon=${centerPoint.long}`;
        
        // Add all track points as markers
        selectedTrack.points.forEach((point, index) => {
          const isStart = index === 0;
          const isEnd = index === selectedTrack.points.length - 1;
          
          let markerType = "dot";
          let markerColor = "blue";
          let markerText = "";
          
          if (isStart) {
            markerType = "triangle";
            markerColor = "green";
            markerText = "Début";
          } else if (isEnd) {
            markerType = "triangle";
            markerColor = "red";
            markerText = "Fin";
          }
          
          trackUrl += `&mlat${index+1}=${point.lat}&mlon${index+1}=${point.long}`;
          
          if (isStart || isEnd) {
            trackUrl += `&mtext${index+1}=${encodeURIComponent(markerText)}`;
          }
          
          trackUrl += `&marker${index+1}=${markerType}&color${index+1}=${markerColor}`;
        });
        
        // Update iframe URL
        iframeRef.current.src = trackUrl;
      } catch (e) {
        console.error("Error updating map with track:", e);
      }
    }
  }, [selectedTrackId, getTracks, mapInitialized]);

  // Format date and time
  const formattedDate = currentTime.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const formattedTime = currentTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const handleStartTracking = () => {
    startTracking();
    toast.success("Début de l'enregistrement de la route", {
      description: "La route est maintenant en cours d'enregistrement"
    });
  };

  const handleStopTracking = () => {
    stopTracking();
    toast.info("Fin de l'enregistrement de la route", {
      description: "La route a été enregistrée"
    });
  };

  const handleViewTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  const tracks = getTracks();
  const activeTrack = getActiveTrack();

  return (
    <div className="min-h-screen bg-naval-bg bg-cover bg-center flex flex-col">
      <Header />
      
      <div className="bg-[#03224c] text-white py-2 px-6 flex justify-between items-center shadow-md">
        <span>Système de Surveillance Navale</span>
        <span>{formattedDate} - {formattedTime}</span>
      </div>
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-4 mb-8">
            <Route className="h-10 w-10 text-white" />
            <h1 className="text-4xl font-bold text-white text-shadow">Historique des Routes</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Enregistrement de route</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      disabled={isTracking} 
                      onClick={handleStartTracking}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Démarrer
                    </Button>
                    <Button 
                      variant="outline" 
                      disabled={!isTracking} 
                      onClick={handleStopTracking}
                      className="bg-red-500 text-white hover:bg-red-600"
                    >
                      <FlagTriangleRight className="mr-2 h-4 w-4" />
                      Arrêter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isTracking ? (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <div className="flex items-center mb-2">
                        <Timer className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-medium">Enregistrement en cours</span>
                      </div>
                      <p>
                        Début: {activeTrack?.startTime.toLocaleTimeString()}{' '}
                        | Points enregistrés: {activeTrack?.points.length || 0}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Cliquez sur "Démarrer" pour commencer l'enregistrement de votre route.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Routes enregistrées</h2>
                
                {tracks.length === 0 ? (
                  <p className="text-gray-500">Aucune route enregistrée.</p>
                ) : (
                  <div className="space-y-4">
                    {tracks.map((track) => (
                      <Card 
                        key={track.id} 
                        className={cn(
                          "overflow-hidden cursor-pointer hover:border-blue-400 transition-all",
                          selectedTrackId === track.id && "border-2 border-blue-500"
                        )}
                        onClick={() => handleViewTrack(track.id)}
                      >
                        <CardHeader className="bg-gray-50 p-4">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>{track.name}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleViewTrack(track.id)}
                              className="text-blue-500"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Afficher
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <p className="text-sm text-gray-500">Début</p>
                              <p>{track.startTime.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Fin</p>
                              <p>{track.endTime ? track.endTime.toLocaleString() : 'En cours'}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Points</p>
                            <p className="flex items-center">{track.points.length} points enregistrés 
                              {track.points.length > 0 && (
                                <Navigation className="h-4 w-4 ml-2 text-blue-500" />
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col h-full">
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-lg flex items-center">
                  <Navigation className="mr-2 h-5 w-5 text-accent" />
                  CARTE DES ROUTES
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative min-h-[500px]">
                <div ref={mapContainerRef} className="w-full h-full">
                  {!selectedTrackId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy-light/50 z-10">
                      <span className="text-white/50">Sélectionnez une route pour l'afficher</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RouteHistory;
