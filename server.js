const express = require('express');
const path = require('path');
require('dotenv').config(); // Load environment variables
const db = require('./db'); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database tables if they don't exist (run once on startup)
async function initializeDatabase() {
  try {
    // Create domains table
    await db.query(`
      CREATE TABLE IF NOT EXISTS domains (
        domain_id SERIAL PRIMARY KEY,
        domain_name VARCHAR(255) NOT NULL
      )
    `);

    // Create selector_sets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS selector_sets (
        selector_set_id SERIAL PRIMARY KEY,
        set_name VARCHAR(255) NOT NULL
      )
    `);

    // Create selectors table
    await db.query(`
      CREATE TABLE IF NOT EXISTS selectors (
        selector_id SERIAL PRIMARY KEY,
        match_criteria VARCHAR(255) NOT NULL,
        payload VARCHAR(255),
        selector_set_id INTEGER NOT NULL,
        priority INTEGER,
        FOREIGN KEY (selector_set_id) REFERENCES selector_sets(selector_set_id)
      )
    `);

    // Create segment_templates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS segment_templates (
        segment_template_id SERIAL PRIMARY KEY,
        segment_template_name VARCHAR(255) NOT NULL,
        configuration VARCHAR(255),
        selector_set_id INTEGER NOT NULL,
        FOREIGN KEY (selector_set_id) REFERENCES selector_sets(selector_set_id)
      )
    `);

    // Create segments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS segments (
        segment_id SERIAL PRIMARY KEY,
        segment_name VARCHAR(255) NOT NULL,
        segment_template_id INTEGER NOT NULL,
        domain_id INTEGER NOT NULL,
        FOREIGN KEY (segment_template_id) REFERENCES segment_templates(segment_template_id),
        FOREIGN KEY (domain_id) REFERENCES domains(domain_id)
      )
    `);

    // Create segment_variables table
    await db.query(`
      CREATE TABLE IF NOT EXISTS segment_variables (
        variable_id SERIAL PRIMARY KEY,
        variable_name VARCHAR(255) NOT NULL,
        variable_value VARCHAR(255),
        segment_id INTEGER NOT NULL,
        FOREIGN KEY (segment_id) REFERENCES segments(segment_id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize the database when the server starts
initializeDatabase();

// API endpoint to get segments by domain_name
app.get('/api/segments', async (req, res) => {
  const { domain_name } = req.query;

  if (!domain_name) {
    return res.status(400).json({ error: 'domain_name is required' });
  }

  try {
    // Get domain_id for the given domain_name
    const domainResult = await db.query(
      'SELECT domain_id FROM domains WHERE domain_name = $1',
      [domain_name]
    );

    if (domainResult.rows.length === 0) {
      return res.json([]);
    }

    const domainId = domainResult.rows[0].domain_id;

    // Get segments for the domain
    const segmentsResult = await db.query(
      `SELECT s.segment_id, s.segment_name, st.segment_template_id, st.segment_template_name, st.configuration
       FROM segments s
       JOIN segment_templates st ON s.segment_template_id = st.segment_template_id
       WHERE s.domain_id = $1`,
      [domainId]
    );

    if (segmentsResult.rows.length === 0) {
      return res.json([]);
    }

    // Get all segment IDs
    const segmentIds = segmentsResult.rows.map(segment => segment.segment_id);

    // Get all related data in parallel
    const [variablesResult, selectorSetsResult] = await Promise.all([
      db.query(
        'SELECT * FROM segment_variables WHERE segment_id = ANY($1)',
        [segmentIds]
      ),
      db.query(
        `SELECT ss.*, st.segment_id
         FROM selector_sets ss
         JOIN segment_templates st ON ss.selector_set_id = st.selector_set_id
         WHERE st.segment_template_id IN (
           SELECT segment_template_id FROM segments WHERE segment_id = ANY($1)
         )`,
        [segmentIds]
      )
    ]);

    // Get all selector_set_ids
    const selectorSetIds = selectorSetsResult.rows.map(set => set.selector_set_id);

    // Get selectors for all selector sets
    const selectorsResult = await db.query(
      'SELECT * FROM selectors WHERE selector_set_id = ANY($1) ORDER BY priority',
      [selectorSetIds]
    );

    // Format the data into the expected structure
    const formattedSegments = formatSegmentData(
      segmentsResult.rows,
      variablesResult.rows,
      selectorSetsResult.rows,
      selectorsResult.rows
    );

    res.json(formattedSegments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'An error occurred while fetching segments' });
  }
});

// Helper function to format database results into the expected segment format
function formatSegmentData(segmentRows, variableRows, selectorSetRows, selectorRows) {
  const segments = [];

  for (const segmentRow of segmentRows) {
    // Filter variables for this segment
    const segmentVariables = variableRows
      .filter(variable => variable.segment_id === segmentRow.segment_id)
      .reduce((acc, variable) => {
        // Determine value type (basic conversion for boolean strings)
        let value = variable.variable_value;
        if (value === 'true') value = true;
        if (value === 'false') value = false;

        acc[variable.variable_name] = value;
        return acc;
      }, {});

    // Find the selector set for this segment's template
    const selectorSet = selectorSetRows.find(set =>
      set.selector_set_id === segmentRow.selector_set_id
    );

    if (!selectorSet) continue;

    // Filter selectors for this selector set
    const selectors = selectorRows
      .filter(selector => selector.selector_set_id === selectorSet.selector_set_id)
      .map(selector => {
        // Parse the JSON stored in match_criteria and payload
        let matchCriteria = {};
        let payload = {};

        try {
          matchCriteria = JSON.parse(selector.match_criteria);
        } catch (e) {
          console.error('Error parsing match_criteria:', e);
        }

        try {
          payload = JSON.parse(selector.payload);
        } catch (e) {
          console.error('Error parsing payload:', e);
        }

        return {
          id: selector.selector_id,
          match_criteria: matchCriteria,
          priority: selector.priority,
          payload
        };
      });

    // Construct the segment object
    const segment = {
      id: segmentRow.segment_id,
      name: segmentRow.segment_name,
      segment_template: {
        id: segmentRow.segment_template_id,
        name: segmentRow.segment_template_name
      },
      segment_variables: segmentVariables,
      selector_set: {
        id: selectorSet.selector_set_id,
        name: selectorSet.set_name,
        selectors
      }
    };

    segments.push(segment);
  }

  return segments;
}

// Catch-all route to serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});