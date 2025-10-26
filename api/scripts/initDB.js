require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || 'data/database.sqlite',
});
const models = require('../models')(sequelize);

(async () => {
  try {
    await sequelize.sync();
    console.log('Database initialized and all models are synced.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    process.exit(0);
  }
})();
