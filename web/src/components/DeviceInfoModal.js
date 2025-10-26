import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Router as RouterIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  Dns as DnsIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem>
    <ListItemIcon>{icon}</ListItemIcon>
    <ListItemText primary={primary} secondary={secondary} />
  </ListItem>
);

const DeviceInfoModal = ({ open, onClose, deviceInfo, loading }) => {
  const formatUptime = (milliseconds) => {
    if (isNaN(milliseconds) || milliseconds < 0) {
      return 'N/A';
    }
    const seconds = Math.floor(milliseconds / 1000);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Device Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Fetching device info...</Typography>
          </Box>
        ) : deviceInfo ? (
          <List>
            <DetailItem icon={<DnsIcon />} primary="Device ID" secondary={deviceInfo.deviceId} />
            <DetailItem icon={<VpnKeyIcon />} primary="MAC Address" secondary={deviceInfo.macAddress} />
            <DetailItem icon={<InfoIcon />} primary="Firmware Version" secondary={deviceInfo.firmwareVersion} />
            <DetailItem icon={<RouterIcon />} primary="IP Address" secondary={deviceInfo.ipAddress} />
            <DetailItem icon={<SignalWifi4BarIcon />} primary="WiFi SSID" secondary={deviceInfo.wifiSSID} />
            <DetailItem icon={<SpeedIcon />} primary="WiFi Signal Strength" secondary={`${deviceInfo.wifiStrength} dBm`} />
            <DetailItem icon={<MemoryIcon />} primary="Free Heap" secondary={`${deviceInfo.freeHeap} bytes`} />
            <DetailItem icon={<SpeedIcon />} primary="Uptime" secondary={formatUptime(deviceInfo.uptime)} />
          </List>
        ) : (
          <Typography>No device information available.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceInfoModal;
