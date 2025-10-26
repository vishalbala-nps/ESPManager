import React, { useState, useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
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
import { MQTTContext } from '../context/MQTTContext';

function MQTTConsole() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const { client, messages, error, disconnect } = useContext(MQTTContext);
  const [subscribedTopics, setSubscribedTopics] = useState(['device/status/#']);
  const [subscribeTopic, setSubscribeTopic] = useState('');
  const [publishTopic, setPublishTopic] = useState('');
  const [publishPayload, setPublishPayload] = useState('');
  const [consoleMessages, setConsoleMessages] = useState([]);

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
    const newMessages = messages.map(msg => ({
      ...msg,
      ts: new Date().toLocaleTimeString(),
    }));
    setConsoleMessages(prev => [...newMessages, ...prev]);
  }, [messages]);

  const handleLogout = () => {
    disconnect();
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSubscribe = () => {
    if (!subscribeTopic || !client) return;
    client.subscribe(subscribeTopic, (err) => {
      if (!err) {
        setSubscribedTopics((prev) => [...prev, subscribeTopic]);
      }
    });
    setSubscribeTopic('');
  };

  const handleUnsubscribe = (topic) => {
    if (!client) return;
    client.unsubscribe(topic, (err) => {
      if (!err) {
        setSubscribedTopics((prev) => prev.filter((t) => t !== topic));
      }
    });
  };

  const handlePublish = () => {
    if (!publishTopic || !client) return;
    client.publish(publishTopic, publishPayload, { retain: false });
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
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Subscribe Topic"
              value={subscribeTopic}
              onChange={e => setSubscribeTopic(e.target.value)}
              fullWidth
              size="small"
            />
            <Button variant="contained" color="primary" onClick={handleSubscribe} disabled={!client}>
              Subscribe
            </Button>
          </Box>
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
            <Button variant="contained" color="success" onClick={handlePublish} disabled={!client}>
              Publish
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ flexGrow: 1 }}>Messages</Typography>
            <IconButton color="error" onClick={() => setConsoleMessages([])}>
              <DeleteIcon />
            </IconButton>
          </Box>
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
            <List dense>
              {consoleMessages.length === 0 ? (
                <ListItem><ListItemText primary="No messages yet." /></ListItem>
              ) : (
                consoleMessages.map((msg, idx) => (
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
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
          )}
        </Paper>
      </Container>
    </>
  );
}

export default MQTTConsole;
