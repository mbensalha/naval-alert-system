
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
  connect: (brokerUrl: string, options?: {
    port?: number;
    username?: string;
    password?: string;
    protocol?: MqttProtocol;
  }) => void;
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

  connect: (brokerUrl: string, options?: { port?: number; username?: string; password?: string; protocol?: MqttProtocol }) => {
    console.log("Connecting to MQTT broker:", brokerUrl, "with options:", options);

    const existingClient = get().client;
    if (existingClient) {
      console.log("Disconnecting existing MQTT client before connecting");
      existingClient.end();
    }

    try {
      const protocol = options?.protocol || 'mqtt';  // default to 'mqtt'
      let hostname = brokerUrl;

      if (brokerUrl.includes('://')) {
        hostname = brokerUrl.split('://')[1];
      }
      hostname = hostname.replace(/\/$/, '');

      const mqttPort = options?.port || (protocol === 'mqtt' ? 1883 :
                                         protocol === 'mqtts' ? 8883 :
                                         protocol === 'ws' ? 8083 :
                                         protocol === 'wss' ? 8084 :
                                         1883);

      console.log(`MQTT connection details: protocol=${protocol}, hostname=${hostname}, port=${mqttPort}`);

      const mqttOptions: mqtt.IClientOptions = {
        protocol,
        hostname,
        port: mqttPort,
        keepalive: 60,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        clean: true,
      };

      if (options?.username || options?.password) {
        mqttOptions.username = options.username;
        mqttOptions.password = options.password;
      }

      console.log("Creating MQTT client with options:", mqttOptions);

      const connectionUrl = `${protocol}://${hostname}:${mqttPort}`;
      console.log("Connection URL:", connectionUrl);

      const client = mqtt.connect(connectionUrl, mqttOptions);
      set({ client, connectionError: null });

      client.on('connect', () => {
        console.log('✅ Successfully connected to MQTT broker:', hostname);
        set({ client, connected: true, connectionError: null });
      });

      client.on('reconnect', () => {
        console.log('♻️ Attempting to reconnect to MQTT broker...');
      });

      client.on('message', (topic, message) => {
        const messageStr = message.toString();
        console.log(`📥 Received MQTT message on topic ${topic}:`, messageStr);

        try {
          if (topic.includes('gps')) {
            console.log("🛰️ Processing GPS data from topic:", topic);
            const data = JSON.parse(messageStr);
            console.log("📊 Parsed MQTT GPS data:", data);

            if (data.lat !== undefined && data.lng !== undefined) {
              console.log("✅ Setting new position from ESP32 data format:", { lat: data.lat, long: data.lng });

              set({
                lastPosition: { lat: data.lat, long: data.lng },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.device_id || get().deviceId || "ESP32-NetBox",
                lastUpdate: new Date()
              });
            } else if (data.lat !== undefined && (data.long !== undefined || data.lon !== undefined)) {
              const longitude = data.long !== undefined ? data.long : data.lon;
              console.log("✅ Setting new position from alternative format:", { lat: data.lat, long: longitude });
              set({
                lastPosition: { lat: data.lat, long: longitude },
                speed: data.speed !== undefined ? data.speed : get().speed,
                deviceId: data.name || get().deviceId,
                lastUpdate: new Date()
              });
            } else {
              console.warn("⚠️ MQTT message missing lat/lng properties:", data);
            }
          }
        } catch (error) {
          console.error('❌ Error parsing MQTT message:', error, 'Raw message:', messageStr);
        }
      });

      client.on('error', (err) => {
        console.error('🚫 MQTT connection error:', err);
        set({ connectionError: err.message });
      });

      client.on('close', () => {
        console.log('🔌 MQTT connection closed');
        set({ connected: false });
      });

      client.on('offline', () => {
        console.log('📴 MQTT client went offline');
        set({ connected: false });
      });

    } catch (error) {
      console.error('❌ Error creating MQTT client:', error);
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
      console.log('👋 Manually disconnecting MQTT client');
      client.end();
      set({ client: null, connected: false });
    }
  },

  subscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      console.log(`➕ Subscribing to MQTT topic: ${topic}`);
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Error subscribing to ${topic}:`, err);
        } else {
          console.log(`✅ Successfully subscribed to ${topic}`);
        }
      });
    } else {
      console.warn("⚠️ Cannot subscribe: MQTT client not connected");
    }
  },

  unsubscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      console.log(`➖ Unsubscribing from MQTT topic: ${topic}`);
      client.unsubscribe(topic);
    }
  }
}));
