const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for segments API
const mockSegments = {
  // Sample data for partner_id: "partner123"
  "partner123": [
    {
      id: "segment1",
      name: "Partner123 Desktop US Segment",
      segment_template: {
        id: "desktop_template",
        name: "Standard Desktop Template"
      },
      segment_variables: {
        partner_id: "partner123",
        pub_id: "pub456",
        flex_forcekey_logic: true,
        force_allow_conversion_tracking: false
      },
      selector_set: {
        id: "selector_set_1",
        name: "US Desktop Settings",
        selectors: [
          {
            id: "sel1",
            match_criteria: {
              device: "desktop",
              geo: "US"
            },
            priority: 1,
            payload: {
              dark_mode: false,
              show_ads: true
            }
          },
          {
            id: "sel2",
            match_criteria: {
              device: "desktop",
              geo: "CA"
            },
            priority: 2,
            payload: {
              dark_mode: true,
              show_ads: true
            }
          }
        ]
      }
    },
    {
      id: "segment2",
      name: "Partner123 Mobile EU Segment",
      segment_template: {
        id: "mobile_template",
        name: "Standard Mobile Template"
      },
      segment_variables: {
        partner_id: "partner123",
        pub_id: "pub789",
        flex_forcekey_logic: false,
        force_allow_conversion_tracking: true
      },
      selector_set: {
        id: "selector_set_2",
        name: "EU Mobile Settings",
        selectors: [
          {
            id: "sel3",
            match_criteria: {
              device: "mobile",
              geo: "EU"
            },
            priority: 1,
            payload: {
              dark_mode: true,
              show_ads: false
            }
          }
        ]
      }
    }
  ],

  // Sample data for site: "example.com"
  "example.com": [
    {
      id: "segment3",
      name: "Example.com All Devices Segment",
      segment_template: {
        id: "all_devices_template",
        name: "Universal Template"
      },
      segment_variables: {
        partner_id: "partner456",
        pub_id: "pub101",
        flex_forcekey_logic: true,
        force_allow_conversion_tracking: true
      },
      selector_set: {
        id: "selector_set_3",
        name: "Global Settings",
        selectors: [
          {
            id: "sel4",
            match_criteria: {
              device: "any",
              geo: "any"
            },
            priority: 1,
            payload: {
              dark_mode: false,
              show_ads: true
            }
          },
          {
            id: "sel5",
            match_criteria: {
              device: "mobile",
              geo: "any"
            },
            priority: 2,
            payload: {
              mobile_optimized: true
            }
          }
        ]
      }
    }
  ]
};

// API endpoint to get segments by partner_id or site
app.get('/api/segments', (req, res) => {
  const { partner_id, site } = req.query;

  if (partner_id && mockSegments[partner_id]) {
    return res.json(mockSegments[partner_id]);
  }

  if (site && mockSegments[site]) {
    return res.json(mockSegments[site]);
  }

  res.json([]);
});

// Catch-all route to serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});