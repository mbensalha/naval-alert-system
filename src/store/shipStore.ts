
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DetectedShip, ShipClassification } from '../types';
import { playDetectionAlert } from '@/services/audioService';
import { useMqttStore } from '@/services/mqttService';

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
  lastImage: string | null;
  detectShip: () => void;
  classifyShip: (classification: ShipClassification) => void;
  dismissAlert: () => void;
  getHistory: () => DetectedShip[];
  takeScreenshot: (imageData: string) => void;
  setMqttImage: (imageData: string) => void;
  exportHistory: () => string;
  setAlertActive: (active: boolean) => void;
}

export const useShipStore = create<ShipState>()(
  persist(
    (set, get) => ({
      ships: [],
      alertActive: false,
      currentShip: null,
      lastImage: null,
      
      detectShip: () => {
        // Get the last position from MQTT store if available
        const mqttState = useMqttStore.getState();
        const position = mqttState.lastPosition || {
          lat: 36.5 + Math.random() * 3,
          long: -6.2 + Math.random() * 2
        };
        
        // Use last received image if available, otherwise leave empty
        const { lastImage } = get();
        
        // Generate a ship detection
        const newShip: DetectedShip = {
          id: crypto.randomUUID(),
          detectionTime: new Date(),
          position: position,
          classification: null,
          screenshot: lastImage || ""
        };
        
        // Play sound notification for detection
        playDetectionAlert();
        
        set({ 
          alertActive: true,
          currentShip: newShip,
          lastImage: null // Reset last image after using it
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
        
        // Save to local storage after classification
        localStorage.setItem(`ship_${updatedShip.id}`, JSON.stringify(updatedShip));
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
      },
      
      setMqttImage: (imageData) => {
        // Store the last received image from MQTT
        set({ lastImage: imageData });
      },
      
      exportHistory: () => {
        // Export all ship history as JSON
        const ships = get().getHistory();
        return JSON.stringify(ships, null, 2);
      },
      
      setAlertActive: (active) => {
        set({ alertActive: active });
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
              currentShip: parsed.state.currentShip ? ensureDates(parsed.state.currentShip) : null,
              lastImage: null // Don't persist this in storage
            }
          };
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);
