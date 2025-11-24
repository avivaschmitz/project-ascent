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

// GET all variables for a domain
router.get('/domains/:domainId/variables', async (req, res) => {
  try {
    const { domainId } = req.params;

    // Check if domain exists
    const domainCheck = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [domainId]
    );

    if (domainCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const result = await db.query(
      'SELECT * FROM domain_variables WHERE domain_id = $1 ORDER BY domain_variable_id ASC',
      [domainId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domain variables:', error);
    res.status(500).json({ error: 'Failed to fetch domain variables' });
  }
});

// GET single variable
router.get('/domains/:domainId/variables/:variableId', async (req, res) => {
  try {
    const { domainId, variableId } = req.params;

    const result = await db.query(
      'SELECT * FROM domain_variables WHERE domain_variable_id = $1 AND domain_id = $2',
      [variableId, domainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching variable:', error);
    res.status(500).json({ error: 'Failed to fetch variable' });
  }
});

// POST create new variable for a domain
router.post('/domains/:domainId/variables', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { variable_name, variable_value } = req.body;

    // Validation
    if (!variable_name || variable_name.trim() === '') {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    // Check if domain exists
    const domainCheck = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [domainId]
    );

    if (domainCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Check for duplicate variable name within the same domain
    const existingVariable = await db.query(
      'SELECT * FROM domain_variables WHERE domain_id = $1 AND variable_name = $2',
      [domainId, variable_name]
    );

    if (existingVariable.rows.length > 0) {
      return res.status(409).json({ error: 'Variable name already exists for this domain' });
    }

    // Insert new variable
    const result = await db.query(
      'INSERT INTO domain_variables (variable_name, variable_value, domain_id) VALUES ($1, $2, $3) RETURNING *',
      [variable_name, variable_value || null, domainId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating variable:', error);
    res.status(500).json({ error: 'Failed to create variable' });
  }
});

// PUT update variable
router.put('/domains/:domainId/variables/:variableId', async (req, res) => {
  try {
    const { domainId, variableId } = req.params;
    const { variable_name, variable_value } = req.body;

    // Validation
    if (!variable_name || variable_name.trim() === '') {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    // Check if variable exists
    const existingVariable = await db.query(
      'SELECT * FROM domain_variables WHERE domain_variable_id = $1 AND domain_id = $2',
      [variableId, domainId]
    );

    if (existingVariable.rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Check for duplicate variable name (excluding current variable)
    const duplicateVariable = await db.query(
      'SELECT * FROM domain_variables WHERE domain_id = $1 AND variable_name = $2 AND domain_variable_id != $3',
      [domainId, variable_name, variableId]
    );

    if (duplicateVariable.rows.length > 0) {
      return res.status(409).json({ error: 'Variable name already exists for this domain' });
    }

    // Update variable
    const result = await db.query(
      'UPDATE domain_variables SET variable_name = $1, variable_value = $2 WHERE domain_variable_id = $3 AND domain_id = $4 RETURNING *',
      [variable_name, variable_value || null, variableId, domainId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating variable:', error);
    res.status(500).json({ error: 'Failed to update variable' });
  }
});

// DELETE variable
router.delete('/domains/:domainId/variables/:variableId', async (req, res) => {
  try {
    const { domainId, variableId } = req.params;

    // Check if variable exists
    const existingVariable = await db.query(
      'SELECT * FROM domain_variables WHERE domain_variable_id = $1 AND domain_id = $2',
      [variableId, domainId]
    );

    if (existingVariable.rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Delete variable
    await db.query(
      'DELETE FROM domain_variables WHERE domain_variable_id = $1 AND domain_id = $2',
      [variableId, domainId]
    );

    res.json({ message: 'Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting variable:', error);
    res.status(500).json({ error: 'Failed to delete variable' });
  }
});

module.exports = router;