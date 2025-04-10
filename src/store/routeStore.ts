
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

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      activeTrackingId: null,
      tracks: [],
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
        return get().tracks.sort((a, b) => 
          b.startTime.getTime() - a.startTime.getTime()
        );
      },
      
      getActiveTrack: () => {
        const { tracks, activeTrackingId } = get();
        if (!activeTrackingId) return null;
        
        return tracks.find(track => track.id === activeTrackingId) || null;
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
      name: 'route-storage'
    }
  )
);
