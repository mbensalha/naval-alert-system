
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useRouteStore } from '@/store/routeStore';
import { useMqttStore } from '@/services/mqttService';
import { Route, Flag, FlagTriangleRight, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const RouteHistory = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isTracking, startTracking, stopTracking, getTracks, addTrackPoint, getActiveTrack } = useRouteStore();
  const { lastPosition } = useMqttStore();

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
          
          <Card className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-4xl mx-auto mb-6">
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
          
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Routes enregistrées</h2>
            
            {tracks.length === 0 ? (
              <p className="text-gray-500">Aucune route enregistrée.</p>
            ) : (
              <div className="space-y-4">
                {tracks.map((track) => (
                  <Card key={track.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-4">
                      <CardTitle className="text-lg">{track.name}</CardTitle>
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
                        <p>{track.points.length} points enregistrés</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RouteHistory;
