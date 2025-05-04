
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DetectionPanel from '@/components/DetectionPanel';
import CommandPanel from '@/components/CommandPanel';
import ShipAlert from '@/components/ShipAlert';
import { useMqttStore } from '@/services/mqttService';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    connected,
    lastPosition,
    connect,
    subscribe,
    disconnect
  } = useMqttStore();

  useEffect(() => {
    document.title = "Système de Surveillance Navale";

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Automatically connect to local MQTT broker when dashboard loads
    if (!connected) {
      console.log("Dashboard: Auto-connecting to MQTT broker...");
      try {
        // Use localhost for Raspberry Pi deployment
        connect("mqtt://localhost", 1883);
        setTimeout(() => {
          if (useMqttStore.getState().connected) {
            // Subscribe to the updated topic from Node-RED flow
            subscribe("esp32/navire/gps");
            toast.success("Connecté au broker MQTT", {
              description: "Abonné au topic: esp32/navire/gps"
            });
          }
        }, 1500);
      } catch (error) {
        console.error("Error auto-connecting to MQTT:", error);
      }
    }

    return () => {
      clearInterval(timer);
    };
  }, [connected, connect, subscribe]);

  const handleReconnect = () => {
    try {
      // Reconnect to MQTT broker
      disconnect();
      toast.info("Tentative de reconnexion MQTT en cours...");

      // Use localhost for Raspberry Pi
      connect("mqtt://localhost", 1883);
      setTimeout(() => {
        if (useMqttStore.getState().connected) {
          subscribe("esp32/navire/gps");
          toast.success("Reconnecté au broker MQTT");
        } else {
          toast.error("Échec de reconnexion au broker MQTT");
        }
      }, 1500);
    } catch (error) {
      console.error("Error reconnecting to MQTT:", error);
      toast.error("Erreur lors de la reconnexion MQTT");
    }
  };

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

  return <div className="min-h-screen bg-naval-bg bg-cover bg-center flex flex-col">
      <Header />
      
      <div className="bg-[#03224c] text-white py-2 px-6 flex justify-between items-center shadow-md">
        <span>Système de Surveillance Navale</span>
        <div className="flex items-center gap-4">
          {connected ? <span className="text-green-400 text-sm flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              MQTT Connecté (Localhost)
            </span> : <span className="text-red-400 text-sm flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
              MQTT Déconnecté
              <Button variant="ghost" size="icon" className="ml-2 text-xs h-6 w-6" onClick={handleReconnect}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </span>}
          <span>{formattedDate} - {formattedTime}</span>
        </div>
      </div>
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <h1 className="text-4xl font-bold mb-8 text-shadow text-slate-900">HOME</h1>
          
          {!connected && !lastPosition}
          
          <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1">
            <DetectionPanel />
            <CommandPanel />
          </div>
        </main>
      </div>
      
      <ShipAlert />
    </div>;
};

export default Dashboard;
