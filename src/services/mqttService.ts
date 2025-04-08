
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
    console.log("Connecting to MQTT broker:", brokerUrl);
    
    // Disconnect existing client if there is one
    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }
    
    // Connect to broker
    const client = mqtt.connect(brokerUrl);
    
    client.on('connect', () => {
      console.log('Successfully connected to MQTT broker');
      set({ client, connected: true });
    });
    
    client.on('message', (topic, message) => {
      const messageStr = message.toString();
      console.log(`Received MQTT message on topic ${topic}:`, messageStr);
      
      try {
        if (topic.includes('gps') || topic.includes('position')) {
          const data = JSON.parse(messageStr);
          console.log("Parsed MQTT position data:", data);
          
          if (data.lat !== undefined && data.long !== undefined) {
            console.log("Setting new position:", { lat: data.lat, long: data.long });
            set({ lastPosition: { lat: data.lat, long: data.long } });
          } else {
            console.warn("MQTT message missing lat/long properties:", data);
          }
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error, 'Raw message:', messageStr);
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
      console.log('Manually disconnecting MQTT client');
      client.end();
      set({ client: null, connected: false });
    }
  },
  
  subscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      console.log(`Subscribing to MQTT topic: ${topic}`);
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`Successfully subscribed to ${topic}`);
        }
      });
    } else {
      console.warn("Cannot subscribe: MQTT client not connected");
    }
  },
  
  unsubscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      console.log(`Unsubscribing from MQTT topic: ${topic}`);
      client.unsubscribe(topic);
    }
  }
}));
