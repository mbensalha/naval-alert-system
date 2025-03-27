
import mqtt from 'mqtt';
import { create } from 'zustand';

interface MqttState {
  client: mqtt.MqttClient | null;
  connected: boolean;
  lastPosition: { lat: number; long: number } | null;
  connect: (brokerUrl: string) => void;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

export const useMqttStore = create<MqttState>((set, get) => ({
  client: null,
  connected: false,
  lastPosition: null,
  
  connect: (brokerUrl: string) => {
    const client = mqtt.connect(brokerUrl);
    
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      set({ client, connected: true });
    });
    
    client.on('message', (topic, message) => {
      console.log(`Received message on topic ${topic}: ${message.toString()}`);
      try {
        if (topic.includes('gps') || topic.includes('position')) {
          const data = JSON.parse(message.toString());
          if (data.lat !== undefined && data.long !== undefined) {
            set({ lastPosition: { lat: data.lat, long: data.long } });
          }
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });
    
    client.on('error', (err) => {
      console.error('MQTT connection error:', err);
    });
    
    client.on('close', () => {
      console.log('MQTT connection closed');
      set({ connected: false });
    });
  },
  
  disconnect: () => {
    const { client } = get();
    if (client) {
      client.end();
      set({ client: null, connected: false });
    }
  },
  
  subscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    }
  },
  
  unsubscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      client.unsubscribe(topic);
    }
  }
}));
