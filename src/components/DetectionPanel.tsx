
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { Video, VideoOff, AlertTriangle } from "lucide-react";
import OpenSeaMap from "./OpenSeaMap";
import { toast } from "sonner";

const DetectionPanel = () => {
  const detectShip = useShipStore((state) => state.detectShip);
  const takeScreenshot = useShipStore((state) => state.takeScreenshot);
  const setAlertActive = useShipStore((state) => state.setAlertActive);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlertBlinking, setIsAlertBlinking] = useState(false);

  // Function to start the UDP stream from Jetson
  const startUDPStream = () => {
    try {
      if (videoRef.current) {
        // Create a video URL that points to the GStreamer UDP stream on port 5000
        const udpStreamUrl = `http://192.168.8.105:8080/stream?port=5000`;
        
        videoRef.current.src = udpStreamUrl;
        videoRef.current.onerror = () => {
          setErrorMessage("Erreur de chargement du flux UDP. Vérifiez que le flux est actif.");
          setStreamActive(false);
          toast.error("Impossible de se connecter au flux vidéo");
        };
        
        videoRef.current.onloadeddata = () => {
          setStreamActive(true);
          setErrorMessage(null);
          toast.success("Flux vidéo Jetson connecté");
          
          // Start blinking alert icon when video stream starts
          setIsAlertBlinking(true);
          
          // Show classification panel after stream starts
          setAlertActive(true);
        };
        
        videoRef.current.load();
        videoRef.current.play().catch(err => {
          console.error("Error playing UDP stream:", err);
          setErrorMessage("Erreur de lecture du flux UDP.");
          setStreamActive(false);
        });
      }
    } catch (err) {
      console.error("Error setting up UDP stream:", err);
      setStreamActive(false);
      setErrorMessage("Erreur de configuration du flux UDP.");
    }
  };

  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      setStreamActive(false);
      setIsAlertBlinking(false);
      setAlertActive(false);  // Reset alert when stream stops
    }
  };

  const handleDetectShip = () => {
    // Take a screenshot if stream is active
    if (streamActive && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        takeScreenshot(imageData);
      }
    }
    
    // Call the detect ship function
    detectShip();
    
    // Start blinking alert
    setIsAlertBlinking(true);
  };

  // Start stream automatically when component mounts
  useEffect(() => {
    // Try to start the UDP stream
    startUDPStream();
    
    // Clean up when component unmounts
    return () => {
      stopStream();
    };
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-6 h-full animate-fade-in">
      <OpenSeaMap />
      
      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-lg flex items-center">
            <Video className="mr-2 h-5 w-5 text-accent" />
            FLUX VIDEO JETSON
            {isAlertBlinking && streamActive && (
              <AlertTriangle className="ml-2 h-5 w-5 text-red-500 animate-pulse-red" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div className="w-full h-full min-h-[340px] bg-navy-light flex flex-col items-center justify-center gap-4">
            {streamActive ? (
              <video 
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-contain"
                style={{ minHeight: "100%", maxHeight: "100%" }}
              />
            ) : (
              <>
                <div className="h-12 w-16 flex items-center justify-center border border-accent/50 rounded bg-navy-dark">
                  <VideoOff className="h-8 w-8 text-accent" />
                </div>
                <p className="text-accent">Flux vidéo inactif</p>
                {errorMessage ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400">{errorMessage}</span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent">
                    {streamActive ? "Actif" : "Inactif"}
                  </span>
                )}
                <div className="flex gap-2">
                  <Button
                    className="mt-2 bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
                    onClick={startUDPStream}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Démarrer flux Jetson (UDP 5000)
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {streamActive && (
            <div className="absolute bottom-2 left-2 bg-green-500 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
              Flux Jetson actif (UDP 5000)
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 flex gap-2">
          {streamActive && (
            <Button 
              className="flex-1 bg-navy-light border border-red-500 text-red-400 hover:bg-red-900/20 transition-colors" 
              size="lg"
              onClick={stopStream}
            >
              <VideoOff className="mr-2 h-4 w-4" />
              Arrêter
            </Button>
          )}
          <Button 
            className="flex-1 bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors" 
            size="lg"
            onClick={handleDetectShip}
          >
            <span className="text-xl">ALERTE</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DetectionPanel;
