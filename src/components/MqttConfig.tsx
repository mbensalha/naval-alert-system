
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useMqttStore } from "@/services/mqttService";
import { toast } from "sonner";
import { WifiIcon, SignalIcon, ServerIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const MqttConfig = () => {
  // Pre-configure for test.mosquitto.org
  const [brokerUrl, setBrokerUrl] = useState("test.mosquitto.org");
  const [brokerPort, setBrokerPort] = useState("1883");
  const [topic, setTopic] = useState("esp32/gps");
  const [useAuth, setUseAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const { connect, subscribe, disconnect, connected, lastPosition } = useMqttStore();
  
  // Auto-connect to MQTT broker on component mount
  useEffect(() => {
    if (!connected) {
      handleConnect();
    }
    
    return () => {
      console.log("MqttConfig component unmounting, cleaning up connection");
      disconnect();
    };
  }, []);
  
  // Display current connection status
  useEffect(() => {
    if (connected) {
      console.log("MQTT connected status:", connected);
      console.log("Current MQTT lastPosition:", lastPosition);
    }
  }, [connected, lastPosition]);
  
  const handleConnect = () => {
    if (!brokerUrl) {
      toast.error("Veuillez entrer l'URL du broker MQTT");
      return;
    }
    
    try {
      console.log("Attempting to connect to MQTT broker:", brokerUrl);
      
      // Disconnect any existing connection first
      disconnect();
      
      // Parse port number
      const portNumber = brokerPort ? parseInt(brokerPort, 10) : undefined;
      
      // Connect to the broker with the new URL
      connect(
        brokerUrl, 
        portNumber,
        useAuth ? username : undefined,
        useAuth ? password : undefined
      );
      
      if (topic) {
        console.log("Will subscribe to topic after connection:", topic);
        // Wait a moment before subscribing to ensure connection is established
        setTimeout(() => {
          if (useMqttStore.getState().connected) {
            subscribe(topic);
            console.log("Subscribed to topic:", topic);
            
            toast.success("Connecté au broker MQTT", {
              description: `Abonné au topic: ${topic}`,
            });
          } else {
            toast.error("Échec de connexion au broker MQTT", {
              description: "La connexion n'a pas pu être établie",
            });
          }
        }, 1500);
      }
    } catch (error) {
      console.error("MQTT connection error:", error);
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
            placeholder="localhost ou 192.168.1.X"
            className="bg-navy-light text-white border-accent"
          />
          <p className="text-xs text-white/60">
            Entrez l'adresse du broker (ex: localhost, 192.168.1.100, etc.)
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-white/80">Port</label>
          <Input 
            value={brokerPort}
            onChange={(e) => setBrokerPort(e.target.value)}
            placeholder="1883"
            className="bg-navy-light text-white border-accent"
          />
          <p className="text-xs text-white/60">
            Port du broker (par défaut: 1883 pour MQTT, 8883 pour MQTTS)
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-white/80">Topic</label>
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="esp32/gps"
            className="bg-navy-light text-white border-accent"
          />
          <p className="text-xs text-white/60">
            Format JSON attendu: {`{"latitude": 48.856614, "longitude": 2.3522219, "speed": 15, "device_id": "ESP32"}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="useAuth" 
            checked={useAuth} 
            onCheckedChange={(checked) => setUseAuth(checked === true)}
            className="bg-navy-light border-accent"
          />
          <label 
            htmlFor="useAuth" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Utiliser l'authentification
          </label>
        </div>
        
        {useAuth && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="space-y-2">
              <label className="text-sm text-white/80">Nom d'utilisateur</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                className="bg-navy-light text-white border-accent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/80">Mot de passe</label>
              <Input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Mot de passe"
                className="bg-navy-light text-white border-accent"
              />
            </div>
          </div>
        )}
        
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
            <span className="flex items-center">
              <ServerIcon className="mr-2 h-4 w-4" />
              Se connecter
            </span>
          )}
        </Button>
        
        {connected && (
          <div className="flex items-center justify-center p-2 bg-green-900/30 rounded border border-green-500/30">
            <SignalIcon className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-green-400 text-sm">Connecté au broker MQTT</span>
          </div>
        )}
        
        {connected && lastPosition && (
          <div className="p-3 bg-navy-light rounded">
            <p className="text-sm mb-1">Dernière position reçue:</p>
            <p className="text-xs text-green-400">
              Latitude: {lastPosition.lat.toFixed(6)}° N, Longitude: {lastPosition.long.toFixed(6)}° E
            </p>
            <p className="text-xs text-white/60 mt-2">
              Dernière mise à jour: {new Date().toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MqttConfig;
