
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MqttConfig from '@/components/MqttConfig';
import { Settings as SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const Settings = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    document.title = "Configuration - Système de Surveillance Navale";

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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
      
      <div className="bg-[#03224c] text-white py-2 px-6 flex justify-between items-center shadow-md">
        <span>Système de Surveillance Navale</span>
        <span>{formattedDate} - {formattedTime}</span>
      </div>
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-4 mb-8">
            <SettingsIcon className="h-10 w-10 text-white" />
            <h1 className="text-4xl font-bold text-white text-shadow">Configuration</h1>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 gap-6">
              <MqttConfig />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
