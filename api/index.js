require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3001; 
const JWT_SECRET = process.env.SECRET_KEY || 'supersecretkey';

app.use(cors());
app.use(express.json());
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || 'data/database.sqlite',
});


// Import models
const { User,Release } = require('./models')(sequelize);

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
  const {
    MQTT_HOST,
    MQTT_PORT,
    MQTT_USERNAME,
    MQTT_PASSWORD,
    MQTT_STATUS_TOPIC,
    MQTT_COMMAND_TOPIC,
    MQTT_INFO_TOPIC
  } = process.env;

  if (!MQTT_HOST || !MQTT_PORT) {
    return res.status(500).json({ error: 'MQTT connection details missing', code: 'MQTT_CONFIG_MISSING' });
  }

  res.json({
    host: MQTT_HOST,
    port: MQTT_PORT,
    user: MQTT_USERNAME,
    pass: MQTT_PASSWORD,
    statusTopic: MQTT_STATUS_TOPIC || 'device/status',
    commandTopic: MQTT_COMMAND_TOPIC || 'device/command',
    infoTopic: MQTT_INFO_TOPIC || 'device/info'
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

// Get all releases
app.get('/api/updates', async (req, res) => {
  try {
    if (req.query.latest === 'true') {
      const { tag } = req.query;
      if (!tag) {
        return res.status(400).json({ error: 'Tag query parameter is required for latest release' });
      }
      const release = await Release.findOne({ 
        where: { tag },
        order: [['date', 'DESC']] 
      });
      if (!release) return res.status(404).json({ error: 'No releases found for this tag' });
      return res.json([release]);
    }
    const releases = await Release.findAll({ order: [['date', 'DESC']] });
    res.json(releases);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Add a new release
app.post('/api/updates', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { version, tag } = req.body;
    if (!version || !req.file || !tag) {
      return res.status(400).json({ error: 'Version, file, and tag are required' });
    }
    const release = await Release.create({
      version: parseFloat(version),
      filename: req.file.filename,
      date: new Date(),
      tag: tag,
    });
    res.json(release);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add release' });
  }
});

// Download a release file by tag and version number
app.get('/api/updates/:tag/:version/download', async (req, res) => {
  try {
    const release = await Release.findOne({ 
      where: { 
        tag: req.params.tag,
        version: req.params.version 
      } 
    });
    if (!release) return res.status(404).json({ error: 'Release not found' });
    const filePath = path.join(uploadDir, release.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
    res.download(filePath, release.filename);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Remove a release by id
app.delete('/api/updates/:id', authenticateToken, async (req, res) => {
  try {
    const release = await Release.findByPk(req.params.id);
    if (!release) return res.status(404).json({ error: 'Release not found' });
    const filePath = path.join(uploadDir, release.filename);
    await release.destroy();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove release' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
});