// Get selectors by selector_set_id
app.get('/api/selectors', async (req, res) => {
  const { selector_set_id } = req.query;

  if (!selector_set_id) {
    return res.status(400).json({ error: 'selector_set_id is required' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM selectors WHERE selector_set_id = $1 ORDER BY priority',
      [selector_set_id]
    );

    // Process the selectors to parse JSON fields
    const processedSelectors = result.rows.map(selector => {
      // Parse match_criteria
      let matchCriteria = {};
      try {
        if (selector.match_criteria) {
          if (typeof selector.match_criteria === 'string') {
            matchCriteria = JSON.parse(selector.match_criteria);
          } else {
            matchCriteria = selector.match_criteria;
          }
        }
      } catch (e) {
        console.error(`Error parsing match_criteria for selector ${selector.selector_id}: ${e.message}`);
      }

      // Parse payload
      let payload = {};
      try {
        if (selector.payload) {
          if (typeof selector.payload === 'string') {
            payload = JSON.parse(selector.payload);
          } else {
            payload = selector.payload;
          }
        }
      } catch (e) {
        console.error(`Error parsing payload for selector ${selector.selector_id}: ${e.message}`);
      }

      return {
        selector_id: selector.selector_id,
        match_criteria: matchCriteria,
        payload: payload,
        selector_set_id: selector.selector_set_id,
        priority: selector.priority
      };
    });

    res.json(processedSelectors);
  } catch (error) {
    console.error('Error fetching selectors:', error);
    res.status(500).json({ error: 'An error occurred while fetching selectors' });
  }
});const express = require('express');
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

// Get all domains
app.get('/api/domains', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM domains ORDER BY domain_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'An error occurred while fetching domains' });
  }
});

// Get all segment templates
app.get('/api/segment-templates', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT st.*, ss.set_name
      FROM segment_templates st
      JOIN selector_sets ss ON st.selector_set_id = ss.selector_set_id
      ORDER BY st.segment_template_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching segment templates:', error);
    res.status(500).json({ error: 'An error occurred while fetching segment templates' });
  }
});

// Get all selector sets
app.get('/api/selector-sets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM selector_sets ORDER BY set_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching selector sets:', error);
    res.status(500).json({ error: 'An error occurred while fetching selector sets' });
  }
});

