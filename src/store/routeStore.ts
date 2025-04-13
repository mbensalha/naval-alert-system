import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RoutePoint {
  lat: number;
  long: number;
  timestamp: Date;
}

interface RouteTrack {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  points: RoutePoint[];
}

interface RouteState {
  activeTrackingId: string | null;
  tracks: RouteTrack[];
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  addTrackPoint: (point: Omit<RoutePoint, 'timestamp'>) => void;
  getTracks: () => RouteTrack[];
  getActiveTrack: () => RouteTrack | null;
  clearTracks: () => void;
}

// Helper function to ensure dates are proper Date objects
const ensureDates = (track: any): RouteTrack => {
  return {
    ...track,
    startTime: new Date(track.startTime),
    endTime: track.endTime ? new Date(track.endTime) : undefined,
    points: track.points.map((point: any) => ({
      ...point,
      timestamp: new Date(point.timestamp)
    }))
  };
};

// Create demo route track
const createDemoTrack = (): RouteTrack[] => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Base position
  const basePosition = {
    lat: 37.14,
    long: 10.57
  };

  // Generate 20 points along a simulated path
  const demoPoints: RoutePoint[] = Array.from({ length: 20 }).map((_, index) => {
    // Create a curved path
    const progress = index / 19; // 0 to 1
    
    // Add a small sine wave to create curves in the path
    const curveFactor = Math.sin(progress * Math.PI * 2) * 0.005;
    
    return {
      lat: basePosition.lat + (progress * 0.02) + curveFactor,
      long: basePosition.long + (progress * 0.015) - curveFactor,
      timestamp: new Date(yesterday.getTime() + (index * 10 * 60 * 1000))
    };
  });
  
  // Create demo track
  return [{
    id: "demo-track-1",
    name: `Route du ${yesterday.toLocaleDateString('fr-FR')}`,
    startTime: demoPoints[0].timestamp,
    endTime: demoPoints[demoPoints.length - 1].timestamp,
    points: demoPoints
  }];
};

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      activeTrackingId: null,
      tracks: createDemoTrack(),
      isTracking: false,
      
      startTracking: () => {
        const newTrackId = crypto.randomUUID();
        const newTrack: RouteTrack = {
          id: newTrackId,
          name: `Route ${new Date().toLocaleDateString()}`,
          startTime: new Date(),
          points: []
        };
        
        set({ 
          activeTrackingId: newTrackId,
          isTracking: true,
          tracks: [...get().tracks, newTrack]
        });
      },
      
      stopTracking: () => {
        const { tracks, activeTrackingId } = get();
        
        if (activeTrackingId) {
          const updatedTracks = tracks.map(track => 
            track.id === activeTrackingId
              ? { ...track, endTime: new Date() }
              : track
          );
          
          set({
            activeTrackingId: null,
            isTracking: false,
            tracks: updatedTracks
          });
        }
      },
      
      addTrackPoint: (point) => {
        const { tracks, activeTrackingId, isTracking } = get();
        
        if (isTracking && activeTrackingId) {
          const updatedTracks = tracks.map(track => 
            track.id === activeTrackingId
              ? { 
                  ...track, 
                  points: [
                    ...track.points, 
                    { ...point, timestamp: new Date() }
                  ]
                }
              : track
          );
          
          set({ tracks: updatedTracks });
        }
      },
      
      getTracks: () => {
        // Ensure dates are properly converted before sorting
        const tracks = get().tracks.map(ensureDates);
        
        return tracks.sort((a, b) => {
          const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
          const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
          return bTime - aTime;
        });
      },
      
      getActiveTrack: () => {
        const { tracks, activeTrackingId } = get();
        if (!activeTrackingId) return null;
        
        const track = tracks.find(track => track.id === activeTrackingId);
        return track ? ensureDates(track) : null;
      },
      
      clearTracks: () => {
        set({ 
          tracks: [],
          activeTrackingId: null,
          isTracking: false
        });
      }
    }),
    {
      name: 'route-storage',
      // Adding custom storage to handle Date objects
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              tracks: parsed.state.tracks.map(ensureDates)
            }
          };
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);
