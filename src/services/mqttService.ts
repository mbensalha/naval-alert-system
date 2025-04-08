
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
    
    // Set MQTT connection options
    const options: mqtt.IClientOptions = {
      keepalive: 30,
      connectTimeout: 10 * 1000, // 10 seconds
      reconnectPeriod: 5000, // 5 seconds
      // For WebSockets security
      rejectUnauthorized: false,
      protocol: brokerUrl.startsWith('wss://') ? 'wss' : 
                brokerUrl.startsWith('ws://') ? 'ws' : undefined,
    };
    
    console.log("Creating MQTT client with options:", options);
    
    try {
      // Connect to broker
      const client = mqtt.connect(brokerUrl, options);
      
      client.on('connect', () => {
        console.log('Successfully connected to MQTT broker:', brokerUrl);
        set({ client, connected: true });
      });
      
      client.on('reconnect', () => {
        console.log('Attempting to reconnect to MQTT broker...');
      });
      
      client.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`Received MQTT message on topic ${topic}:`, messageStr);
        
        try {
          if (topic.includes('gps') || topic.includes('position')) {
            console.log("Processing position data from topic:", topic);
            const data = JSON.parse(messageStr);
            console.log("Parsed MQTT position data:", data);
            
            if (data.lat !== undefined && data.long !== undefined) {
              console.log("Setting new position:", { lat: data.lat, long: data.long });
              set({ lastPosition: { lat: data.lat, long: data.long } });
            } else if (data.latitude !== undefined && data.longitude !== undefined) {
              // Try alternative property names
              console.log("Setting new position from alternate properties:", { lat: data.latitude, long: data.longitude });
              set({ lastPosition: { lat: data.latitude, long: data.longitude } });
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
      
      client.on('offline', () => {
        console.log('MQTT client went offline');
        set({ connected: false });
      });
    } catch (error) {
      console.error('Error creating MQTT client:', error);
      set({ client: null, connected: false });
    }
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
