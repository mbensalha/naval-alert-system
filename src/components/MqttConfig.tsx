
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useMqttStore } from "@/services/mqttService";
import { toast } from "sonner";
import { WifiIcon, SignalIcon } from "lucide-react";

const MqttConfig = () => {
  const [brokerUrl, setBrokerUrl] = useState("ws://localhost:9001");
  const [topic, setTopic] = useState("esp32/gps");
  const { connect, subscribe, connected } = useMqttStore();
  
  const handleConnect = () => {
    if (!brokerUrl) {
      toast.error("Veuillez entrer l'URL du broker MQTT");
      return;
    }
    
    try {
      connect(brokerUrl);
      
      if (topic) {
        setTimeout(() => subscribe(topic), 1000);
      }
      
      toast.success("Connecté au broker MQTT", {
        description: `Abonné au topic: ${topic}`,
      });
    } catch (error) {
      toast.error("Erreur de connexion au broker MQTT", {
        description: String(error),
      });
    }
  };
  
  return (
    <Card className="bg-navy text-white border-none shadow-lg">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-base flex items-center">
          <WifiIcon className="mr-2 h-4 w-4 text-accent" />
          Configuration MQTT
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/80">Broker URL</label>
          <Input 
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            placeholder="ws://localhost:9001"
            className="bg-navy-light text-white border-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-white/80">Topic</label>
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="esp32/gps"
            className="bg-navy-light text-white border-accent"
          />
        </div>
        
        <Button 
          onClick={handleConnect}
          className="w-full bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
        >
          {connected ? (
            <span className="flex items-center">
              <SignalIcon className="mr-2 h-4 w-4" />
              Connecté
            </span>
          ) : (
            "Connecter"
          )}
        </Button>
        
        {connected && (
          <div className="flex items-center justify-center p-2 bg-green-900/30 rounded border border-green-500/30">
            <SignalIcon className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-green-400 text-sm">Connecté au broker MQTT</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MqttConfig;
