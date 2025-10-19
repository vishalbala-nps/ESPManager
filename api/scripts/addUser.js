

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const prompt = require('prompt-sync')({ sigint: true });
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const { User } = require('../models')(new Sequelize({
  dialect: 'sqlite',
  storage: '../database.sqlite',
}));
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

(async () => {
  try {
    const username = prompt('Enter username: ');
    const password = prompt('Enter password: ', { echo: '' });
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await User.create({ username, password: hashedPassword });
    console.log('User added successfully!');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.log('User already exists!');
    } else {
      console.error('Error:', err);
    }
  } finally {
    process.exit(0);
  }
})();
