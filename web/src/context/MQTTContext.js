import React, { createContext, useState, useEffect, useCallback } from 'react';
import mqtt from 'mqtt';
import { callapi } from '../api';

const MQTTContext = createContext();

const MQTTProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const connect = useCallback(async (mqttClientInstance) => {
    setLoading(true);
    setError('');
    let mqttDetails = null;
    try {
      const data = await callapi('/api/mqtt', { method: 'GET' });
      if (data && data.host && data.port) {
        mqttDetails = data;
      } else {
        setError('MQTT connection details not found.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('Failed to fetch MQTT connection details from API.');
      setLoading(false);
      return;
    }

    const { host, port, user, pass } = mqttDetails;
    const url = `ws://${host}:${port}`;
    const options = {
      clientId: `ESPManagerUI-${Math.random().toString(16).substr(2, 8)}`,
    };
    if (user && pass) {
      options.username = user;
      options.password = pass;
    }

    const client = mqtt.connect(url, options);
    setClient(client);

    client.on('connect', () => {
      setLoading(false);
      client.subscribe('device/status/#', (err) => {
        if (err) setError('Failed to subscribe to device status topics.');
      });
    });

    client.on('error', (err) => {
      setError('MQTT connection error: ' + err.message);
      setLoading(false);
    });

    client.on('message', (topic, message) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { topic, message: message.toString(), timestamp: new Date() },
      ]);
    });
  }, []);

  const disconnect = useCallback(() => {
    if (client) {
      client.end();
      setClient(null);
      setMessages([]);
    }
  }, [client]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !client) {
      connect();
    }
    // This cleanup function will be called when the component unmounts
    return () => {
      if (client) {
        client.end();
      }
    };
  }, [client, connect]);

  return (
    <MQTTContext.Provider value={{ client, messages, loading, error, disconnect, connect }}>
      {children}
    </MQTTContext.Provider>
  );
};

export { MQTTContext, MQTTProvider };
