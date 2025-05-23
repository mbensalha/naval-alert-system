
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useMqttStore } from "@/services/mqttService";
import { toast } from "sonner";
import { WifiIcon, SignalIcon, ServerIcon, InfoIcon, RefreshCw, ShieldIcon, MapPinIcon, ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const MqttConfig = () => {
  const [brokerUrl, setBrokerUrl] = useState("192.168.8.105");
  const [brokerPort, setBrokerPort] = useState("1883"); // Default MQTT port
  const [gpsTopic, setGpsTopic] = useState("esp32/navire/gps");
  const [imageTopic, setImageTopic] = useState("station/navire/image");
  const [useAuth, setUseAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [protocol, setProtocol] = useState("mqtt"); // Default to MQTT
  
  const { connect, subscribe, disconnect, connected, lastPosition, lastUpdate } = useMqttStore();
  
  // Nettoyer la connexion lors du démontage du composant
  useEffect(() => {
    return () => {
      console.log("MqttConfig component unmounting, cleaning up connection");
      disconnect();
    };
  }, []);
  
  // Afficher l'état de la connexion actuelle
  useEffect(() => {
    if (connected) {
      console.log("MQTT connected status:", connected);
      console.log("Current MQTT lastPosition:", lastPosition);
      console.log("Current MQTT lastUpdate:", lastUpdate);
    }
  }, [connected, lastPosition, lastUpdate]);

  // Ajuster le port en fonction du protocole sélectionné
  useEffect(() => {
    if (protocol === "mqtt") {
      setBrokerPort("1883");
    } else if (protocol === "mqtts") {
      setBrokerPort("8883");
    } else if (protocol === "ws") {
      setBrokerPort("8083");
    } else if (protocol === "wss") {
      setBrokerPort("8084");
    }
  }, [protocol]);
  
  const handleConnect = () => {
    if (!brokerUrl) {
      toast.error("Veuillez entrer l'URL du broker MQTT");
      return;
    }
    
    try {
      console.log("Attempting to connect to MQTT broker:", brokerUrl, "using protocol:", protocol);
      setIsConnecting(true);
      
      // Déconnecter toute connexion existante d'abord
      disconnect();
      
      // Parser le numéro de port
      const portNumber = brokerPort ? parseInt(brokerPort, 10) : undefined;
      
      // Construire les options de connexion
      const options: {
        port?: number;
        username?: string;
        password?: string;
        protocol?: 'mqtt' | 'mqtts' | 'ws' | 'wss';
      } = {
        port: portNumber,
        protocol: protocol as 'mqtt' | 'mqtts' | 'ws' | 'wss'
      };
      
      if (useAuth) {
        options.username = username;
        options.password = password;
      }
      
      // Se connecter au broker avec la nouvelle URL
      connect(brokerUrl, options);
      
      setTimeout(() => {
        setIsConnecting(false);
        if (useMqttStore.getState().connected) {
          // S'abonner aux topics GPS et Image
          subscribe(gpsTopic);
          subscribe(imageTopic);
          console.log("Subscribed to topics:", gpsTopic, imageTopic);
          
          toast.success("Connecté au broker MQTT", {
            description: `Abonné aux topics: ${gpsTopic}, ${imageTopic}`,
          });
          
          // Vérifier la connexion après un moment
          setTimeout(() => {
            const state = useMqttStore.getState();
            console.log("Follow-up connection check:", {
              connected: state.connected,
              lastPosition: state.lastPosition,
              lastUpdate: state.lastUpdate
            });
            
            if (!state.lastPosition && state.connected) {
              toast.info("Connecté mais aucune donnée reçue", {
                description: "Vérifiez que des données sont publiées sur les topics configurés"
              });
            }
          }, 5000);
          
        } else {
          toast.error("Échec de connexion au broker MQTT", {
            description: "La connexion n'a pas pu être établie",
          });
        }
      }, 1500);
    } catch (error) {
      setIsConnecting(false);
      console.error("MQTT connection error:", error);
      toast.error("Erreur de connexion au broker MQTT", {
        description: String(error),
      });
    }
  };
  
  const formattedLastUpdate = lastUpdate 
    ? lastUpdate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    : null;
  
  return (
    <Card className="bg-navy text-white border-none shadow-lg">
      <CardHeader className="pb-2 border-b border-white/10">
        <CardTitle className="text-base flex items-center">
          <WifiIcon className="mr-2 h-4 w-4 text-accent" />
          Configuration MQTT (Broker)
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/80">Protocole</label>
          <Select 
            value={protocol} 
            onValueChange={setProtocol}
          >
            <SelectTrigger className="bg-navy-light text-white border-accent">
              <SelectValue placeholder="Sélectionnez un protocole" />
            </SelectTrigger>
            <SelectContent className="bg-navy-light text-white border-accent">
              <SelectItem value="wss">
                <div className="flex items-center">
                  <ShieldIcon className="w-4 h-4 mr-2" />
                  <span>WebSocket Sécurisé (wss://)</span>
                </div>
              </SelectItem>
              <SelectItem value="ws">WebSocket (ws://)</SelectItem>
              <SelectItem value="mqtt">MQTT (mqtt://)</SelectItem>
              <SelectItem value="mqtts">MQTT Sécurisé (mqtts://)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-white/60">
            Pour les pages HTTPS, utilisez WebSocket Sécurisé (wss://)
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-white/80">Broker URL</label>
          <Input 
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            placeholder="ex: 192.168.8.105"
            className="bg-navy-light text-white border-accent"
          />
          <p className="text-xs text-white/60">
            Entrez l'adresse du broker sans le protocole (ex: 192.168.8.105)
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
            Port du broker (1883 pour MQTT, 8883 pour MQTTS, 8083 pour WS, 8084 pour WSS)
          </p>
        </div>
        
        <Separator className="bg-white/10 my-2" />
        
        <div className="space-y-4">
          <h3 className="font-medium">Configuration des Topics</h3>
          
          <div className="space-y-2">
            <label className="text-sm text-white/80 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" /> Topic GPS (ESP32)
            </label>
            <Input 
              value={gpsTopic}
              onChange={(e) => setGpsTopic(e.target.value)}
              placeholder="esp32/navire/gps"
              className="bg-navy-light text-white border-accent"
            />
            <p className="text-xs text-white/60">
              Format JSON attendu: {`{"lat": 48.856614, "lng": 2.3522219, "speed": 15, "device_id": "ESP32"}`}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-white/80 flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" /> Topic Image (Jetson)
            </label>
            <Input 
              value={imageTopic}
              onChange={(e) => setImageTopic(e.target.value)}
              placeholder="station/navire/image"
              className="bg-navy-light text-white border-accent"
            />
            <p className="text-xs text-white/60">
              Format attendu: Image binaire PNG/JPG
            </p>
          </div>
        </div>
        
        <Separator className="bg-white/10 my-2" />
        
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
          disabled={isConnecting}
        >
          {isConnecting ? (
            <span className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </span>
          ) : connected ? (
            <span className="flex items-center">
              <SignalIcon className="mr-2 h-4 w-4" />
              Reconnecter
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
            <span className="text-green-400 text-sm">Connecté au broker MQTT ({protocol}://)</span>
          </div>
        )}
        
        {connected && !lastPosition && (
          <div className="p-2 bg-amber-900/30 rounded border border-amber-500/30 flex items-center">
            <InfoIcon className="h-4 w-4 text-amber-400 mr-2" />
            <span className="text-amber-400 text-sm">Connecté mais aucune donnée GPS reçue</span>
          </div>
        )}
        
        {connected && lastPosition && (
          <div className="p-3 bg-navy-light rounded">
            <p className="text-sm mb-1">Dernière position reçue:</p>
            <p className="text-xs text-green-400">
              Latitude: {lastPosition.lat.toFixed(6)}° N, Longitude: {lastPosition.long.toFixed(6)}° E
            </p>
            <p className="text-xs text-white/60 mt-2">
              Dernière mise à jour: {formattedLastUpdate || new Date().toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MqttConfig;
