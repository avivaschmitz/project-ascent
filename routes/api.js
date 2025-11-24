const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all domains
router.get('/domains', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM domains ORDER BY domain_id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// GET single domain by ID
router.get('/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM domains WHERE domain_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Failed to fetch domain' });
  }
});

// POST create new domain
router.post('/domains', async (req, res) => {
  try {
    const { domain_name } = req.body;

    // Validation
    if (!domain_name || domain_name.trim() === '') {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    // Check for duplicate domain name
    const existingDomain = await db.query(
      'SELECT * FROM domains WHERE domain_name = $1',
      [domain_name]
    );

    if (existingDomain.rows.length > 0) {
      return res.status(409).json({ error: 'Domain name already exists' });
    }

    // Insert new domain
    const result = await db.query(
      'INSERT INTO domains (domain_name) VALUES ($1) RETURNING *',
      [domain_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Failed to create domain' });
  }
});

// PUT update domain
router.put('/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { domain_name } = req.body;

    // Validation
    if (!domain_name || domain_name.trim() === '') {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    // Check if domain exists
    const existingDomain = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [id]
    );

    if (existingDomain.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Check for duplicate domain name (excluding current domain)
    const duplicateDomain = await db.query(
      'SELECT * FROM domains WHERE domain_name = $1 AND domain_id != $2',
      [domain_name, id]
    );

    if (duplicateDomain.rows.length > 0) {
      return res.status(409).json({ error: 'Domain name already exists' });
    }

    // Update domain
    const result = await db.query(
      'UPDATE domains SET domain_name = $1 WHERE domain_id = $2 RETURNING *',
      [domain_name, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({ error: 'Failed to update domain' });
  }
});

// DELETE domain
router.delete('/domains/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if domain exists
    const existingDomain = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [id]
    );

    if (existingDomain.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Delete domain
    await db.query('DELETE FROM domains WHERE domain_id = $1', [id]);

    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

module.exports = router;