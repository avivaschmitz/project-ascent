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
    // Create segments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS segments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        partner_id VARCHAR(50),
        site VARCHAR(100),
        segment_template_id VARCHAR(50) NOT NULL,
        segment_template_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create segment_variables table
    await db.query(`
      CREATE TABLE IF NOT EXISTS segment_variables (
        id SERIAL PRIMARY KEY,
        segment_id VARCHAR(50) REFERENCES segments(id),
        key VARCHAR(50) NOT NULL,
        value TEXT,
        value_type VARCHAR(20) NOT NULL
      )
    `);

    // Create selector_sets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS selector_sets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        segment_id VARCHAR(50) REFERENCES segments(id)
      )
    `);

    // Create selectors table
    await db.query(`
      CREATE TABLE IF NOT EXISTS selectors (
        id VARCHAR(50) PRIMARY KEY,
        selector_set_id VARCHAR(50) REFERENCES selector_sets(id),
        priority INTEGER NOT NULL
      )
    `);

    // Create match_criteria table
    await db.query(`
      CREATE TABLE IF NOT EXISTS match_criteria (
        id SERIAL PRIMARY KEY,
        selector_id VARCHAR(50) REFERENCES selectors(id),
        key VARCHAR(50) NOT NULL,
        value TEXT NOT NULL
      )
    `);

    // Create payloads table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payloads (
        id SERIAL PRIMARY KEY,
        selector_id VARCHAR(50) REFERENCES selectors(id),
        key VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        value_type VARCHAR(20) NOT NULL
      )
    `);

    // If no data exists, insert the mock data
    const segmentCount = await db.query('SELECT COUNT(*) FROM segments');
    if (segmentCount.rows[0].count === '0') {
      await insertMockData();
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Insert mock data for testing
async function insertMockData() {
  try {
    // Transaction to ensure data consistency
    await db.query('BEGIN');

    // Insert Partner123 Desktop US Segment
    await db.query(`
      INSERT INTO segments (id, name, partner_id, segment_template_id, segment_template_name)
      VALUES ('segment1', 'Partner123 Desktop US Segment', 'partner123', 'desktop_template', 'Standard Desktop Template')
    `);

    // Insert segment variables
    await db.query(`
      INSERT INTO segment_variables (segment_id, key, value, value_type)
      VALUES
        ('segment1', 'partner_id', 'partner123', 'string'),
        ('segment1', 'pub_id', 'pub456', 'string'),
        ('segment1', 'flex_forcekey_logic', 'true', 'boolean'),
        ('segment1', 'force_allow_conversion_tracking', 'false', 'boolean')
    `);

    // Insert selector set
    await db.query(`
      INSERT INTO selector_sets (id, name, segment_id)
      VALUES ('selector_set_1', 'US Desktop Settings', 'segment1')
    `);

    // Insert selectors
    await db.query(`
      INSERT INTO selectors (id, selector_set_id, priority)
      VALUES ('sel1', 'selector_set_1', 1), ('sel2', 'selector_set_1', 2)
    `);

    // Insert match criteria
    await db.query(`
      INSERT INTO match_criteria (selector_id, key, value)
      VALUES
        ('sel1', 'device', 'desktop'),
        ('sel1', 'geo', 'US'),
        ('sel2', 'device', 'desktop'),
        ('sel2', 'geo', 'CA')
    `);

    // Insert payloads
    await db.query(`
      INSERT INTO payloads (selector_id, key, value, value_type)
      VALUES
        ('sel1', 'dark_mode', 'false', 'boolean'),
        ('sel1', 'show_ads', 'true', 'boolean'),
        ('sel2', 'dark_mode', 'true', 'boolean'),
        ('sel2', 'show_ads', 'true', 'boolean')
    `);

    // Insert Partner123 Mobile EU Segment
    await db.query(`
      INSERT INTO segments (id, name, partner_id, segment_template_id, segment_template_name)
      VALUES ('segment2', 'Partner123 Mobile EU Segment', 'partner123', 'mobile_template', 'Standard Mobile Template')
    `);

    // Insert segment variables
    await db.query(`
      INSERT INTO segment_variables (segment_id, key, value, value_type)
      VALUES
        ('segment2', 'partner_id', 'partner123', 'string'),
        ('segment2', 'pub_id', 'pub789', 'string'),
        ('segment2', 'flex_forcekey_logic', 'false', 'boolean'),
        ('segment2', 'force_allow_conversion_tracking', 'true', 'boolean')
    `);

    // Insert selector set
    await db.query(`
      INSERT INTO selector_sets (id, name, segment_id)
      VALUES ('selector_set_2', 'EU Mobile Settings', 'segment2')
    `);

    // Insert selectors
    await db.query(`
      INSERT INTO selectors (id, selector_set_id, priority)
      VALUES ('sel3', 'selector_set_2', 1)
    `);

    // Insert match criteria
    await db.query(`
      INSERT INTO match_criteria (selector_id, key, value)
      VALUES
        ('sel3', 'device', 'mobile'),
        ('sel3', 'geo', 'EU')
    `);

    // Insert payloads
    await db.query(`
      INSERT INTO payloads (selector_id, key, value, value_type)
      VALUES
        ('sel3', 'dark_mode', 'true', 'boolean'),
        ('sel3', 'show_ads', 'false', 'boolean')
    `);

    // Insert Example.com segment
    await db.query(`
      INSERT INTO segments (id, name, site, segment_template_id, segment_template_name)
      VALUES ('segment3', 'Example.com All Devices Segment', 'example.com', 'all_devices_template', 'Universal Template')
    `);

    // Insert segment variables
    await db.query(`
      INSERT INTO segment_variables (segment_id, key, value, value_type)
      VALUES
        ('segment3', 'partner_id', 'partner456', 'string'),
        ('segment3', 'pub_id', 'pub101', 'string'),
        ('segment3', 'flex_forcekey_logic', 'true', 'boolean'),
        ('segment3', 'force_allow_conversion_tracking', 'true', 'boolean')
    `);

    // Insert selector set
    await db.query(`
      INSERT INTO selector_sets (id, name, segment_id)
      VALUES ('selector_set_3', 'Global Settings', 'segment3')
    `);

    // Insert selectors
    await db.query(`
      INSERT INTO selectors (id, selector_set_id, priority)
      VALUES ('sel4', 'selector_set_3', 1), ('sel5', 'selector_set_3', 2)
    `);

    // Insert match criteria
    await db.query(`
      INSERT INTO match_criteria (selector_id, key, value)
      VALUES
        ('sel4', 'device', 'any'),
        ('sel4', 'geo', 'any'),
        ('sel5', 'device', 'mobile'),
        ('sel5', 'geo', 'any')
    `);

    // Insert payloads
    await db.query(`
      INSERT INTO payloads (selector_id, key, value, value_type)
      VALUES
        ('sel4', 'dark_mode', 'false', 'boolean'),
        ('sel4', 'show_ads', 'true', 'boolean'),
        ('sel5', 'mobile_optimized', 'true', 'boolean')
    `);

    await db.query('COMMIT');
    console.log('Mock data inserted successfully');
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error inserting mock data:', error);
  }
}

// Initialize the database when the server starts
initializeDatabase();

// Helper function to format database results into the expected segment format
function formatSegmentData(segmentRows, variableRows, selectorSetRows, selectorRows, criteriaRows, payloadRows) {
  const segments = [];

  for (const segmentRow of segmentRows) {
    // Filter variables for this segment
    const segmentVariables = variableRows
      .filter(variable => variable.segment_id === segmentRow.id)
      .reduce((acc, variable) => {
        // Convert value to appropriate type
        let value = variable.value;
        if (variable.value_type === 'boolean') {
          value = value === 'true';
        } else if (variable.value_type === 'number') {
          value = parseFloat(value);
        }
        acc[variable.key] = value;
        return acc;
      }, {});

    // Find the selector set for this segment
    const selectorSet = selectorSetRows.find(set => set.segment_id === segmentRow.id);

    if (!selectorSet) continue;

    // Filter selectors for this selector set
    const selectors = selectorRows
      .filter(selector => selector.selector_set_id === selectorSet.id)
      .map(selector => {
        // Filter match criteria for this selector
        const matchCriteria = criteriaRows
          .filter(criteria => criteria.selector_id === selector.id)
          .reduce((acc, criteria) => {
            acc[criteria.key] = criteria.value;
            return acc;
          }, {});

        // Filter payloads for this selector
        const payload = payloadRows
          .filter(p => p.selector_id === selector.id)
          .reduce((acc, p) => {
            // Convert value to appropriate type
            let value = p.value;
            if (p.value_type === 'boolean') {
              value = value === 'true';
            } else if (p.value_type === 'number') {
              value = parseFloat(value);
            }
            acc[p.key] = value;
            return acc;
          }, {});

        return {
          id: selector.id,
          match_criteria: matchCriteria,
          priority: selector.priority,
          payload
        };
      });

    // Construct the segment object
    const segment = {
      id: segmentRow.id,
      name: segmentRow.name,
      segment_template: {
        id: segmentRow.segment_template_id,
        name: segmentRow.segment_template_name
      },
      segment_variables: segmentVariables,
      selector_set: {
        id: selectorSet.id,
        name: selectorSet.name,
        selectors
      }
    };

    segments.push(segment);
  }

  return segments;
}

// API endpoint to get segments by partner_id or site
app.get('/api/segments', async (req, res) => {
  const { partner_id, site } = req.query;

  try {
    let segmentRows = [];

    if (partner_id) {
      segmentRows = (await db.query('SELECT * FROM segments WHERE partner_id = $1', [partner_id])).rows;
    } else if (site) {
      segmentRows = (await db.query('SELECT * FROM segments WHERE site = $1', [site])).rows;
    } else {
      return res.json([]);
    }

    if (segmentRows.length === 0) {
      return res.json([]);
    }

    // Get all segment IDs
    const segmentIds = segmentRows.map(segment => segment.id);

    // Get all related data in parallel
    const [variableResult, selectorSetResult, selectorResult, criteriaResult, payloadResult] = await Promise.all([
      db.query('SELECT * FROM segment_variables WHERE segment_id = ANY($1)', [segmentIds]),
      db.query('SELECT * FROM selector_sets WHERE segment_id = ANY($1)', [segmentIds]),
      db.query(
        'SELECT s.* FROM selectors s JOIN selector_sets ss ON s.selector_set_id = ss.id WHERE ss.segment_id = ANY($1)',
        [segmentIds]
      ),
      db.query(
        'SELECT mc.* FROM match_criteria mc JOIN selectors s ON mc.selector_id = s.id JOIN selector_sets ss ON s.selector_set_id = ss.id WHERE ss.segment_id = ANY($1)',
        [segmentIds]
      ),
      db.query(
        'SELECT p.* FROM payloads p JOIN selectors s ON p.selector_id = s.id JOIN selector_sets ss ON s.selector_set_id = ss.id WHERE ss.segment_id = ANY($1)',
        [segmentIds]
      )
    ]);

    // Format the data
    const formattedSegments = formatSegmentData(
      segmentRows,
      variableResult.rows,
      selectorSetResult.rows,
      selectorResult.rows,
      criteriaResult.rows,
      payloadResult.rows
    );

    res.json(formattedSegments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'An error occurred while fetching segments' });
  }
});

// Catch-all route to serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});