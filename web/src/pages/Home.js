
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import ESPAppBar from '../components/ESPAppBar';
import IconButton from '@mui/material/IconButton';
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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Button from '@mui/material/Button';
import { callapi } from '../api';
import { MQTTContext } from '../context/MQTTContext';

const STATUS_COLORS = {
  online: 'green',
  offline: 'red',
  updating: 'blue',
};

function Home() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [devices, setDevices] = useState([]);
  const { client, messages, loading, error, disconnect } = useContext(MQTTContext);

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateDeviceId, setUpdateDeviceId] = useState(null);
  const [releases, setReleases] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const uniqueDevices = new Map();
    messages.forEach(({ topic, message }) => {
      const match = topic.match(/^device\/status\/(.+)$/);
      if (match) {
        const deviceId = match[1];
        try {
          const data = JSON.parse(message);
          data.deviceId = deviceId;
          uniqueDevices.set(deviceId, { ...uniqueDevices.get(deviceId), ...data });
        } catch {}
      }
    });
    setDevices(Array.from(uniqueDevices.values()));
  }, [messages]);

  // Fetch releases for update dialog
  const fetchReleases = async () => {
    try {
      const data = await callapi('/api/updates', { method: 'GET' });
      setReleases(data || []);
    } catch {}
  };

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

  const handleLogout = () => {
    disconnect();
    localStorage.removeItem('token');
    navigate('/');
  };
    return (
      <Box sx={{ flexGrow: 1 }}>
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
              My Devices
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            )}
            {!loading && !error && (
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
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={async () => {
                                setUpdateDeviceId(device.deviceId);
                                setUpdateDialogOpen(true);
                                setSelectedVersion('');
                                await fetchReleases();
                              }}
                            >
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
                                  if (client && deviceToDelete) {
                                    client.publish(`device/status/${deviceToDelete}`, '', { retain: true });
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
                          {/* Update Dialog */}
                          <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
                            <DialogTitle>Update Device</DialogTitle>
                            <DialogContent>
                              <Typography gutterBottom>Select a release version to update device <b>{updateDeviceId}</b>:</Typography>
                              <Select
                                fullWidth
                                value={selectedVersion}
                                onChange={e => setSelectedVersion(e.target.value)}
                                displayEmpty
                                sx={{ mt: 2 }}
                              >
                                <MenuItem value="" disabled>Select version</MenuItem>
                                {releases.map(rel => (
                                  <MenuItem key={rel.id} value={rel.version}>{rel.version}</MenuItem>
                                ))}
                              </Select>
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={() => setUpdateDialogOpen(false)} color="primary">Cancel</Button>
                              <Button
                                onClick={async () => {
                                  if (client && updateDeviceId && selectedVersion) {
                                    setUpdating(true);
                                    client.publish(
                                      `device/status/${updateDeviceId}`,
                                      JSON.stringify({ action: 'update', version: String(selectedVersion) }),
                                      { retain: false },
                                      () => {
                                        setUpdating(false);
                                        setUpdateDialogOpen(false);
                                      }
                                    );
                                  }
                                }}
                                color="primary"
                                variant="contained"
                                disabled={updating || !selectedVersion}
                              >
                                {updating ? 'Updating...' : 'Update'}
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
