
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DetectedShip, ShipClassification } from '../types';
import { playDetectionAlert } from '@/services/audioService';

// Helper function to ensure dates are proper Date objects
const ensureDates = (ship: any): DetectedShip => {
  return {
    ...ship,
    detectionTime: new Date(ship.detectionTime)
  };
};

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
        // Get ships and ensure dates are properly converted
        const ships = get().ships.map(ensureDates);
        
        // Sort by detection time (newest first)
        return ships.sort((a, b) => 
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
      name: 'ship-storage',
      // Configure storage serialization/deserialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              ships: Array.isArray(parsed.state.ships) ? parsed.state.ships.map(ensureDates) : [],
              currentShip: parsed.state.currentShip ? ensureDates(parsed.state.currentShip) : null
            }
          };
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);
