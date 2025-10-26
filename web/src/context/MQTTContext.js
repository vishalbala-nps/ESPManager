import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import mqtt from 'mqtt';
import { callapi } from '../api';

const MQTTContext = createContext();

const MQTTProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [topics, setTopics] = useState({
    status: 'device/status',
    command: 'device/command',
    info: 'device/info',
  });
  const messageListeners = useRef([]);

  const subscribeToMessages = useCallback((callback) => {
    messageListeners.current.push(callback);
    // Return an unsubscribe function
    return () => {
      messageListeners.current = messageListeners.current.filter(cb => cb !== callback);
    };
  }, []);

  const connect = useCallback(async () => {
    if (client) return;

    setLoading(true);
    setError('');
    try {
      const data = await callapi('/api/mqtt', { method: 'GET' });
      if (!data || !data.host || !data.port) {
        setError('MQTT connection details not found.');
        setLoading(false);
        return;
      }

      // Store dynamic topics
      setTopics({
        status: data.statusTopic,
        command: data.commandTopic,
        info: data.infoTopic,
      });

      const { host, port, user, pass } = data;
      const url = `ws://${host}:${port}`;
      const options = {
        clientId: `ESPManagerUI-${Math.random().toString(16).substr(2, 8)}`,
        username: user,
        password: pass,
      };

      const newClient = mqtt.connect(url, options);
      setClient(newClient);

      newClient.on('connect', () => {
        setLoading(false);
        newClient.subscribe(`${data.statusTopic}/#`, (err) => {
          if (err) setError('Failed to subscribe to device status topics.');
        });
        newClient.subscribe(`${data.infoTopic}/#`, (err) => {
            if (err) setError('Failed to subscribe to device info topics.');
        });
      });

      newClient.on('error', (err) => {
        setError('MQTT connection error: ' + err.message);
        setLoading(false);
        newClient.end(); // Stop trying to connect
      });

      newClient.on('message', (topic, message) => {
        const messageString = message.toString();
        const newMessage = { topic, message: messageString, timestamp: new Date() };

        // Notify all subscribers (for MQTTConsole)
        messageListeners.current.forEach(cb => cb(newMessage));

        // Handle internal device list logic
        const statusTopicRegex = new RegExp(`^${topics.status}/(.+)`);
        const match = topic.match(statusTopicRegex);
        if (match) {
          const deviceId = match[1];
          setDevices(prevDevices => {
            const newDevices = new Map(prevDevices.map(d => [d.deviceId, d]));
            if (message.length === 0) {
              // Blank message means delete
              newDevices.delete(deviceId);
            } else {
              try {
                const data = JSON.parse(messageString);
                const existingDevice = newDevices.get(deviceId) || {};
                newDevices.set(deviceId, { ...existingDevice, ...data, deviceId });
              } catch (e) {
                // Ignore non-JSON messages for device updates
              }
            }
            return Array.from(newDevices.values());
          });
        }
      });

    } catch (err) {
      setError('Failed to fetch MQTT connection details from API.');
      setLoading(false);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    if (client) {
      client.end();
      setClient(null);
      setDevices([]); // Clear devices on disconnect
    }
  }, [client]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !client) {
      connect();
    }
  }, [client, connect]);

  return (
    <MQTTContext.Provider value={{ client, loading, error, devices, topics, disconnect, connect, subscribeToMessages }}>
      {children}
    </MQTTContext.Provider>
  );
};

export { MQTTContext, MQTTProvider };
