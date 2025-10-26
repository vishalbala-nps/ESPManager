import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Releases from './pages/Releases';
import MQTTConsole from './pages/MQTTConsole';
import { MQTTProvider } from './context/MQTTContext';

function App() {
  return (
    <MQTTProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/mqtt-console" element={<MQTTConsole />} />
        </Routes>
      </Router>
    </MQTTProvider>
  );
}

export default App;