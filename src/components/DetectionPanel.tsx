
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useShipStore } from "@/store/shipStore";
import { Camera, Video } from "lucide-react";
import OpenSeaMap from "./OpenSeaMap";
import { toast } from "sonner";

const DetectionPanel = () => {
  const detectShip = useShipStore((state) => state.detectShip);
  const takeScreenshot = useShipStore((state) => state.takeScreenshot);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamSource, setStreamSource] = useState<'webcam' | 'udp'>('webcam');

  // Function to start the webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setStreamSource('webcam');
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraActive(false);
      setErrorMessage("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  // Function to start the UDP stream from Jetson
  const startUDPStream = () => {
    try {
      if (videoRef.current) {
        // Create a video URL that points to the GStreamer UDP stream
        // Note: This requires a browser that can handle the UDP stream or a proxy
        const udpStreamUrl = `http://192.168.8.102:8080/stream`;
        
        videoRef.current.src = udpStreamUrl;
        videoRef.current.onerror = () => {
          setErrorMessage("Erreur de chargement du flux UDP. Vérifiez que le flux est actif.");
          setCameraActive(false);
        };
        
        videoRef.current.onloadeddata = () => {
          setCameraActive(true);
          setStreamSource('udp');
          setErrorMessage(null);
          toast.success("Flux vidéo Jetson connecté");
        };
        
        videoRef.current.load();
        videoRef.current.play().catch(err => {
          console.error("Error playing UDP stream:", err);
          setErrorMessage("Erreur de lecture du flux UDP.");
          setCameraActive(false);
        });
      }
    } catch (err) {
      console.error("Error setting up UDP stream:", err);
      setCameraActive(false);
      setErrorMessage("Erreur de configuration du flux UDP.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      if (streamSource === 'webcam' && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        
        tracks.forEach(track => {
          track.stop();
        });
        
        videoRef.current.srcObject = null;
      } else if (streamSource === 'udp') {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      
      setCameraActive(false);
    }
  };

  const handleDetectShip = () => {
    // Take a screenshot if camera is active
    if (cameraActive && videoRef.current) {
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
  };

  // Start camera automatically when component mounts
  useEffect(() => {
    // Try to start the UDP stream first, as it's likely the primary source
    startUDPStream();
    
    // Clean up when component unmounts
    return () => {
      stopCamera();
    };
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-6 h-full animate-fade-in">
      <OpenSeaMap />
      
      <Card className="bg-navy text-white border-none shadow-lg overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b border-white/10">
          <CardTitle className="text-lg flex items-center">
            <Video className="mr-2 h-5 w-5 text-accent" />
            FLUX VIDEO
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 relative">
          <div className="w-full h-full min-h-[340px] bg-navy-light flex flex-col items-center justify-center gap-4">
            {cameraActive ? (
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
                  <Video className="h-8 w-8 text-accent" />
                </div>
                <p className="text-accent">Flux vidéo</p>
                {errorMessage ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400">{errorMessage}</span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent">
                    {cameraActive ? "Active" : "Inactive"}
                  </span>
                )}
                <div className="flex gap-2">
                  <Button
                    className="mt-2 bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
                    onClick={startUDPStream}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Flux Jetson
                  </Button>
                  <Button
                    className="mt-2 bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors"
                    onClick={startWebcam}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Webcam locale
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {cameraActive && (
            <div className="absolute bottom-2 left-2 bg-green-500 px-2 py-1 rounded-full text-xs font-semibold animate-pulse">
              {streamSource === 'udp' ? 'Flux Jetson actif' : 'Webcam active'}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4">
          <Button 
            className="w-full bg-navy-light border border-accent text-accent hover:bg-accent hover:text-white transition-colors" 
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
