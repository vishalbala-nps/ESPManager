import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import  { useState, useEffect } from 'react';
import ESPAppBar from '../components/ESPAppBar';

function Releases() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [username, setUsername] = useState('');
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
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
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
            Releases
          </Typography>
          {/* Add release management UI here */}
        </Paper>
      </Container>
    </>
  );
}

export default Releases;
