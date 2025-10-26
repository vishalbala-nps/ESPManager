import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ESPAppBar from '../components/ESPAppBar';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';
import mqtt from 'mqtt';
import { callapi } from '../api';

function MQTTConsole() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [mqttClient, setMqttClient] = useState(null);
  const [connected, setConnected] = useState(false);
  const [mqttError, setMqttError] = useState('');
  const [subscribeTopic, setSubscribeTopic] = useState('');
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const [publishTopic, setPublishTopic] = useState('');
  const [publishPayload, setPublishPayload] = useState('');
  // ...existing code...
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    } else {
      try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch {
        setUsername('');
      }
    }
  }, [navigate]);

  useEffect(() => {
    let client;
    async function setupMqtt() {
      setMqttError('');
      let mqttDetails = null;
      try {
        const data = await callapi('/api/mqtt', { method: 'GET' });
        if (data && data.host && data.port) {
          mqttDetails = data;
        } else {
          setMqttError('MQTT connection details not found.');
          return;
        }
      } catch (err) {
        setMqttError('Failed to fetch MQTT connection details from API.');
        return;
      }
      const { host, port, user, pass } = mqttDetails;
      const url = `ws://${host}:${port}`;
      const options = {};
      if (user && pass) {
        options.username = user;
        options.password = pass;
      }
      try {
        client = mqtt.connect(url, options);
        setMqttClient(client);
      } catch (err) {
        setMqttError('Failed to connect to MQTT broker.');
        return;
      }
      client.on('connect', () => {
        setConnected(true);
      });
      client.on('error', (err) => {
        setMqttError('MQTT connection error: ' + err.message);
        setConnected(false);
      });
      client.on('message', (topic, message) => {
        setMessages((prev) => {
          const newMsgs = [
            { topic, message: message.toString(), ts: new Date().toLocaleTimeString() },
            ...prev,
          ];
          return newMsgs;
        });
      });
    }
    setupMqtt();
    return () => {
      client && client.end();
    };
  }, []);

    // ...existing code...

  const handleLogout = () => {
    if (mqttClient) {
      mqttClient.end();
    }
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSubscribe = () => {
    if (!subscribeTopic || !mqttClient) return;
    mqttClient.subscribe(subscribeTopic, (err) => {
      if (!err) {
        setSubscribedTopics((prev) => [...prev, subscribeTopic]);
      } else {
        setMqttError('Failed to subscribe: ' + err.message);
      }
    });
    setSubscribeTopic('');
  };

  const handleUnsubscribe = (topic) => {
    if (!mqttClient) return;
    mqttClient.unsubscribe(topic, (err) => {
      if (!err) {
        setSubscribedTopics((prev) => prev.filter((t) => t !== topic));
      } else {
        setMqttError('Failed to unsubscribe: ' + err.message);
      }
    });
  };

  const handlePublish = () => {
    if (!publishTopic || !mqttClient) return;
    mqttClient.publish(publishTopic, publishPayload, { retain: false }, (err) => {
      if (err) {
        setMqttError('Failed to publish: ' + err.message);
      }
    });
    setPublishPayload('');
  };

  return (
    <>
      <ESPAppBar
        username={username}
        onLogout={handleLogout}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        navigate={navigate}
      />
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            MQTT Console
          </Typography>
          {/* ...existing code... */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Subscribe Topic"
              value={subscribeTopic}
              onChange={e => setSubscribeTopic(e.target.value)}
              fullWidth
              size="small"
            />
            <Button variant="contained" color="primary" onClick={handleSubscribe} disabled={!connected}>
              Subscribe
            </Button>
          </Box>
          <List dense>
          <Paper variant="outlined" sx={{ maxHeight: 120, overflow: 'auto', mb: 2 }}>
            <List dense>
              {subscribedTopics.map(topic => (
                <ListItem key={topic} secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleUnsubscribe(topic)}>
                    <DeleteIcon />
                  </IconButton>
                }>
                  <ListItemText primary={topic} />
                </ListItem>
              ))}
            </List>
          </Paper>
          </List>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Publish Topic"
              value={publishTopic}
              onChange={e => setPublishTopic(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Payload"
              value={publishPayload}
              onChange={e => setPublishPayload(e.target.value)}
              fullWidth
              size="small"
            />
            <Button variant="contained" color="success" onClick={handlePublish} disabled={!connected}>
              Publish
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ flexGrow: 1 }}>Messages</Typography>
          <IconButton color="error" onClick={() => setMessages([])}>
            <DeleteIcon />
          </IconButton>
        </Box>
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
          <List dense>
            {messages.length === 0 ? (
              <ListItem><ListItemText primary="No messages yet." /></ListItem>
            ) : (
              messages.map((msg, idx) => (
                <ListItem key={idx} alignItems="flex-start">
                  <ListItemText
                    primary={<>
                      <span style={{ fontWeight: 600, color: '#1976d2' }}>{msg.topic}</span>
                      <span style={{ float: 'right', fontSize: '0.85em', color: '#888' }}>[{msg.ts}]</span>
                    </>}
                    secondary={<span style={{ color: '#333', fontFamily: 'monospace' }}>{msg.message}</span>}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
          {mqttError && (
            <Typography color="error" sx={{ mt: 2 }}>{mqttError}</Typography>
          )}
        </Paper>
      </Container>
    </>
  );
}

export default MQTTConsole;
