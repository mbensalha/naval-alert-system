
import mqtt from 'mqtt';
import { create } from 'zustand';

// Define a string literal type for protocol values
type MqttProtocol = 'mqtt' | 'mqtts' | 'ws' | 'wss';

interface MqttState {
  client: mqtt.MqttClient | null;
  connected: boolean;
  lastPosition: { lat: number; long: number } | null;
  speed: number | null;
  deviceId: string | null;
  lastUpdate: Date | null;
  dateTime: { date: string; time: string } | null;
  connectionError: string | null;
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
  lastUpdate: null,
  dateTime: null,
  connectionError: null,
  
  connect: (brokerUrl: string, port?: number, username?: string, password?: string) => {
    console.log("Connecting to MQTT broker:", brokerUrl, "port:", port || "default");
    
    // Disconnect existing client if there is one
    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }
    
    try {
      // For Raspberry Pi local setup, use MQTT directly (not WebSockets)
      // Default to mqtt:// for local connections
      const protocol: MqttProtocol = 'mqtt';
      let hostname = brokerUrl;
      
      // Extract hostname if protocol is included
      if (brokerUrl.includes('://')) {
        hostname = brokerUrl.split('://')[1];
      }
      
      // Remove trailing slash from hostname if present
      hostname = hostname.replace(/\/$/, '');
      
      // Use the specified port or default to 1883 for MQTT
      const mqttPort = port || 1883;
      
      console.log(`MQTT connection details: protocol=${protocol}, hostname=${hostname}, port=${mqttPort}`);
      
      // Set MQTT connection options for Raspberry Pi local broker
      const options: mqtt.IClientOptions = {
        protocol,
        hostname,
        port: mqttPort,
        keepalive: 60,
        connectTimeout: 5000, // 5 seconds
        reconnectPeriod: 3000, // 3 seconds - reduced for faster reconnect attempts
        clean: true, // Clean session
      };
      
      // Add authentication if provided
      if (username || password) {
        options.username = username;
        options.password = password;
      }
      
      console.log("Creating MQTT client with options:", options);
      
      // Construct the connection URL for local MQTT
      const connectionUrl = `${protocol}://${hostname}:${mqttPort}`;
      console.log("Connection URL:", connectionUrl);
      
      // Connect to broker
      const client = mqtt.connect(connectionUrl, options);
      set({ client, connectionError: null });
      
      client.on('connect', () => {
        console.log('Successfully connected to MQTT broker:', hostname);
        set({ client, connected: true, connectionError: null });
      });
      
      client.on('reconnect', () => {
        console.log('Attempting to reconnect to MQTT broker...');
      });
      
      client.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`Received MQTT message on topic ${topic}:`, messageStr);
        
        try {
          if (topic.includes('gps')) {
            console.log("Processing GPS data from topic:", topic);
            const data = JSON.parse(messageStr);
            console.log("Parsed MQTT GPS data:", data);
            
            // Format pour ESP32 avec TinyGPS
            // {"lat":43.296501,"lng":5.369789,"speed":0.00}
            if (data.lat !== undefined && data.lng !== undefined) {
              console.log("Setting new position from ESP32 data format:", { lat: data.lat, long: data.lng });
              
              set({
                lastPosition: { lat: data.lat, long: data.lng },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.device_id || get().deviceId || "ESP32-NetBox",
                lastUpdate: new Date()
              });
            }
            // Format alternatif (si nécessaire)
            else if (data.lat !== undefined && (data.long !== undefined || data.lon !== undefined)) {
              const longitude = data.long !== undefined ? data.long : data.lon;
              console.log("Setting new position from alternative format:", { lat: data.lat, long: longitude });
              set({
                lastPosition: { lat: data.lat, long: longitude },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.name || get().deviceId,
                lastUpdate: new Date()
              });
            } else {
              console.warn("MQTT message missing lat/lng properties:", data);
            }
          }
        } catch (error) {
          console.error('Error parsing MQTT message:', error, 'Raw message:', messageStr);
        }
      });
      
      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        set({ connectionError: err.message });
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
      set({ 
        client: null, 
        connected: false,
        connectionError: error instanceof Error ? error.message : 'Unknown error' 
      });
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
