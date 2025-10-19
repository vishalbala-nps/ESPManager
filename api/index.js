
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.SECRET_KEY || 'supersecretkey';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

app.use(cors());
app.use(express.json());

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});


// Import models
const { User } = require('./models')(sequelize);

// Sync database
sequelize.sync();

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// MQTT connection details endpoint
app.get('/api/mqtt', authenticateToken, (req, res) => {
  const { MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PASS } = process.env;
  if (!MQTT_HOST || !MQTT_PORT) {
    return res.status(500).json({ error: 'MQTT connection details missing', code: 'MQTT_CONFIG_MISSING' });
  }
  res.json({
    host: MQTT_HOST,
    port: MQTT_PORT,
    user: MQTT_USER,
    pass: MQTT_PASS
  });
});

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Protected route example
app.get('/api/profile', authenticateToken, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'username'] });
  if (!user) return res.sendStatus(404);
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
});
