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

// ==================== DOMAIN ALIASES ENDPOINTS ====================

// GET all aliases for a domain
router.get('/domains/:domainId/aliases', async (req, res) => {
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
      'SELECT * FROM domain_aliases WHERE domain_id = $1 ORDER BY alias_id ASC',
      [domainId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domain aliases:', error);
    res.status(500).json({ error: 'Failed to fetch domain aliases' });
  }
});

// GET single alias
router.get('/domains/:domainId/aliases/:aliasId', async (req, res) => {
  try {
    const { domainId, aliasId } = req.params;

    const result = await db.query(
      'SELECT * FROM domain_aliases WHERE alias_id = $1 AND domain_id = $2',
      [aliasId, domainId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alias not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching alias:', error);
    res.status(500).json({ error: 'Failed to fetch alias' });
  }
});

// POST create new alias for a domain
router.post('/domains/:domainId/aliases', async (req, res) => {
  try {
    const { domainId } = req.params;
    const { domain_alias } = req.body;

    // Validation
    if (!domain_alias || domain_alias.trim() === '') {
      return res.status(400).json({ error: 'Alias is required' });
    }

    // Check if domain exists
    const domainCheck = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [domainId]
    );

    if (domainCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Check for duplicate alias within the same domain
    const existingAlias = await db.query(
      'SELECT * FROM domain_aliases WHERE domain_id = $1 AND domain_alias = $2',
      [domainId, domain_alias]
    );

    if (existingAlias.rows.length > 0) {
      return res.status(409).json({ error: 'Alias already exists for this domain' });
    }

    // Insert new alias
    const result = await db.query(
      'INSERT INTO domain_aliases (domain_id, domain_alias) VALUES ($1, $2) RETURNING *',
      [domainId, domain_alias]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating alias:', error);
    res.status(500).json({ error: 'Failed to create alias' });
  }
});

// PUT update alias
router.put('/domains/:domainId/aliases/:aliasId', async (req, res) => {
  try {
    const { domainId, aliasId } = req.params;
    const { domain_alias } = req.body;

    // Validation
    if (!domain_alias || domain_alias.trim() === '') {
      return res.status(400).json({ error: 'Alias is required' });
    }

    // Check if alias exists
    const existingAlias = await db.query(
      'SELECT * FROM domain_aliases WHERE alias_id = $1 AND domain_id = $2',
      [aliasId, domainId]
    );

    if (existingAlias.rows.length === 0) {
      return res.status(404).json({ error: 'Alias not found' });
    }

    // Check for duplicate alias (excluding current alias)
    const duplicateAlias = await db.query(
      'SELECT * FROM domain_aliases WHERE domain_id = $1 AND domain_alias = $2 AND alias_id != $3',
      [domainId, domain_alias, aliasId]
    );

    if (duplicateAlias.rows.length > 0) {
      return res.status(409).json({ error: 'Alias already exists for this domain' });
    }

    // Update alias
    const result = await db.query(
      'UPDATE domain_aliases SET domain_alias = $1 WHERE alias_id = $2 AND domain_id = $3 RETURNING *',
      [domain_alias, aliasId, domainId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alias:', error);
    res.status(500).json({ error: 'Failed to update alias' });
  }
});

// DELETE alias
router.delete('/domains/:domainId/aliases/:aliasId', async (req, res) => {
  try {
    const { domainId, aliasId } = req.params;

    // Check if alias exists
    const existingAlias = await db.query(
      'SELECT * FROM domain_aliases WHERE alias_id = $1 AND domain_id = $2',
      [aliasId, domainId]
    );

    if (existingAlias.rows.length === 0) {
      return res.status(404).json({ error: 'Alias not found' });
    }

    // Delete alias
    await db.query(
      'DELETE FROM domain_aliases WHERE alias_id = $1 AND domain_id = $2',
      [aliasId, domainId]
    );

    res.json({ message: 'Alias deleted successfully' });
  } catch (error) {
    console.error('Error deleting alias:', error);
    res.status(500).json({ error: 'Failed to delete alias' });
  }
});

// ==================== DOMAIN VARIABLES ENDPOINTS ====================

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

// ==================== SEGMENTS ENDPOINTS ====================

// GET all segments
router.get('/segments', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM segments ORDER BY segment_id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// GET single segment by ID
router.get('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM segments WHERE segment_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

// POST create new segment
router.post('/segments', async (req, res) => {
  try {
    const { domain_id, segment_name } = req.body;

    // Validation
    if (!segment_name || segment_name.trim() === '') {
      return res.status(400).json({ error: 'Segment name is required' });
    }

    if (!domain_id) {
      return res.status(400).json({ error: 'Domain ID is required' });
    }

    // Check if domain exists
    const domainCheck = await db.query(
      'SELECT * FROM domains WHERE domain_id = $1',
      [domain_id]
    );

    if (domainCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Check for duplicate segment name within the same domain
    const existingSegment = await db.query(
      'SELECT * FROM segments WHERE domain_id = $1 AND segment_name = $2',
      [domain_id, segment_name]
    );

    if (existingSegment.rows.length > 0) {
      return res.status(409).json({ error: 'Segment name already exists for this domain' });
    }

    // Insert new segment
    const result = await db.query(
      'INSERT INTO segments (domain_id, segment_name) VALUES ($1, $2) RETURNING *',
      [domain_id, segment_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

// PUT update segment
router.put('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { segment_name } = req.body;

    // Validation
    if (!segment_name || segment_name.trim() === '') {
      return res.status(400).json({ error: 'Segment name is required' });
    }

    // Check if segment exists
    const existingSegment = await db.query(
      'SELECT * FROM segments WHERE segment_id = $1',
      [id]
    );

    if (existingSegment.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const domainId = existingSegment.rows[0].domain_id;

    // Check for duplicate segment name (excluding current segment)
    const duplicateSegment = await db.query(
      'SELECT * FROM segments WHERE domain_id = $1 AND segment_name = $2 AND segment_id != $3',
      [domainId, segment_name, id]
    );

    if (duplicateSegment.rows.length > 0) {
      return res.status(409).json({ error: 'Segment name already exists for this domain' });
    }

    // Update segment
    const result = await db.query(
      'UPDATE segments SET segment_name = $1 WHERE segment_id = $2 RETURNING *',
      [segment_name, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ error: 'Failed to update segment' });
  }
});

// DELETE segment
router.delete('/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if segment exists
    const existingSegment = await db.query(
      'SELECT * FROM segments WHERE segment_id = $1',
      [id]
    );

    if (existingSegment.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Delete segment
    await db.query('DELETE FROM segments WHERE segment_id = $1', [id]);

    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

// ==================== SEGMENT VARIABLES ENDPOINTS ====================

// GET all variables for a segment
router.get('/segments/:segmentId/variables', async (req, res) => {
  try {
    const { segmentId } = req.params;

    // Check if segment exists
    const segmentCheck = await db.query(
      'SELECT * FROM segments WHERE segment_id = $1',
      [segmentId]
    );

    if (segmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const result = await db.query(
      'SELECT * FROM segment_variables WHERE segment_id = $1 ORDER BY segment_variable_id ASC',
      [segmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching segment variables:', error);
    res.status(500).json({ error: 'Failed to fetch segment variables' });
  }
});

// GET single segment variable
router.get('/segments/:segmentId/variables/:variableId', async (req, res) => {
  try {
    const { segmentId, variableId } = req.params;

    const result = await db.query(
      'SELECT * FROM segment_variables WHERE segment_variable_id = $1 AND segment_id = $2',
      [variableId, segmentId]
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

// POST create new variable for a segment
router.post('/segments/:segmentId/variables', async (req, res) => {
  try {
    const { segmentId } = req.params;
    const { segment_variable_name, segment_variable_value } = req.body;

    // Validation
    if (!segment_variable_name || segment_variable_name.trim() === '') {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    // Check if segment exists
    const segmentCheck = await db.query(
      'SELECT * FROM segments WHERE segment_id = $1',
      [segmentId]
    );

    if (segmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Check for duplicate variable name within the same segment
    const existingVariable = await db.query(
      'SELECT * FROM segment_variables WHERE segment_id = $1 AND segment_variable_name = $2',
      [segmentId, segment_variable_name]
    );

    if (existingVariable.rows.length > 0) {
      return res.status(409).json({ error: 'Variable name already exists for this segment' });
    }

    // Insert new variable
    const result = await db.query(
      'INSERT INTO segment_variables (segment_variable_name, segment_variable_value, segment_id) VALUES ($1, $2, $3) RETURNING *',
      [segment_variable_name, segment_variable_value || null, segmentId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating variable:', error);
    res.status(500).json({ error: 'Failed to create variable' });
  }
});

// PUT update segment variable
router.put('/segments/:segmentId/variables/:variableId', async (req, res) => {
  try {
    const { segmentId, variableId } = req.params;
    const { segment_variable_name, segment_variable_value } = req.body;

    // Validation
    if (!segment_variable_name || segment_variable_name.trim() === '') {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    // Check if variable exists
    const existingVariable = await db.query(
      'SELECT * FROM segment_variables WHERE segment_variable_id = $1 AND segment_id = $2',
      [variableId, segmentId]
    );

    if (existingVariable.rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Check for duplicate variable name (excluding current variable)
    const duplicateVariable = await db.query(
      'SELECT * FROM segment_variables WHERE segment_id = $1 AND segment_variable_name = $2 AND segment_variable_id != $3',
      [segmentId, segment_variable_name, variableId]
    );

    if (duplicateVariable.rows.length > 0) {
      return res.status(409).json({ error: 'Variable name already exists for this segment' });
    }

    // Update variable
    const result = await db.query(
      'UPDATE segment_variables SET segment_variable_name = $1, segment_variable_value = $2 WHERE segment_variable_id = $3 AND segment_id = $4 RETURNING *',
      [segment_variable_name, segment_variable_value || null, variableId, segmentId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating variable:', error);
    res.status(500).json({ error: 'Failed to update variable' });
  }
});

// DELETE segment variable
router.delete('/segments/:segmentId/variables/:variableId', async (req, res) => {
  try {
    const { segmentId, variableId } = req.params;

    // Check if variable exists
    const existingVariable = await db.query(
      'SELECT * FROM segment_variables WHERE segment_variable_id = $1 AND segment_id = $2',
      [variableId, segmentId]
    );

    if (existingVariable.rows.length === 0) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Delete variable
    await db.query(
      'DELETE FROM segment_variables WHERE segment_variable_id = $1 AND segment_id = $2',
      [variableId, segmentId]
    );

    res.json({ message: 'Variable deleted successfully' });
  } catch (error) {
    console.error('Error deleting variable:', error);
    res.status(500).json({ error: 'Failed to delete variable' });
  }
});

module.exports = router;