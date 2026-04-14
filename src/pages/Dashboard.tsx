import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DetectionPanel from '@/components/DetectionPanel';
import CommandPanel from '@/components/CommandPanel';
import ShipAlert from '@/components/ShipAlert';
import { useMqttStore } from '@/services/mqttService';
import { AlertCircle, RefreshCw, Settings, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [brokerAddress, setBrokerAddress] = useState("192.168.8.105");
  const [brokerPort, setBrokerPort] = useState(1883);
  const [gpsTopic, setGpsTopic] = useState("esp32/navire/gps");
  const [imageTopic, setImageTopic] = useState("station/navire/image");
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
        // Using the updated Jetson IP address
        connect(brokerAddress, {
          port: brokerPort
        });
        setTimeout(() => {
          if (useMqttStore.getState().connected) {
            // Subscribe to the topics
            subscribe(gpsTopic);
            subscribe(imageTopic);
            toast.success("Connecté au broker MQTT", {
              description: `Abonné aux topics: ${gpsTopic}, ${imageTopic}`
            });
          } else {
            toast.error("Échec de connexion au broker MQTT", {
              description: "Vérifiez que Mosquitto est bien lancé sur votre Raspberry Pi"
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
  }, [connected, connect, subscribe, brokerAddress, brokerPort, gpsTopic, imageTopic]);
  const handleReconnect = () => {
    try {
      // Reconnect to MQTT broker
      disconnect();
      toast.info("Tentative de reconnexion MQTT en cours...");
      connect(brokerAddress, {
        port: brokerPort
      });
      setTimeout(() => {
        if (useMqttStore.getState().connected) {
          subscribe(gpsTopic);
          subscribe(imageTopic);
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
  const handleConfigSave = () => {
    // First disconnect from current broker
    if (connected) {
      disconnect();
    }

    // Then reconnect with new settings
    try {
      connect(brokerAddress, {
        port: brokerPort
      });
      setTimeout(() => {
        if (useMqttStore.getState().connected) {
          subscribe(gpsTopic);
          subscribe(imageTopic);
          toast.success("Configuration MQTT mise à jour", {
            description: `Connecté à ${brokerAddress}:${brokerPort} - Topics: ${gpsTopic}, ${imageTopic}`
          });
        } else {
          toast.error("Échec de connexion avec la nouvelle configuration");
        }
      }, 1500);
    } catch (error) {
      console.error("Error updating MQTT config:", error);
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
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-shadow text-slate-900">HOME</h1>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration MQTT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configuration MQTT</DialogTitle>
                  <DialogDescription>
                    Paramétrez votre connexion au broker MQTT local
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="broker" className="text-right">
                      Adresse IP
                    </Label>
                    <Input id="broker" value={brokerAddress} onChange={e => setBrokerAddress(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="port" className="text-right">
                      Port
                    </Label>
                    <Input id="port" type="number" value={brokerPort} onChange={e => setBrokerPort(parseInt(e.target.value))} className="col-span-3" />
                  </div>
                  <div>
                    <div className="mb-2 font-medium">Topics</div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="gpsTopic" className="text-right">
                        GPS (ESP32)
                      </Label>
                      <Input id="gpsTopic" value={gpsTopic} onChange={e => setGpsTopic(e.target.value)} className="col-span-3" />
                    </div>
                    
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleConfigSave}>Appliquer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {!connected}
          
          <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1">
            <DetectionPanel />
            <CommandPanel />
          </div>

          <div className="mt-6">
            <div className="bg-navy rounded-lg border border-white/10 shadow-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
                <Video className="h-5 w-5 text-accent" />
                <span className="text-white font-semibold">TRAITEMENT VIDÉO SÉCURISÉ</span>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-white/70 text-sm text-center">
                  Le flux vidéo est capturé par le Jetson, chiffré par FPGA en AES-CTR, puis reconstruit pour affichage.
                </p>
                <div className="flex justify-center">
                  <Button
                    className="bg-accent text-white hover:bg-accent/80"
                    onClick={() => toast.info("Traitement vidéo lancé...")}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Traiter la vidéo
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <span className="text-white text-xs font-semibold block text-center">Vidéo originale</span>
                    <video
                      src="http://127.0.0.1:5000/videos/video_originale.mp4"
                      controls playsInline loop
                      className="w-full rounded border border-white/10 bg-navy-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-white text-xs font-semibold block text-center">Vidéo chiffrée</span>
                    <video
                      src="http://127.0.0.1:5000/videos/video_chiffree.mp4"
                      controls playsInline loop
                      className="w-full rounded border border-white/10 bg-navy-light"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-white text-xs font-semibold block text-center">Vidéo déchiffrée</span>
                    <video
                      src="http://127.0.0.1:5000/videos/video_dechiffree.mp4"
                      controls playsInline loop
                      className="w-full rounded border border-white/10 bg-navy-light"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <ShipAlert />
    </div>;
};
export default Dashboard;