const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
// Heroku automatically provides DATABASE_URL in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  query,
  pool
};