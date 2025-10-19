
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LogoutIcon from '@mui/icons-material/Logout';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Button from '@mui/material/Button';
import mqtt from 'mqtt';
import { callapi } from '../api';

const STATUS_COLORS = {
  online: 'green',
  offline: 'red',
  updating: 'blue',
};

function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [devices, setDevices] = useState([]);
  const [mqttLoading, setMqttLoading] = useState(true);
  const [mqttError, setMqttError] = useState('');
  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  // MQTT connection and device status subscription
  const [mqttClient, setMqttClient] = useState(null);
  useEffect(() => {
    let ignore = false;
    async function setupMqtt() {
      setMqttLoading(true);
      setMqttError('');
      let mqttDetails = null;
      try {
        const data = await callapi('/api/mqtt', { method: 'GET' });
        if (data && data.host && data.port) {
          mqttDetails = data;
        } else {
          setMqttError('MQTT connection details not found.');
          setMqttLoading(false);
          return;
        }
      } catch (err) {
        setMqttError('Failed to fetch MQTT connection details from API.');
        setMqttLoading(false);
        return;
      }
      if (ignore) return;
      const { host, port, user, pass } = mqttDetails;
      const url = `ws://${host}:${port}`;
      const options = {};
      if (user && pass) {
        options.username = user;
        options.password = pass;
      }
      let client;
      let timeoutId;
      let connected = false;
      try {
        client = mqtt.connect(url, options);
        setMqttClient(client);
      } catch (err) {
        setMqttError('Failed to connect to MQTT broker.');
        setMqttLoading(false);
        return;
      }
      // Timeout for connection (10 seconds)
      timeoutId = setTimeout(() => {
        if (!connected) {
          setMqttError('MQTT connection timed out.');
          setMqttLoading(false);
          try { client && client.end(); } catch {}
        }
      }, 10000);
      client.on('connect', () => {
        connected = true;
        clearTimeout(timeoutId);
        setMqttLoading(false);
        client.subscribe('device/status/+', (err) => {
          if (err) setMqttError('Failed to subscribe to device/status/+');
        });
      });
      client.on('error', (err) => {
        setMqttError('MQTT connection error: ' + err.message);
        setMqttLoading(false);
        clearTimeout(timeoutId);
      });
      client.on('message', (topic, message) => {
        const match = topic.match(/^device\/status\/(.+)$/);
        if (match) {
          const deviceId = match[1];
          try {
            const data = JSON.parse(message.toString());
            data.deviceId = deviceId;
            setDevices((prev) => {
              const idx = prev.findIndex((d) => d.deviceId === deviceId);
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...data };
                return updated;
              } else {
                return [...prev, data];
              }
            });
          } catch {}
        }
      });
      return () => {
        clearTimeout(timeoutId);
        client && client.end();
      };
    }
    setupMqtt();
    return () => { ignore = true; };
  }, []);


  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    } else {
      // Decode JWT to get username (without verifying signature)
      try {
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.username);
      } catch {
        setUsername('');
      }
    }
  }, [navigate]);


  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    handleClose();
    navigate('/');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ESPManager
          </Typography>
          {username && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={handleMenu} color="inherit" size="large">
                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                  {username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography sx={{ color: 'white', mr: 0.5 }}>{username}</Typography>
                <ArrowDropDownIcon sx={{ color: 'white' }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            My Devices
          </Typography>
          {mqttLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {mqttError && (
            <Alert severity="error" sx={{ my: 2 }}>{mqttError}</Alert>
          )}
          {!mqttLoading && !mqttError && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Id</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Options</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No devices found.</TableCell>
                    </TableRow>
                  ) : (
                    devices.map((device) => (
                      <TableRow key={device.deviceId}>
                        <TableCell>{device.deviceId}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FiberManualRecordIcon sx={{ color: STATUS_COLORS[device.status] || 'grey', fontSize: 16, mr: 1 }} />
                            <span style={{ textTransform: 'capitalize' }}>{device.status}</span>
                          </Box>
                        </TableCell>
                        <TableCell>{device.version}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setDeviceToDelete(device.deviceId);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <IconButton size="small" disabled>
                            <SystemUpdateAltIcon />
                          </IconButton>
                        </TableCell>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete device <b>{deviceToDelete}</b>? This will remove its retained status from the broker.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (mqttClient && deviceToDelete) {
                mqttClient.publish(`device/status/${deviceToDelete}`, '', { retain: true });
                setDevices((prev) => prev.filter((d) => d.deviceId !== deviceToDelete));
              }
              setDeleteDialogOpen(false);
              setDeviceToDelete(null);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default Home;
