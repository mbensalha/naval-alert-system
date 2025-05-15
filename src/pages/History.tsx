
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import HistoryList from '@/components/HistoryList';
import { Clock, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useShipStore } from '@/store/shipStore';
import { toast } from 'sonner';

const History = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const exportHistory = useShipStore(state => state.exportHistory);
  
  useEffect(() => {
    // Update page title
    document.title = "Historique des Détections | Système de Surveillance Navale";

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
  
  const handleExport = () => {
    try {
      const jsonStr = exportHistory();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
      
      // Create download link
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `historique_detections_navires_${formattedDate.replace(/\//g, '-')}.json`);
      
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast.success("Historique des détections exporté avec succès");
    } catch (error) {
      console.error("Error exporting history:", error);
      toast.error("Erreur lors de l'exportation de l'historique");
    }
  };
  
  return <div className="min-h-screen bg-naval-bg bg-cover bg-center flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-white" />
              <h1 className="text-4xl font-bold text-shadow text-slate-900">Historique des Détections</h1>
            </div>
            
            <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter tout l'historique
            </Button>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <HistoryList />
          </div>
        </main>
      </div>
    </div>;
};

export default History;
