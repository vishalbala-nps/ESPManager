import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ESPAppBar from '../components/ESPAppBar';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { callapi } from '../api';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
function Releases() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [version, setVersion] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [releaseToDelete, setReleaseToDelete] = useState(null);

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
    async function fetchReleases() {
      setLoading(true);
      setError('');
      try {
        const data = await callapi('/api/updates', { method: 'GET' });
        setReleases(data || []);
      } catch (err) {
        setError('Failed to fetch releases');
      }
      setLoading(false);
    }
    fetchReleases();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAddRelease = async () => {
    setUploading(true);
    setUploadError('');
    if (!version || !file) {
      setUploadError('Version and file are required');
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append('version', version);
    formData.append('file', file);
    try {
      await callapi('/api/updates', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });
      setDialogOpen(false);
      setVersion('');
      setFile(null);
      // Refresh releases
      const data = await callapi('/api/updates', { method: 'GET' });
      setReleases(data || []);
    } catch (err) {
      setUploadError('Failed to upload release');
    }
    setUploading(false);
  };

  const handleDeleteRelease = async () => {
    if (!releaseToDelete) return;
    try {
      await callapi(`/api/updates/${releaseToDelete.id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      setReleaseToDelete(null);
      // Refresh releases
      const data = await callapi('/api/updates', { method: 'GET' });
      setReleases(data || []);
    } catch (err) {
      setError('Failed to delete release');
    }
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" align="center" gutterBottom>
              Releases
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)}>
              Add Update
            </Button>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Filename</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Loading...</TableCell>
                  </TableRow>
                ) : releases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No releases found.</TableCell>
                  </TableRow>
                ) : (
                  releases.map((rel) => (
                    <TableRow key={rel.id || rel.version}>
                      <TableCell>{rel.version}</TableCell>
                      <TableCell>{rel.filename}</TableCell>
                      <TableCell>{rel.date ? new Date(rel.date).toLocaleString() : ''}</TableCell>
                      <TableCell>
                        <IconButton color="error" size="small" onClick={() => { setReleaseToDelete(rel); setDeleteDialogOpen(true); }}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Update</DialogTitle>
        <DialogContent>
          <TextField
            label="Version Number"
            type="number"
            inputProps={{ step: '0.01' }}
            fullWidth
            margin="normal"
            value={version}
            onChange={e => setVersion(e.target.value)}
          />
          <Button
            variant="outlined"
            component="label"
            sx={{ mt: 2 }}
          >
            Upload BIN File
            <input
              type="file"
              accept=".bin"
              hidden
              onChange={e => setFile(e.target.files[0])}
            />
          </Button>
          {file && <Typography sx={{ mt: 1 }}>Selected: {file.name}</Typography>}
          {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleAddRelease} color="primary" variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Release</DialogTitle>
        <DialogContent>
          <DialogContent>
            Are you sure you want to delete release <b>{releaseToDelete && releaseToDelete.version}</b>?
          </DialogContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleDeleteRelease} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Releases;
