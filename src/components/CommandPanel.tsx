
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import MqttConfig from "./MqttConfig";
import GpsPosition from "./GpsPosition";

const CommandPanel = () => {
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
          <div className="h-20 bg-navy-light rounded flex items-center justify-center">
            <span className="text-white/50">12.5 nœuds</span>
          </div>
        </CardContent>
      </Card>
      
      <MqttConfig />
    </div>
  );
};

export default CommandPanel;
