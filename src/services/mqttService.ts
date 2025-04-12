import mqtt, { MqttProtocol } from 'mqtt';
import { create } from 'zustand';

interface MqttState {
  client: mqtt.MqttClient | null;
  connected: boolean;
  lastPosition: { lat: number; long: number } | null;
  speed: number | null;
  deviceId: string | null;
  connect: (brokerUrl: string) => void;
  disconnect: () => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

export const useMqttStore = create<MqttState>((set, get) => ({
  client: null,
  connected: false,
  lastPosition: null,
  speed: null,
  deviceId: null,
  
  connect: (brokerUrl: string) => {
    console.log("Connecting to MQTT broker:", brokerUrl);
    
    // Disconnect existing client if there is one
    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }
    
    try {
      // Parse broker URL to determine protocol
      let protocol: MqttProtocol = 'wss';
      let url = brokerUrl;
      
      // Handle different protocols properly
      if (brokerUrl.startsWith('mqtt://')) {
        protocol = 'mqtt';
        url = brokerUrl.replace('mqtt://', '');
      } else if (brokerUrl.startsWith('ws://')) {
        protocol = 'ws';
        url = brokerUrl.replace('ws://', '');
      } else if (brokerUrl.startsWith('wss://')) {
        protocol = 'wss';
        url = brokerUrl.replace('wss://', '');
      } else if (brokerUrl.startsWith('mqtts://')) {
        protocol = 'mqtts';
        url = brokerUrl.replace('mqtts://', '');
      } else {
        // If no protocol is specified, default to wss for browser security
        protocol = 'wss';
        // Keep the URL as is if no protocol prefix
        if (!brokerUrl.includes('://')) {
          url = brokerUrl;
        }
      }
      
      // Extract hostname and port
      let hostname = url;
      let port = protocol === 'mqtt' ? 1883 : 
                 protocol === 'mqtts' ? 8883 : 
                 protocol === 'ws' ? 8083 : 
                 protocol === 'wss' ? 8084 : 8084;
                 
      // Handle port in the URL
      if (url.includes(':')) {
        const parts = url.split(':');
        hostname = parts[0];
        port = parseInt(parts[1], 10);
      }
      
      console.log(`Parsed MQTT connection: protocol=${protocol}, hostname=${hostname}, port=${port}`);
      
      // Set MQTT connection options
      const options: mqtt.IClientOptions = {
        protocol,
        hostname,
        port,
        keepalive: 60,
        connectTimeout: 10 * 1000, // 10 seconds
        reconnectPeriod: 5000, // 5 seconds
        // For WebSockets security
        rejectUnauthorized: false,
      };
      
      console.log("Creating MQTT client with options:", options);
      
      // Connect to broker
      const client = mqtt.connect(options);
      
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
          if (topic.includes('gps')) {
            const data = JSON.parse(messageStr);
            
            if (data.lat !== undefined && data.lng !== undefined) {
              set({
                lastPosition: { lat: data.lat, long: data.lng },
                speed: data.speed_knots !== undefined ? data.speed_knots : get().speed,
                deviceId: data.device_id || get().deviceId
              });
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
