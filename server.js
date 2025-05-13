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
    console.log(`Searching for domain: ${domain_name}`);

    // Get domain_id for the given domain_name
    const domainResult = await db.query(
      'SELECT domain_id FROM domains WHERE domain_name = $1',
      [domain_name]
    );

    if (domainResult.rows.length === 0) {
      console.log(`No domain found with name: ${domain_name}`);
      return res.json([]);
    }

    const domainId = domainResult.rows[0].domain_id;
    console.log(`Found domain_id: ${domainId}`);

    // Get segments for the domain
    const segmentsResult = await db.query(
      `SELECT
         s.segment_id,
         s.segment_name,
         st.segment_template_id,
         st.segment_template_name,
         st.configuration,
         st.selector_set_id
       FROM segments s
       JOIN segment_templates st ON s.segment_template_id = st.segment_template_id
       WHERE s.domain_id = $1`,
      [domainId]
    );

    if (segmentsResult.rows.length === 0) {
      console.log(`No segments found for domain_id: ${domainId}`);
      return res.json([]);
    }

    console.log(`Found ${segmentsResult.rows.length} segments`);

    // Get all segment IDs
    const segmentIds = segmentsResult.rows.map(segment => segment.segment_id);
    console.log(`Segment IDs: ${segmentIds.join(', ')}`);

    // Get all selector_set_ids
    const selectorSetIds = segmentsResult.rows
      .map(segment => segment.selector_set_id)
      .filter(id => id != null);

    console.log(`Selector Set IDs: ${selectorSetIds.join(', ')}`);

    // Get all related data in parallel
    const [variablesResult, selectorSetsResult, selectorsResult] = await Promise.all([
      db.query(
        'SELECT * FROM segment_variables WHERE segment_id = ANY($1)',
        [segmentIds]
      ),
      db.query(
        'SELECT * FROM selector_sets WHERE selector_set_id = ANY($1)',
        [selectorSetIds]
      ),
      db.query(
        'SELECT * FROM selectors WHERE selector_set_id = ANY($1) ORDER BY priority',
        [selectorSetIds]
      )
    ]);

    console.log(`Found ${variablesResult.rows.length} variables, ${selectorSetsResult.rows.length} selector sets, ${selectorsResult.rows.length} selectors`);

    // Format the data into the expected structure
    const formattedSegments = formatSegmentData(
      segmentsResult.rows,
      variablesResult.rows,
      selectorSetsResult.rows,
      selectorsResult.rows
    );

    // Ensure all objects are properly serialized
    const sanitizedResponse = JSON.parse(JSON.stringify(formattedSegments));

    // Log what we're sending to the client
    console.log('Sending to client:', JSON.stringify(sanitizedResponse, null, 2));

    res.json(sanitizedResponse);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      error: 'An error occurred while fetching segments',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to format database results into the expected segment format
function formatSegmentData(segmentRows, variableRows, selectorSetRows, selectorRows) {
  const segments = [];

  for (const segmentRow of segmentRows) {
    try {
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

      if (!selectorSet) {
        console.warn(`No selector set found for segment_template_id ${segmentRow.segment_template_id}, selector_set_id ${segmentRow.selector_set_id}`);
        // Create a segment with empty selector set
        segments.push({
          id: segmentRow.segment_id,
          name: segmentRow.segment_name,
          segment_template: {
            id: segmentRow.segment_template_id,
            name: segmentRow.segment_template_name
          },
          segment_variables: segmentVariables,
          selector_set: {
            id: segmentRow.selector_set_id,
            name: "Unknown Selector Set",
            selectors: []
          }
        });
        continue;
      }

      // Filter selectors for this selector set
      const selectors = selectorRows
        .filter(selector => selector.selector_set_id === selectorSet.selector_set_id)
        .map(selector => {
          // Parse the JSON stored in match_criteria and payload
          let matchCriteria = {};
          let payload = {};

          try {
            // Make sure we properly handle the match_criteria
            if (selector.match_criteria) {
              if (typeof selector.match_criteria === 'string') {
                matchCriteria = JSON.parse(selector.match_criteria);
              } else if (typeof selector.match_criteria === 'object') {
                matchCriteria = selector.match_criteria;
              }
            }
          } catch (e) {
            console.error(`Error parsing match_criteria for selector ${selector.selector_id}: ${e.message}`);
            console.error(`Raw value: ${selector.match_criteria}`);
          }

          try {
            // Make sure we properly handle the payload
            if (selector.payload) {
              // Log raw payload for debugging
              console.log(`Raw payload for selector ${selector.selector_id}: ${JSON.stringify(selector.payload)}`);

              if (typeof selector.payload === 'string') {
                try {
                  payload = JSON.parse(selector.payload);
                  console.log(`Parsed payload: ${JSON.stringify(payload)}`);
                } catch (e) {
                  console.error(`JSON parse error: ${e.message}`);
                  // If parsing fails, return the raw string as fallback
                  payload = { raw: selector.payload };
                }
              } else if (typeof selector.payload === 'object') {
                payload = selector.payload;
              }
            }
          } catch (e) {
            console.error(`Error handling payload for selector ${selector.selector_id}: ${e.message}`);
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
    } catch (err) {
      console.error(`Error formatting segment ${segmentRow.segment_id}:`, err);
    }
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