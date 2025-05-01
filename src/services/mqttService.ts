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
  
  connect: (brokerUrl: string, port?: number, username?: string, password?: string) => {
    console.log("Connecting to MQTT broker:", brokerUrl, "port:", port || "default");
    
    // Disconnect existing client if there is one
    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }
    
    try {
      // For local Raspberry Pi setup, simplify connection settings and protocol handling
      // Default to mqtt:// for local connections, ws:// for browser remote connections
      let protocol: MqttProtocol = 'mqtt';  // Default for local connections
      let url = brokerUrl;
      
      // Check if running in browser environment vs Node.js environment
      const isBrowser = typeof window !== 'undefined';
      
      // For browser environments over HTTPS, we need WSS
      if (isBrowser) {
        if (window.location.protocol === 'https:') {
          protocol = 'wss';
          console.log("Using WSS protocol for secure browser connection");
        } else {
          protocol = 'ws';
          console.log("Using WS protocol for browser connection");
        }
      }
      
      // Handle protocol in URL if provided
      if (brokerUrl.startsWith('mqtt://')) {
        protocol = isBrowser ? 'ws' : 'mqtt'; // Convert to WS for browser
        url = brokerUrl.replace('mqtt://', '');
        if (isBrowser) console.log("Converted mqtt:// to ws:// for browser compatibility");
      } else if (brokerUrl.startsWith('mqtts://')) {
        protocol = isBrowser ? 'wss' : 'mqtts'; // Convert to WSS for browser
        url = brokerUrl.replace('mqtts://', '');
        if (isBrowser) console.log("Converted mqtts:// to wss:// for browser compatibility");
      } else if (brokerUrl.startsWith('ws://')) {
        protocol = 'ws';
        url = brokerUrl.replace('ws://', '');
      } else if (brokerUrl.startsWith('wss://')) {
        protocol = 'wss';
        url = brokerUrl.replace('wss://', '');
      } else if (!brokerUrl.includes('://')) {
        // No protocol specified, use appropriate default
        if (isBrowser) {
          // For browser, use WebSockets
          protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
          console.log(`Using ${protocol} for browser connection to ${url}`);
        } else {
          // For Raspberry Pi local connection, use standard MQTT
          protocol = 'mqtt';
          console.log("Using standard MQTT for local connection");
        }
      }
      
      // Extract hostname and port from URL if provided
      let hostname = url;
      
      // Determine appropriate default port based on protocol and environment
      let mqttPort: number;
      
      if (port) {
        // If port is explicitly provided, use it
        mqttPort = port;
      } else {
        // Standard MQTT ports based on protocol
        if (protocol === 'mqtt') {
          mqttPort = 1883;
        } else if (protocol === 'mqtts') {
          mqttPort = 8883;
        } else if (protocol === 'ws') {
          mqttPort = 9001; // Standard WebSocket MQTT port
        } else {
          mqttPort = 9001; // Standard Secure WebSocket MQTT port
        }
      }
                 
      // Handle port in the URL
      if (url.includes(':')) {
        const parts = url.split(':');
        hostname = parts[0];
        if (!port) { // Only use port from URL if not explicitly provided
          mqttPort = parseInt(parts[1], 10);
        }
      }
      
      // Remove trailing slash from hostname if present
      hostname = hostname.replace(/\/$/, '');
      
      console.log(`MQTT connection details: protocol=${protocol}, hostname=${hostname}, port=${mqttPort}`);
      
      // Set MQTT connection options
      const options: mqtt.IClientOptions = {
        protocol,
        hostname,
        port: mqttPort,
        keepalive: 60,
        connectTimeout: 10 * 1000, // 10 seconds
        reconnectPeriod: 5000, // 5 seconds
        clean: true, // Clean session
      };
      
      // Add authentication if provided
      if (username || password) {
        options.username = username;
        options.password = password;
        console.log("Using authentication for MQTT connection");
      }
      
      console.log("Creating MQTT client with options:", options);
      
      // Construct the connection URL
      let connectionUrl: string;
      
      if (isBrowser) {
        // For browser environments, use WebSocket URL format
        connectionUrl = `${protocol}://${hostname}:${mqttPort}`;
        console.log("Browser connection URL:", connectionUrl);
      } else {
        // For Node.js environments (like Raspberry Pi), use MQTT URL format
        connectionUrl = `${protocol}://${hostname}:${mqttPort}`;
        console.log("Node.js connection URL:", connectionUrl);
      }
      
      // Connect to broker
      const client = mqtt.connect(connectionUrl, options);
      
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
            // Le format Node-RED envoie latitude, longitude, speed et device_id
            if (data.latitude !== undefined && data.longitude !== undefined) {
              console.log("Setting new position from Node-RED format:", { lat: data.latitude, long: data.longitude });
              set({
                lastPosition: { lat: data.latitude, long: data.longitude },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.device_id || get().deviceId || "ESP32",
                lastUpdate: new Date()
              });
            }
            // Gérer aussi le format alternatif au cas où
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
