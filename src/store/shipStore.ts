
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DetectedShip, ShipClassification } from '../types';
import { playDetectionAlert } from '@/services/audioService';

interface ShipState {
  ships: DetectedShip[];
  alertActive: boolean;
  currentShip: DetectedShip | null;
  detectShip: () => void;
  classifyShip: (classification: ShipClassification) => void;
  dismissAlert: () => void;
  getHistory: () => DetectedShip[];
  takeScreenshot: (imageData: string) => void;
}

export const useShipStore = create<ShipState>()(
  persist(
    (set, get) => ({
      ships: [],
      alertActive: false,
      currentShip: null,
      
      detectShip: () => {
        // Generate a mock ship detection
        const newShip: DetectedShip = {
          id: crypto.randomUUID(),
          detectionTime: new Date(),
          position: {
            lat: 36.5 + Math.random() * 3,
            long: -6.2 + Math.random() * 2
          },
          classification: null,
          screenshot: ""
        };
        
        // Play sound notification for detection
        playDetectionAlert();
        
        set({ 
          alertActive: true,
          currentShip: newShip
        });
      },
      
      classifyShip: (classification) => {
        const { currentShip, ships } = get();
        
        if (!currentShip) return;
        
        const updatedShip = {
          ...currentShip,
          classification
        };
        
        set({
          ships: [...ships, updatedShip],
          currentShip: null,
          alertActive: false
        });
      },
      
      dismissAlert: () => {
        set({ alertActive: false, currentShip: null });
      },
      
      getHistory: () => {
        return get().ships.sort((a, b) => 
          b.detectionTime.getTime() - a.detectionTime.getTime()
        );
      },
      
      takeScreenshot: (imageData) => {
        const { currentShip } = get();
        if (currentShip) {
          set({
            currentShip: {
              ...currentShip,
              screenshot: imageData
            }
          });
        }
      }
    }),
    {
      name: 'ship-storage'
    }
  )
);
