import React, { useContext, useState, useEffect } from 'react';
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
import InfoIcon from '@mui/icons-material/Info';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { callapi } from '../api';
import { MQTTContext } from '../context/MQTTContext';
import DeviceInfoModal from '../components/DeviceInfoModal';

const STATUS_COLORS = {
  online: 'green',
  offline: 'red',
  updating: 'blue',
};

function Home() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const { client, devices, loading, error, disconnect, subscribeToMessages, topics } = useContext(MQTTContext);

  // Dialog state for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null); // Will hold the full device object
  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateDeviceId, setUpdateDeviceId] = useState(null);
  const [releases, setReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [updating, setUpdating] = useState(false);
  // Info Modal state
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoDeviceId, setInfoDeviceId] = useState(null);

  // Bulk Update Dialog state
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [selectedBulkReleaseId, setSelectedBulkReleaseId] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);


  useEffect(() => {
    if (!client) return;

    const unsubscribe = subscribeToMessages((message) => {
      const infoTopicRegex = new RegExp(`^${topics.info}/(.+)`);
      const match = message.topic.match(infoTopicRegex);
      if (match && match[1] === infoDeviceId) {
        try {
          const data = JSON.parse(message.message);
          setDeviceInfo(data);
          setInfoLoading(false);
        } catch (e) {
          console.error("Failed to parse device info message", e);
          setInfoLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [client, subscribeToMessages, infoDeviceId]);

  // Fetch releases for update dialog
  const fetchReleases = async () => {
    try {
      const data = await callapi('/api/updates', { method: 'GET' });
      setReleases(data || []);
    } catch {}
  };

  useState(() => {
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" align="center">
                My Devices
              </Typography>
              <Button
                variant="contained"
                onClick={async () => {
                  await fetchReleases();
                  setSelectedDeviceIds([]);
                  setSelectedBulkReleaseId('');
                  setBulkUpdateDialogOpen(true);
                }}
              >
                Bulk Update
              </Button>
            </Box>
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
                              color="info"
                              onClick={() => {
                                setInfoDeviceId(device.deviceId);
                                setDeviceInfo(null);
                                setInfoLoading(true);
                                setInfoModalOpen(true);
                                client.publish(`${topics.command}/${device.deviceId}`, JSON.stringify({ action: 'info' }));
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeviceToDelete(device); // Store the whole device object
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
                                setSelectedReleaseId('');
                                await fetchReleases();
                              }}
                            >
                              <SystemUpdateAltIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {/* Delete Confirmation Dialog */}
            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
            >
              <DialogTitle>Delete Device</DialogTitle>
              <DialogContent>
                {deviceToDelete?.status === 'offline' ? (
                  <DialogContentText>
                    Device <b>{deviceToDelete?.deviceId}</b> is offline. It cannot be factory reset.
                    It will be removed from this list, but will reappear if it comes back online.
                  </DialogContentText>
                ) : (
                  <DialogContentText>
                    Are you sure you want to delete device <b>{deviceToDelete?.deviceId}</b>? This will send a command to factory reset the device.
                  </DialogContentText>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (client && deviceToDelete) {
                      if (deviceToDelete.status === 'offline') {
                        // For offline devices, publish a blank retained message to remove from broker
                        client.publish(`${topics.status}/${deviceToDelete.deviceId}`, '', { retain: true });
                      } else {
                        // For online devices, send the delete command
                        const topic = `${topics.command}/${deviceToDelete.deviceId}`;
                        const message = JSON.stringify({ action: 'delete' });
                        client.publish(topic, message);
                      }
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
                  value={selectedReleaseId}
                  onChange={e => setSelectedReleaseId(e.target.value)}
                  displayEmpty
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="" disabled>Select version</MenuItem>
                  {releases.map(rel => (
                    <MenuItem key={rel.id} value={rel.id}>{`${rel.tag}/${rel.version}`}</MenuItem>
                  ))}
                </Select>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setUpdateDialogOpen(false)} color="primary">Cancel</Button>
                <Button
                  onClick={async () => {
                    if (client && updateDeviceId && selectedReleaseId) {
                      const release = releases.find(r => r.id === selectedReleaseId);
                      if (!release) return;

                      setUpdating(true);
                      client.publish(
                        `${topics.command}/${updateDeviceId}`,
                        JSON.stringify({ 
                          action: 'update', 
                          version: release.tag+"/"+String(release.version)
                        }),
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
                  disabled={updating || !selectedReleaseId}
                >
                  {updating ? 'Updating...' : 'Update'}
                </Button>
              </DialogActions>
            </Dialog>
            {/* Bulk Update Dialog */}
            <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} fullWidth>
              <DialogTitle>Bulk Device Update</DialogTitle>
              <DialogContent>
                <Typography gutterBottom>Select devices to update (only online devices are shown):</Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Devices</InputLabel>
                  <Select
                    multiple
                    value={selectedDeviceIds}
                    onChange={(e) => setSelectedDeviceIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Devices" />}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {devices.filter(d => d.status === 'online').map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        <Checkbox checked={selectedDeviceIds.indexOf(device.deviceId) > -1} />
                        <ListItemText primary={device.deviceId} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography gutterBottom sx={{ mt: 3 }}>Select a release version:</Typography>
                <Select
                  fullWidth
                  value={selectedBulkReleaseId}
                  onChange={e => setSelectedBulkReleaseId(e.target.value)}
                  displayEmpty
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="" disabled>Select version</MenuItem>
                  {releases.map(rel => (
                    <MenuItem key={rel.id} value={rel.id}>{`${rel.tag}/${rel.version}`}</MenuItem>
                  ))}
                </Select>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setBulkUpdateDialogOpen(false)} color="primary">Cancel</Button>
                <Button
                  onClick={() => {
                    if (client && selectedDeviceIds.length > 0 && selectedBulkReleaseId) {
                      const release = releases.find(r => r.id === selectedBulkReleaseId);
                      if (!release) return;

                      setBulkUpdating(true);
                      selectedDeviceIds.forEach(deviceId => {
                        client.publish(
                          `${topics.command}/${deviceId}`,
                          JSON.stringify({
                            action: 'update',
                            version: `${release.tag}/${String(release.version)}`
                          }),
                          { retain: false }
                        );
                      });
                      setBulkUpdating(false);
                      setBulkUpdateDialogOpen(false);
                    }
                  }}
                  color="primary"
                  variant="contained"
                  disabled={bulkUpdating || selectedDeviceIds.length === 0 || !selectedBulkReleaseId}
                >
                  {bulkUpdating ? 'Updating...' : 'Update Devices'}
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Container>
        <DeviceInfoModal
          open={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          deviceInfo={deviceInfo}
          loading={infoLoading}
        />
      </Box>
    );
  }

  export default Home;
