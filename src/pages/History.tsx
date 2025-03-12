
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import HistoryList from '@/components/HistoryList';
import { Clock } from 'lucide-react';

const History = () => {
  return (
    <div className="min-h-screen bg-naval-bg bg-cover bg-center flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-4 mb-8">
            <Clock className="h-10 w-10 text-white" />
            <h1 className="text-4xl font-bold text-white text-shadow">Historique des Détections</h1>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <HistoryList />
          </div>
        </main>
      </div>
    </div>
  );
};

export default History;