// API endpoint to get segments by domain_name or partner_id
app.get('/api/segments', async (req, res) => {
  const { domain_name, partner_id } = req.query;

  if (!domain_name && !partner_id) {
    return res.status(400).json({ error: 'Either domain_name or partner_id is required' });
  }

  try {
    let segments = [];

    // Search by domain_name
    if (domain_name) {
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
      segments = await getSegmentsByDomainId(domainId);
    }
    // Search by partner_id
    else if (partner_id) {
      console.log(`Searching for partner_id: ${partner_id}`);

      // Find segments that have a segment_variable with variable_name "partner_id" and matching variable_value
      const segmentResult = await db.query(
        `SELECT s.segment_id
         FROM segments s
         JOIN segment_variables sv ON s.segment_id = sv.segment_id
         WHERE sv.variable_name = 'partner_id' AND sv.variable_value = $1`,
        [partner_id]
      );

      if (segmentResult.rows.length === 0) {
        console.log(`No segments found with partner_id: ${partner_id}`);
        return res.json([]);
      }

      // Get all segments
      const segmentIds = segmentResult.rows.map(row => row.segment_id);
      console.log(`Found segment IDs: ${segmentIds.join(', ')}`);

      segments = await getSegmentsByIds(segmentIds);
    }

    if (segments.length === 0) {
      console.log(`No segments found for the query`);
      return res.json([]);
    }

    console.log(`Found ${segments.length} segments`);

    // Return the segments
    res.json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      error: 'An error occurred while fetching segments',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new segment with existing template
app.post('/api/segments', async (req, res) => {
  const { segment_name, domain_id, segment_template_id, segment_variables } = req.body;

  // Validate required fields
  if (!segment_name || !domain_id || !segment_template_id) {
    return res.status(400).json({ error: 'segment_name, domain_id, and segment_template_id are required' });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    // Create the segment
    const segmentResult = await db.query(
      'INSERT INTO segments (segment_name, domain_id, segment_template_id) VALUES ($1, $2, $3) RETURNING segment_id',
      [segment_name, domain_id, segment_template_id]
    );

    const segmentId = segmentResult.rows[0].segment_id;

    // Add segment variables if they exist
    if (segment_variables && segment_variables.length > 0) {
      for (const variable of segment_variables) {
        if (variable.name && variable.value) {
          await db.query(
            'INSERT INTO segment_variables (variable_name, variable_value, segment_id) VALUES ($1, $2, $3)',
            [variable.name, variable.value, segmentId]
          );
        }
      }
    }

    // Commit the transaction
    await db.query('COMMIT');

    // Return the created segment
    res.status(201).json({
      message: 'Segment created successfully',
      segment_id: segmentId
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    console.error('Error creating segment:', error);
    res.status(500).json({
      error: 'An error occurred while creating the segment',
      details: error.message
    });
  }
});

// Create a new segment with a new template
app.post('/api/segments/with-template', async (req, res) => {
  const {
    segment_name,
    domain_id,
    segment_variables,
    template_name,
    configuration,
    selector_set_option,
    selector_set_id,
    new_selector_set
  } = req.body;

  // Validate required fields
  if (!segment_name || !domain_id || !template_name) {
    return res.status(400).json({
      error: 'segment_name, domain_id, and template_name are required'
    });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    let selectedSelectorSetId;

    // Handle selector set (use existing or create new)
    if (selector_set_option === 'existing') {
      if (!selector_set_id) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'selector_set_id is required when using an existing selector set' });
      }
      selectedSelectorSetId = selector_set_id;
    } else {
      // Create new selector set
      if (!new_selector_set || !new_selector_set.name) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Selector set name is required when creating a new selector set' });
      }

      // Insert the new selector set
      const selectorSetResult = await db.query(
        'INSERT INTO selector_sets (set_name) VALUES ($1) RETURNING selector_set_id',
        [new_selector_set.name]
      );

      selectedSelectorSetId = selectorSetResult.rows[0].selector_set_id;

      // Create selectors if provided
      if (new_selector_set.selectors && new_selector_set.selectors.length > 0) {
        for (const selector of new_selector_set.selectors) {
          // Validate selector data
          if (!selector.match_criteria || !selector.payload) {
            continue; // Skip invalid selectors
          }

          // Insert the selector
          await db.query(
            'INSERT INTO selectors (match_criteria, payload, selector_set_id, priority) VALUES ($1, $2, $3, $4)',
            [
              selector.match_criteria,
              selector.payload,
              selectedSelectorSetId,
              selector.priority || 1
            ]
          );
        }
      }
    }

    // Create the segment template
    const templateResult = await db.query(
      'INSERT INTO segment_templates (segment_template_name, configuration, selector_set_id) VALUES ($1, $2, $3) RETURNING segment_template_id',
      [template_name, configuration, selectedSelectorSetId]
    );

    const templateId = templateResult.rows[0].segment_template_id;

    // Create the segment
    const segmentResult = await db.query(
      'INSERT INTO segments (segment_name, domain_id, segment_template_id) VALUES ($1, $2, $3) RETURNING segment_id',
      [segment_name, domain_id, templateId]
    );

    const segmentId = segmentResult.rows[0].segment_id;

    // Add segment variables if they exist
    if (segment_variables && segment_variables.length > 0) {
      for (const variable of segment_variables) {
        if (variable.name && variable.value) {
          await db.query(
            'INSERT INTO segment_variables (variable_name, variable_value, segment_id) VALUES ($1, $2, $3)',
            [variable.name, variable.value, segmentId]
          );
        }
      }
    }

    // Commit the transaction
    await db.query('COMMIT');

    // Return the created segment
    res.status(201).json({
      message: 'Segment and template created successfully',
      segment_id: segmentId,
      template_id: templateId,
      selector_set_id: selectedSelectorSetId
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    console.error('Error creating segment with template:', error);
    res.status(500).json({
      error: 'An error occurred while creating the segment with template',
      details: error.message
    });
  }
});

// Helper function to get segments by domain ID
async function getSegmentsByDomainId(domainId) {
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
    return [];
  }

  // Log the configuration data to verify it's present
  segmentsResult.rows.forEach(row => {
    console.log(`Segment ${row.segment_id} configuration:`, row.configuration);
  });

  return await processSegmentResults(segmentsResult.rows);
}

// Helper function to get segments by segment IDs
async function getSegmentsByIds(segmentIds) {
  // Get segments by IDs
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
     WHERE s.segment_id = ANY($1)`,
    [segmentIds]
  );

  if (segmentsResult.rows.length === 0) {
    return [];
  }

  return await processSegmentResults(segmentsResult.rows);
}

// Helper function to process segment results and get related data
async function processSegmentResults(segmentRows) {
  // Get all segment IDs
  const segmentIds = segmentRows.map(segment => segment.segment_id);
  console.log(`Segment IDs: ${segmentIds.join(', ')}`);

  // Get all selector_set_ids
  const selectorSetIds = segmentRows
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
  return formatSegmentData(
    segmentRows,
    variablesResult.rows,
    selectorSetsResult.rows,
    selectorsResult.rows
  );
}

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
            name: segmentRow.segment_template_name,
            configuration: segmentRow.configuration  // Include configuration
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

      // Log the configuration before adding it to the segment
      console.log(`Adding configuration for segment ${segmentRow.segment_id}:`, segmentRow.configuration);

      // Construct the segment object
      const segment = {
        id: segmentRow.segment_id,
        name: segmentRow.segment_name,
        segment_template: {
          id: segmentRow.segment_template_id,
          name: segmentRow.segment_template_name,
          configuration: segmentRow.configuration  // Explicitly include configuration
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