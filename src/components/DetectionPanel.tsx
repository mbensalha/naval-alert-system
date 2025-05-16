
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useShipStore } from '@/store/shipStore';
import { AlertTriangle, Camera, Eye, EyeOff, Video } from 'lucide-react';

interface DetectionPanelProps {
  onShipDetect?: () => void;
}

const DetectionPanel = ({ onShipDetect }: DetectionPanelProps) => {
  const [streamActive, setStreamActive] = useState(false);
  const [shipDetectionActive, setShipDetectionActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectTimer = useRef<NodeJS.Timeout | null>(null);
  
  // When ship detection is activated, set a timer to simulate detection after 5 seconds
  useEffect(() => {
    if (shipDetectionActive && streamActive) {
      // Clear any existing timer
      if (detectTimer.current) {
        clearTimeout(detectTimer.current);
      }
      
      // Start detection process (simulate detection after 5 seconds)
      toast.info("Détection de navire activée", {
        description: "Le système analyse en temps réel le flux vidéo"
      });
      
      // For demo: Set a timer to simulate a ship detection after 5 seconds
      detectTimer.current = setTimeout(() => {
        console.log("Ship detected in video stream!");
        if (onShipDetect) {
          onShipDetect();
        }
      }, 5000);
    } else if (!shipDetectionActive && detectTimer.current) {
      // If detection is turned off, clear the timer
      clearTimeout(detectTimer.current);
      detectTimer.current = null;
    }
    
    return () => {
      if (detectTimer.current) {
        clearTimeout(detectTimer.current);
      }
    };
  }, [shipDetectionActive, streamActive, onShipDetect]);
  
  const startStream = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // UDP stream configuration from Jetson
    const streamUrl = "udp://localhost:5000";
    
    try {
      if ('srcObject' in video) {
        // Access the UDP stream directly using appropriate browser APIs
        // For demo/placeholder, we'll just show a success message
        setStreamActive(true);
        toast.success("Flux vidéo démarré", {
          description: "Connexion établie avec le Jetson Nano"
        });
      }
    } catch (error) {
      console.error("Error accessing stream:", error);
      toast.error("Erreur d'accès au flux vidéo", {
        description: "Vérifiez la connexion avec le Jetson Nano"
      });
    }
  };
  
  const stopStream = () => {
    setStreamActive(false);
    setShipDetectionActive(false);
    
    toast.info("Flux vidéo arrêté");
  };
  
  const toggleDetection = () => {
    setShipDetectionActive(!shipDetectionActive);
    
    if (!shipDetectionActive) {
      if (!streamActive) {
        // Auto-start stream if not active
        startStream();
      }
    } else {
      toast.info("Détection de navire désactivée");
    }
  };
  
  // For demonstration purposes
  const simulateDetection = () => {
    if (onShipDetect) {
      onShipDetect();
    }
  };
  
  return (
    <Card className="bg-white/90 backdrop-blur shadow-lg h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Flux Vidéo</CardTitle>
          <div className="flex items-center space-x-2">
            {streamActive ? (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1"></div>
                <span className="text-xs text-green-700">En direct</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-gray-400 mr-1"></div>
                <span className="text-xs text-gray-500">Hors ligne</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-2">
        <div className="relative h-full flex-1 bg-gray-900 rounded-md overflow-hidden flex flex-col justify-center items-center">
          {/* Placeholder for the UDP video stream */}
          <video 
            ref={videoRef}
            className="w-full h-full object-cover" 
            autoPlay
            playsInline
            muted
          />
          
          {!streamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-800">
              <Video className="h-16 w-16 mb-2 opacity-30" />
              <p className="text-sm opacity-75">Flux vidéo inactif</p>
              <p className="text-xs opacity-50 mt-1">Cliquez sur "Démarrer" pour activer</p>
            </div>
          )}
          
          {/* Detection indicator overlay */}
          {shipDetectionActive && streamActive && (
            <div className="absolute top-2 right-2 bg-red-600/80 text-white px-2 py-1 rounded-md text-xs flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 animate-pulse" />
              Détection active
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={streamActive ? "destructive" : "default"}
            size="sm"
            onClick={streamActive ? stopStream : startStream}
          >
            {streamActive ? "Arrêter" : "Démarrer"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className={shipDetectionActive ? "bg-amber-100 border-amber-300" : ""}
            onClick={toggleDetection}
            disabled={!streamActive}
          >
            {shipDetectionActive ? <EyeOff className="h-4 w-4 mr-1 text-amber-600" /> : <Eye className="h-4 w-4 mr-1" />}
            {shipDetectionActive ? "Désactiver détection" : "Activer détection"}
          </Button>
        </div>
        
        {/* For testing only - will be removed in production */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={simulateDetection} 
          className="text-xs opacity-50 hover:opacity-100"
        >
          <Camera className="h-3 w-3 mr-1" />
          Test Détection
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DetectionPanel;
