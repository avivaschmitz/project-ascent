# Heroku App Boilerplate

A basic boilerplate application for deploying to Heroku with PostgreSQL database support.

## Features

- Express.js server
- PostgreSQL database connection ready
- Static file serving
- Environment variable configuration
- Production-ready setup

## Project Structure

```
├── server.js           # Main Express server
├── db.js              # PostgreSQL connection pool
├── package.json       # Dependencies and scripts
├── Procfile          # Heroku process configuration
├── .env              # Environment variables (local only)
├── .gitignore        # Git ignore rules
└── public/           # Static files
    ├── index.html    # Main HTML page
    ├── styles.css    # CSS styles
    └── app.js        # Frontend JavaScript
```

## Local Development

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL installed locally

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` and update `DATABASE_URL` with your local PostgreSQL connection string

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Database Setup

The `db.js` file provides a connection pool to PostgreSQL. To add tables:

1. Create a migration file or schema file
2. Add queries using the exported `query` function from `db.js`

Example:
```javascript
const db = require('./db');

// Create a table
const createTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100) UNIQUE
    )
  `);
};
```

## Deploying to Heroku

### Prerequisites

- Heroku CLI installed
- Heroku account

### Deployment Steps

1. Login to Heroku:
```bash
heroku login
```

2. Create a new Heroku app:
```bash
heroku create your-app-name
```

3. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:mini
```

4. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

5. Open your app:
```bash
heroku open
```

### Environment Variables

Heroku automatically sets:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port number for the server

To set custom environment variables:
```bash
heroku config:set VARIABLE_NAME=value
```

## Adding API Routes

Create a new routes file (e.g., `routes/api.js`):

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/example', async (req, res) => {
  try {
    // Your route logic here
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Then add to `server.js`:
```javascript
app.use('/api', require('./routes/api'));
```

## License

ISC