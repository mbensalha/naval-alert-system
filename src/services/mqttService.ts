
import mqtt from 'mqtt';
import { create } from 'zustand';

type MqttProtocol = 'mqtt' | 'mqtts' | 'ws' | 'wss';

interface MqttState {
  client: mqtt.MqttClient | null;
  connected: boolean;
  lastPosition: { lat: number; long: number } | null;
  speed: number | null;
  deviceId: string | null;
  connect: (brokerUrl: string, port?: number, username?: string, password?: string) => void;
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
  
  connect: (brokerUrl: string, port?: number, username?: string, password?: string) => {
    console.log("Connecting to MQTT broker:", brokerUrl, "port:", port || "default");
    
    // Disconnect existing client if there is one
    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }
    
    try {
      // Parse broker URL to determine protocol
      let protocol: MqttProtocol = 'mqtt';
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
        // If no protocol is specified, default to mqtt
        protocol = 'mqtt';
        // Keep the URL as is if no protocol prefix
        if (!brokerUrl.includes('://')) {
          url = brokerUrl;
        }
      }
      
      // Extract hostname and port from URL if provided
      let hostname = url;
      let mqttPort = port || 
                  (protocol === 'mqtt' ? 1883 : 
                   protocol === 'mqtts' ? 8883 : 
                   protocol === 'ws' ? 8083 : 
                   protocol === 'wss' ? 8084 : 1883);
                 
      // Handle port in the URL
      if (url.includes(':')) {
        const parts = url.split(':');
        hostname = parts[0];
        if (!port) { // Only use port from URL if not explicitly provided
          mqttPort = parseInt(parts[1], 10);
        }
      }
      
      console.log(`MQTT connection details: protocol=${protocol}, hostname=${hostname}, port=${mqttPort}`);
      
      // Set MQTT connection options
      const options: mqtt.IClientOptions = {
        protocol,
        hostname,
        port: mqttPort,
        keepalive: 60,
        connectTimeout: 10 * 1000, // 10 seconds
        reconnectPeriod: 5000, // 5 seconds
        // For WebSockets security
        rejectUnauthorized: false,
      };
      
      // Add authentication if provided
      if (username || password) {
        options.username = username;
        options.password = password;
        console.log("Using authentication for MQTT connection");
      }
      
      console.log("Creating MQTT client with options:", options);
      
      // Connect to broker
      const client = mqtt.connect(options);
      
      client.on('connect', () => {
        console.log('Successfully connected to MQTT broker:', hostname);
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
            console.log("Processing position data from topic:", topic);
            const data = JSON.parse(messageStr);
            console.log("Parsed MQTT position data:", data);
            
            // Format adapté au flux Node-RED fourni
            if (data.latitude !== undefined && data.longitude !== undefined) {
              console.log("Setting new position from Node-RED format:", { lat: data.latitude, long: data.longitude });
              set({
                lastPosition: { lat: data.latitude, long: data.longitude },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.device_id || get().deviceId
              });
            }
            // Gérer aussi le format alternatif au cas où
            else if (data.lat !== undefined && (data.long !== undefined || data.lon !== undefined)) {
              const longitude = data.long !== undefined ? data.long : data.lon;
              console.log("Setting new position from alternative format:", { lat: data.lat, long: longitude });
              set({
                lastPosition: { lat: data.lat, long: longitude },
                speed: data.speed !== undefined ? data.speed : get().speed
              });
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
