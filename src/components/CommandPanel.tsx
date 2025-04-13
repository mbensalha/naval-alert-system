
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import GpsPosition from "./GpsPosition";
import { useMqttStore } from "@/services/mqttService";
import { kmhToMph } from "@/utils/formatUtils";

const CommandPanel = () => {
  const { speed } = useMqttStore();
  
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <h2 className="text-xl font-medium mb-1">General commands</h2>
      
      <GpsPosition />
      
      <Card className="bg-navy text-white border-none shadow-lg">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-base flex items-center">
            <Gauge className="mr-2 h-4 w-4 text-accent" />
            Vitesse :
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="bg-navy-light rounded p-4 flex items-center justify-center">
            {speed !== null ? (
              <span className="text-white/80">{kmhToMph(speed).toFixed(1)} mph</span>
            ) : (
              <span className="text-white/50">En attente de données...</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommandPanel;
