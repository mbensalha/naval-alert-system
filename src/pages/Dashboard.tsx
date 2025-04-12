
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DetectionPanel from '@/components/DetectionPanel';
import CommandPanel from '@/components/CommandPanel';
import ShipAlert from '@/components/ShipAlert';
import { useMqttStore } from '@/services/mqttService';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { connect, subscribe } = useMqttStore();
  
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
    
    return () => {
      clearInterval(timer);
      clearTimeout(subscriptionTimer);
    };
  }, [connect, subscribe]);

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
          <h1 className="text-4xl font-bold mb-8 text-shadow text-slate-900">HOME</h1>
          
          <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1">
            <DetectionPanel />
            <CommandPanel />
          </div>
        </main>
      </div>
      
      <ShipAlert />
    </div>;
};

export default Dashboard;
