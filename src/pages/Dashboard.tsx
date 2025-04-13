
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DetectionPanel from '@/components/DetectionPanel';
import CommandPanel from '@/components/CommandPanel';
import ShipAlert from '@/components/ShipAlert';
import { useMqttStore } from '@/services/mqttService';
import { useShipStore } from '@/store/shipStore';
import { useRouteStore } from '@/store/routeStore';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { connect, subscribe, setSimulatedPosition } = useMqttStore();
  const { detectShip } = useShipStore();
  const { startTracking, addTrackPoint } = useRouteStore();
  
  useEffect(() => {
    document.title = "Système de Surveillance Navale";

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Connect to MQTT broker automatically
    const brokerUrl = "mqtt://broker.emqx.io:1883"; // Updated broker URL
    connect(brokerUrl);
    
    // Subscribe to position topic after a short delay to ensure connection is established
    const subscriptionTimer = setTimeout(() => {
      // Subscribe to Node-RED topic (esp32/gps)
      subscribe("esp32/gps");
    }, 1500);

    // Set up simulated position for demonstration
    // Convert N37°08.557' E10°34.691' to decimal
    // 37°08.557' = 37 + (8.557/60) ≈ 37.14262°
    // 10°34.691' = 10 + (34.691/60) ≈ 10.57818°
    const simulatedPosition = {
      lat: 37.14262,
      long: 10.57818,
      speed: 10, // 10 knots
      speed_knots: 10
    };
    
    setSimulatedPosition(simulatedPosition);
    
    // Start tracking route for demonstration
    startTracking();
    
    // Add route points at different intervals
    const routeTimer = setInterval(() => {
      // Slightly adjust position to simulate movement
      simulatedPosition.lat += (Math.random() * 0.001) - 0.0005;
      simulatedPosition.long += (Math.random() * 0.001) - 0.0005;
      addTrackPoint({
        lat: simulatedPosition.lat, 
        long: simulatedPosition.long
      });
      setSimulatedPosition(simulatedPosition);
    }, 5000);
    
    // Simulate ship detection after 10 seconds
    const shipDetectionTimer = setTimeout(() => {
      detectShip();
    }, 10000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(subscriptionTimer);
      clearInterval(routeTimer);
      clearTimeout(shipDetectionTimer);
    };
  }, [connect, subscribe, setSimulatedPosition, startTracking, addTrackPoint, detectShip]);

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
  
  return (
    <div className="min-h-screen bg-naval-bg bg-cover bg-center flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <h1 className="text-4xl font-bold mb-8 text-shadow text-slate-900">HOME</h1>
          
          <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1">
            <DetectionPanel />
            <CommandPanel />
          </div>
        </main>
      </div>
      
      <ShipAlert />
    </div>
  );
};

export default Dashboard;
