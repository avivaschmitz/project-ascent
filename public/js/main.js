document.addEventListener('DOMContentLoaded', () => {
  // DOM elements - Mode selection
  const viewModeBtn = document.getElementById('view-mode-btn');
  const createModeBtn = document.getElementById('create-mode-btn');
  const viewSegmentsSection = document.getElementById('view-segments-section');
  const createSegmentsSection = document.getElementById('create-segments-section');

  // DOM elements - View segments
  const searchForm = document.getElementById('segment-search-form');
  const searchTypeSelect = document.getElementById('search-type');
  const domainSearchGroup = document.getElementById('domain-search-group');
  const partnerSearchGroup = document.getElementById('partner-search-group');
  const domainNameInput = document.getElementById('domain-name');
  const partnerIdInput = document.getElementById('partner-id');
  const resultsSection = document.getElementById('results-section');
  const segmentsContainer = document.getElementById('segments-container');
  const resultCount = document.getElementById('result-count');

  // DOM elements - Create segments
  const templateOptionRadios = document.getElementsByName('template-option');
  const existingTemplateFlow = document.getElementById('existing-template-flow');
  const newTemplateFlow = document.getElementById('new-template-flow');
  const templateDropdown = document.getElementById('existing-template');
  const segmentNameInput = document.getElementById('segment-name');
  const domainDropdown = document.getElementById('domain-id');
  const newDomainDropdown = document.getElementById('new-domain-id');
  const segmentVariablesContainer = document.getElementById('segment-variables-container');
  const newSegmentVariablesContainer = document.getElementById('new-segment-variables-container');
  const addVariableBtn = document.querySelector('.add-variable');
  const newTemplateNameInput = document.getElementById('new-template-name');
  const templateConfigurationInput = document.getElementById('template-configuration');

  // DOM elements - Selector set options
  const selectorSetOptionRadios = document.getElementsByName('selector-set-option');
  const existingSelectorSetDiv = document.getElementById('existing-selector-set');
  const newSelectorSetDiv = document.getElementById('new-selector-set');
  const selectorSetDropdown = document.getElementById('existing-selector-set-dropdown');
  const selectorSetNameInput = document.getElementById('selector-set-name');
  const selectorsContainer = document.getElementById('selectors-container');
  const addSelectorBtn = document.querySelector('.add-selector');

  // DOM elements - Form submission
  const createSegmentBtn = document.getElementById('create-segment-btn');
  const cancelCreateBtn = document.getElementById('cancel-create-btn');

  // DOM elements - Messages
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  // Templates
  const segmentTemplate = document.getElementById('segment-card-template');
  const selectorTemplate = document.getElementById('selector-template');
  const variableRowTemplate = document.getElementById('variable-row-template');

  // Function to toggle segment card expand/collapse
  function toggleSegmentCard(event) {
    const header = event.currentTarget;
    const card = header.closest('.segment-card');
    const body = card.querySelector('.segment-body');
    const expandIcon = header.querySelector('.expand-icon');

    // Toggle the collapsed class
    card.classList.toggle('collapsed');

    // Update the expand icon
    if (card.classList.contains('collapsed')) {
      expandIcon.textContent = '▶';
      body.style.display = 'none';
    } else {
      expandIcon.textContent = '▼';
      body.style.display = 'flex';
    }
  }

  // Initialize mode selection
  viewModeBtn.addEventListener('click', () => {
    viewModeBtn.classList.add('active');
    createModeBtn.classList.remove('active');
    viewSegmentsSection.classList.remove('hidden');
    createSegmentsSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
  });

  createModeBtn.addEventListener('click', () => {
    createModeBtn.classList.add('active');
    viewModeBtn.classList.remove('active');
    createSegmentsSection.classList.remove('hidden');
    viewSegmentsSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');

    // Load domains and templates for the create flow
    loadDomains();
    loadTemplates();
    loadSelectorSets();
  });

  // Toggle search input fields based on selected search type
  searchTypeSelect.addEventListener('change', () => {
    const searchType = searchTypeSelect.value;

    if (searchType === 'domain') {
      domainSearchGroup.classList.remove('hidden');
      partnerSearchGroup.classList.add('hidden');
      domainNameInput.setAttribute('required', '');
      partnerIdInput.removeAttribute('required');
    } else {
      domainSearchGroup.classList.add('hidden');
      partnerSearchGroup.classList.remove('hidden');
      domainNameInput.removeAttribute('required');
      partnerIdInput.setAttribute('required', '');
    }
  });

  // Toggle template flow based on selection
  templateOptionRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const selectedOption = document.querySelector('input[name="template-option"]:checked').value;

      if (selectedOption === 'existing') {
        existingTemplateFlow.classList.remove('hidden');
        newTemplateFlow.classList.add('hidden');
      } else {
        existingTemplateFlow.classList.add('hidden');
        newTemplateFlow.classList.remove('hidden');
      }
    });
  });

  // Toggle selector set options based on selection
  selectorSetOptionRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const selectedOption = document.querySelector('input[name="selector-set-option"]:checked').value;

      if (selectedOption === 'existing') {
        existingSelectorSetDiv.classList.remove('hidden');
        newSelectorSetDiv.classList.add('hidden');
      } else {
        existingSelectorSetDiv.classList.add('hidden');
        newSelectorSetDiv.classList.remove('hidden');
      }
    });
  });

  // Add variable row
  document.querySelectorAll('.add-variable').forEach(btn => {
    btn.addEventListener('click', () => {
      const variablesContainer = btn.closest('.form-group').querySelector('.segment-variables');
      const newRow = document.importNode(variableRowTemplate.content, true);

      // Add event listener to the remove button
      newRow.querySelector('.remove-variable').addEventListener('click', (e) => {
        e.target.closest('.variable-row').remove();
      });

      variablesContainer.appendChild(newRow);
    });
  });

  // Add event listeners to initial remove variable buttons
  document.querySelectorAll('.remove-variable').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.variable-row').remove();
    });
  });

  // Add selector
  addSelectorBtn.addEventListener('click', () => {
    const selectorsDiv = selectorsContainer.querySelector('.selectors');
    const newSelector = document.importNode(selectorTemplate.content, true);

    // Add event listener to the remove button
    newSelector.querySelector('.remove-selector').addEventListener('click', (e) => {
      e.target.closest('.selector-item').remove();
    });

    selectorsDiv.appendChild(newSelector);
  });

  // Add event listeners to initial remove selector buttons
  document.querySelectorAll('.remove-selector').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.selector-item').remove();
    });
  });

  // Cancel button
  cancelCreateBtn.addEventListener('click', () => {
    // Reset form fields and switch to view mode
    resetCreateForm();
    viewModeBtn.click();
  });

  // Load domains for dropdowns
  async function loadDomains() {
    try {
      showLoading(true);

      const response = await fetch('/api/domains');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const domains = await response.json();

      // Clear existing options except the default
      while (domainDropdown.options.length > 1) {
        domainDropdown.remove(1);
      }

      while (newDomainDropdown.options.length > 1) {
        newDomainDropdown.remove(1);
      }

      // Add domain options
      domains.forEach(domain => {
        const option = new Option(domain.domain_name, domain.domain_id);
        const option2 = new Option(domain.domain_name, domain.domain_id);
        domainDropdown.add(option);
        newDomainDropdown.add(option2);
      });

      showLoading(false);
    } catch (error) {
      showLoading(false);
      showError(`Error loading domains: ${error.message}`);
    }
  }

  // Load templates for dropdown
  async function loadTemplates() {
    try {
      showLoading(true);

      const response = await fetch('/api/segment-templates');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const templates = await response.json();

      // Clear existing options except the default
      while (templateDropdown.options.length > 1) {
        templateDropdown.remove(1);
      }

      // Add template options
      templates.forEach(template => {
        const option = new Option(template.segment_template_name, template.segment_template_id);
        // Store full template data as a data attribute (serialized)
        option.dataset.template = JSON.stringify(template);
        templateDropdown.add(option);
      });

      // Add change event listener to show template details when selected
      templateDropdown.addEventListener('change', showTemplateDetails);

      showLoading(false);
    } catch (error) {
      showLoading(false);
      showError(`Error loading templates: ${error.message}`);
    }
  }

  // Show template details when a template is selected
  async function showTemplateDetails() {
    const templatePreview = document.getElementById('template-preview');
    const templateValue = templateDropdown.value;

    if (!templateValue) {
      templatePreview.classList.add('hidden');
      return;
    }

    try {
      // Get template data from the data attribute
      const selectedOption = templateDropdown.options[templateDropdown.selectedIndex];
      const templateData = JSON.parse(selectedOption.dataset.template);

      // Show the template preview section
      templatePreview.classList.remove('hidden');

      // Populate template info
      const templateInfo = templatePreview.querySelector('.segment-template-info');
      let configurationDisplay = 'None';

      if (templateData.configuration) {
        configurationDisplay = formatConfiguration(templateData.configuration);
      }

      templateInfo.innerHTML = `
        <div class="template-property">
          <span class="property-label">Name:</span>
          <span class="property-value"><strong>${templateData.segment_template_name}</strong></span>
        </div>
        <div class="template-property">
          <span class="property-label">Template ID:</span>
          <span class="property-value">${templateData.segment_template_id}</span>
        </div>
        <div class="template-property">
          <span class="property-label">Selector Set ID:</span>
          <span class="property-value">${templateData.selector_set_id}</span>
        </div>
        <div class="template-property">
          <span class="property-label">Configuration:</span>
        </div>
        <pre class="configuration-data">${configurationDisplay}</pre>
      `;

      // Get selector set details
      const selectorSetHeader = templatePreview.querySelector('.selector-set-header');
      selectorSetHeader.innerHTML = `
        <strong>${templateData.set_name}</strong><br>
        <span class="text-light">Selector Set ID: ${templateData.selector_set_id}</span>
      `;

      // Fetch selectors for this selector set
      await loadSelectorsForTemplatePreview(templateData.selector_set_id);

    } catch (error) {
      console.error('Error showing template details:', error);
      showError(`Error loading template details: ${error.message}`);
    }
  }

  // Load selectors for the template preview
  async function loadSelectorsForTemplatePreview(selectorSetId) {
    try {
      showLoading(true);

      const response = await fetch(`/api/selectors?selector_set_id=${selectorSetId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const selectors = await response.json();
      const selectorsList = document.querySelector('#template-preview .selectors-list');

      // Clear existing selectors
      selectorsList.innerHTML = '';

      // Check if there are selectors
      if (selectors.length === 0) {
        selectorsList.innerHTML = '<div class="empty-message">No selectors defined</div>';
      } else {
        selectors.forEach(selector => {
          const selectorCard = document.createElement('div');
          selectorCard.className = 'selector-card';

          // Create match criteria display
          let criteriaItems = 'None';
          if (selector.match_criteria && Object.keys(selector.match_criteria).length > 0) {
            criteriaItems = JSON.stringify(selector.match_criteria, null, 2);
          }

          // Create payload display
          let payloadDisplay = 'None';
          if (selector.payload && Object.keys(selector.payload).length > 0) {
            payloadDisplay = formatPayload(selector.payload);
          }

          selectorCard.innerHTML = `
            <div class="selector-header">
              <div class="selector-title">Selector ID: ${selector.selector_id}</div>
              <div class="priority-badge">Priority: ${selector.priority}</div>
            </div>
            <div class="match-criteria">
              <h5>Match Criteria</h5>
              <pre class="criteria-list">${criteriaItems}</pre>
            </div>
            <div class="payload">
              <h5>Payload</h5>
              <pre class="payload-list">${payloadDisplay}</pre>
            </div>
          `;

          selectorsList.appendChild(selectorCard);
        });
      }

      showLoading(false);
    } catch (error) {
      showLoading(false);
      console.error('Error loading selectors:', error);

      // Show a simpler error within the component
      const selectorsList = document.querySelector('#template-preview .selectors-list');
      selectorsList.innerHTML = `<div class="error-message">Error loading selectors: ${error.message}</div>`;
    }
  }

  // Load selector sets for dropdown
  async function loadSelectorSets() {
    try {
      showLoading(true);

      const response = await fetch('/api/selector-sets');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const selectorSets = await response.json();

      // Clear existing options except the default
      while (selectorSetDropdown.options.length > 1) {
        selectorSetDropdown.remove(1);
      }

      // Add selector set options
      selectorSets.forEach(set => {
        const option = new Option(set.set_name, set.selector_set_id);
        selectorSetDropdown.add(option);
      });

      showLoading(false);
    } catch (error) {
      showLoading(false);
      showError(`Error loading selector sets: ${error.message}`);
    }
  }

  // Create segment button handler
  createSegmentBtn.addEventListener('click', async () => {
    // Validate form based on the selected flow
    const templateOption = document.querySelector('input[name="template-option"]:checked').value;

    try {
      if (templateOption === 'existing') {
        // Validate existing template flow
        if (!templateDropdown.value) {
          throw new Error('Please select a template');
        }

        if (!segmentNameInput.value.trim()) {
          throw new Error('Please enter a segment name');
        }

        if (!domainDropdown.value) {
          throw new Error('Please select a domain');
        }

        // Collect segment variables
        const segmentVariables = [];
        const variableRows = segmentVariablesContainer.querySelectorAll('.variable-row');

        variableRows.forEach(row => {
          const nameInput = row.querySelector('.variable-name');
          const valueInput = row.querySelector('.variable-value');

          if (nameInput.value.trim() && valueInput.value.trim()) {
            segmentVariables.push({
              name: nameInput.value.trim(),
              value: valueInput.value.trim()
            });
          }
        });

        // Create segment with existing template
        await createSegmentWithExistingTemplate(
          segmentNameInput.value.trim(),
          domainDropdown.value,
          templateDropdown.value,
          segmentVariables
        );
      } else {
        // Validate new template flow
        if (!newTemplateNameInput.value.trim()) {
          throw new Error('Please enter a template name');
        }

        if (!templateConfigurationInput.value.trim()) {
          throw new Error('Please enter template configuration');
        }

        // Validate JSON format of configuration
        try {
          JSON.parse(templateConfigurationInput.value.trim());
        } catch (e) {
          throw new Error('Template configuration must be valid JSON');
        }

        const selectorSetOption = document.querySelector('input[name="selector-set-option"]:checked').value;

        if (selectorSetOption === 'existing' && !selectorSetDropdown.value) {
          throw new Error('Please select a selector set');
        }

        if (selectorSetOption === 'new' && !selectorSetNameInput.value.trim()) {
          throw new Error('Please enter a selector set name');
        }

        if (!document.getElementById('new-segment-name').value.trim()) {
          throw new Error('Please enter a segment name');
        }

        if (!newDomainDropdown.value) {
          throw new Error('Please select a domain');
        }

        // If creating new selector set, validate selectors
        const newSelectors = [];

        if (selectorSetOption === 'new') {
          const selectorItems = newSelectorSetDiv.querySelectorAll('.selector-item');

          selectorItems.forEach(item => {
            const priorityInput = item.querySelector('.selector-priority');
            const matchCriteriaInput = item.querySelector('.match-criteria');
            const payloadInput = item.querySelector('.payload');

            if (matchCriteriaInput.value.trim() && payloadInput.value.trim()) {
              try {
                // Validate JSON format
                const matchCriteria = JSON.parse(matchCriteriaInput.value.trim());
                const payload = JSON.parse(payloadInput.value.trim());

                newSelectors.push({
                  priority: priorityInput.value,
                  match_criteria: matchCriteriaInput.value.trim(),
                  payload: payloadInput.value.trim()
                });
              } catch (e) {
                throw new Error('Match criteria and payload must be valid JSON');
              }
            }
          });
        }

        // Collect segment variables
        const segmentVariables = [];
        const variableRows = newSegmentVariablesContainer.querySelectorAll('.variable-row');

        variableRows.forEach(row => {
          const nameInput = row.querySelector('.variable-name');
          const valueInput = row.querySelector('.variable-value');

          if (nameInput.value.trim() && valueInput.value.trim()) {
            segmentVariables.push({
              name: nameInput.value.trim(),
              value: valueInput.value.trim()
            });
          }
        });

        // Create segment with new template
        await createSegmentWithNewTemplate(
          document.getElementById('new-segment-name').value.trim(),
          newDomainDropdown.value,
          newTemplateNameInput.value.trim(),
          templateConfigurationInput.value.trim(),
          selectorSetOption,
          selectorSetDropdown.value,
          selectorSetOption === 'new' ? {
            name: selectorSetNameInput.value.trim(),
            selectors: newSelectors
          } : null,
          segmentVariables
        );
      }
    } catch (error) {
      showError(error.message);
    }
  });

  // Create segment with existing template
  async function createSegmentWithExistingTemplate(segmentName, domainId, templateId, variables) {
    try {
      showLoading(true);

      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          segment_name: segmentName,
          domain_id: domainId,
          segment_template_id: templateId,
          segment_variables: variables
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create segment');
      }

      showLoading(false);
      showSuccess(`Segment created successfully with ID: ${data.segment_id}`);
      resetCreateForm();
    } catch (error) {
      showLoading(false);
      showError(`Error creating segment: ${error.message}`);
    }
  }

  // Create segment with new template
  async function createSegmentWithNewTemplate(
    segmentName,
    domainId,
    templateName,
    configuration,
    selectorSetOption,
    selectorSetId,
    newSelectorSet,
    variables
  ) {
    try {
      showLoading(true);

      const response = await fetch('/api/segments/with-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          segment_name: segmentName,
          domain_id: domainId,
          template_name: templateName,
          configuration: configuration,
          selector_set_option: selectorSetOption,
          selector_set_id: selectorSetId,
          new_selector_set: newSelectorSet,
          segment_variables: variables
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create segment with template');
      }

      showLoading(false);
      showSuccess(`Segment created successfully with ID: ${data.segment_id}`);
      resetCreateForm();
    } catch (error) {
      showLoading(false);
      showError(`Error creating segment: ${error.message}`);
    }
  }

  // Event listener for the search form
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const searchType = searchTypeSelect.value;
    let searchParams = {};

    if (searchType === 'domain') {
      const domainName = domainNameInput.value.trim();
      if (!domainName) {
        showError('Please enter a domain name to search for.');
        return;
      }
      searchParams.domain_name = domainName;
    } else {
      const partnerId = partnerIdInput.value.trim();
      if (!partnerId) {
        showError('Please enter a partner ID to search for.');
        return;
      }
      searchParams.partner_id = partnerId;
    }

    // Clear previous results and error messages
    segmentsContainer.innerHTML = '';
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    resultsSection.classList.add('hidden');

    // Show loading indicator
    showLoading(true);

    try {
      // Fetch segments from the API
      const segments = await fetchSegments(searchParams);

      // Hide loading indicator
      showLoading(false);

      // Display the segments
      displaySegments(segments);
    } catch (error) {
      showLoading(false);
      showError(`Error fetching segments: ${error.message}`);
    }
  });

  /**
   * Fetch segments from the API
   * @param {Object} searchParams - The search parameters (domain_name or partner_id)
   * @returns {Promise<Array>} - An array of segment objects
   */
  async function fetchSegments(searchParams) {
    // Build query string
    const queryParams = new URLSearchParams();
    if (searchParams.domain_name) {
      queryParams.append('domain_name', searchParams.domain_name);
    } else if (searchParams.partner_id) {
      queryParams.append('partner_id', searchParams.partner_id);
    }

    const response = await fetch(`/api/segments?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Display the segments in the UI
   * @param {Array} segments - An array of segment objects
   */
  function displaySegments(segments) {
    if (segments.length === 0) {
      showError('No segments found for the given search criteria.');
      return;
    }

    // Update the result count
    resultCount.textContent = `(${segments.length})`;
    resultsSection.classList.remove('hidden');

    // Log segments data to console for debugging
    console.log('Segments data:', segments);

    // Save raw data to window for later use
    window.rawSegmentsData = JSON.stringify(segments, null, 2);

    // Create and append segment cards
    segments.forEach(segment => {
      const segmentCard = createSegmentCard(segment);
      segmentsContainer.appendChild(segmentCard);
    });
  }

  /**
   * Format configuration object for display
   * @param {Object|string} configuration - The configuration object or string to format
   * @returns {string} - Formatted HTML string
   */
  function formatConfiguration(configuration) {
    if (!configuration || (typeof configuration === 'object' && Object.keys(configuration).length === 0)) {
      return 'None';
    }

    try {
      // If it's a string but looks like JSON, try to parse it for better display
      if (typeof configuration === 'string') {
        // Try to parse it as JSON if it looks like an object
        if ((configuration.startsWith('{') && configuration.endsWith('}')) ||
            (configuration.startsWith('[') && configuration.endsWith(']'))) {
          try {
            configuration = JSON.parse(configuration);
          } catch (e) {
            // If parsing fails, just use the raw string
            return configuration;
          }
        } else {
          // Not JSON-like, return as is
          return configuration;
        }
      }

      // Pretty print the JSON with indentation
      return JSON.stringify(configuration, null, 2)
        // Escape HTML characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Highlight keys
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
        // Highlight boolean values
        .replace(/"true"/g, '"<span class="boolean-true">true</span>"')
        .replace(/"false"/g, '"<span class="boolean-false">false</span>"');
    } catch (error) {
      console.error('Error formatting configuration:', error);
      return String(configuration);
    }
  }

  /**
   * Format payload object for display
   * @param {Object} payload - The payload object to format
   * @returns {string} - Formatted HTML string
   */
  function formatPayload(payload) {
    if (!payload || Object.keys(payload).length === 0) {
      return 'None';
    }

    try {
      // Pretty print the JSON with indentation
      return JSON.stringify(payload, null, 2)
        // Escape HTML characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Highlight keys
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
        // Highlight boolean values
        .replace(/"true"/g, '"<span class="boolean-true">true</span>"')
        .replace(/"false"/g, '"<span class="boolean-false">false</span>"');
    } catch (error) {
      console.error('Error formatting payload:', error);
      return 'Error displaying payload';
    }
  }

  /**
   * Create a segment card from the template
   * @param {Object} segment - A segment object
   * @returns {HTMLElement} - The segment card element
   */
  function createSegmentCard(segment) {
    const card = document.importNode(segmentTemplate.content, true).children[0];

    // Add collapsed class by default
    card.classList.add('collapsed');

    // Set segment name and ID with expand/collapse icon
    const segmentHeader = card.querySelector('.segment-header');
    const segmentName = card.querySelector('.segment-name');
    segmentName.textContent = segment.name;

    // Add expand/collapse icon
    const expandIcon = document.createElement('span');
    expandIcon.className = 'expand-icon';
    expandIcon.textContent = '▶';
    segmentName.prepend(expandIcon);

    card.querySelector('.segment-id').textContent = `ID: ${segment.id}`;

    // Make the header clickable to expand/collapse
    segmentHeader.addEventListener('click', toggleSegmentCard);
    segmentHeader.style.cursor = 'pointer';

    // Initially hide the body
    const segmentBody = card.querySelector('.segment-body');
    segmentBody.style.display = 'none';

    // Set segment template info
    const templateInfo = card.querySelector('.segment-template-info');

    // Get the configuration value and debug it
    console.log("Template data:", segment.segment_template);
    let configurationDisplay = 'None';
    if (segment.segment_template.configuration !== undefined && segment.segment_template.configuration !== null) {
      console.log("Configuration found:", segment.segment_template.configuration);
      configurationDisplay = formatConfiguration(segment.segment_template.configuration);
    } else {
      console.log("No configuration found in template");
    }

    templateInfo.innerHTML = `
      <div class="template-property">
        <span class="property-label">Name:</span>
        <span class="property-value"><strong>${segment.segment_template.name}</strong></span>
      </div>
      <div class="template-property">
        <span class="property-label">Template ID:</span>
        <span class="property-value">${segment.segment_template.id}</span>
      </div>
      <div class="template-property">
        <span class="property-label">Selector Set ID:</span>
        <span class="property-value">${segment.selector_set.id}</span>
      </div>
      <div class="template-property">
        <span class="property-label">Configuration:</span>
      </div>
      <pre class="configuration-data">${configurationDisplay}</pre>
    `;

    // Set segment variables info
    const variablesInfo = card.querySelector('.segment-variables-info');

    // Add a heading if there are variables
    if (Object.keys(segment.segment_variables).length > 0) {
      const heading = document.createElement('div');
      heading.className = 'variable-item variables-heading';
      heading.innerHTML = `
        <span class="variable-name"><strong>Name</strong></span>
        <span class="variable-value"><strong>Value</strong></span>
      `;
      variablesInfo.appendChild(heading);
    } else {
      variablesInfo.innerHTML = '<div class="empty-message">No variables defined</div>';
    }

    // Add the variables
    for (const [key, value] of Object.entries(segment.segment_variables)) {
      const variableItem = document.createElement('div');
      variableItem.className = 'variable-item';

      let valueDisplay;
      if (typeof value === 'boolean') {
        valueDisplay = `<span class="boolean-${value}">${value}</span>`;
      } else {
        valueDisplay = `<span>${value}</span>`;
      }

      variableItem.innerHTML = `
        <span class="variable-name">${key}</span>
        <span class="variable-value">${valueDisplay}</span>
      `;

      variablesInfo.appendChild(variableItem);
    }

    // Set selector set info
    const selectorSetHeader = card.querySelector('.selector-set-header');
    selectorSetHeader.innerHTML = `
      <strong>${segment.selector_set.name}</strong><br>
      <span class="text-light">Selector Set ID: ${segment.selector_set.id}</span>
    `;

    // Add selectors
    const selectorsList = card.querySelector('.selectors-list');

    // Check if there are selectors
    if (segment.selector_set.selectors.length === 0) {
      selectorsList.innerHTML = '<div class="empty-message">No selectors defined</div>';
    } else {
      segment.selector_set.selectors.forEach(selector => {
        const selectorCard = document.createElement('div');
        selectorCard.className = 'selector-card';

        // Create match criteria display
        let criteriaItems = 'None';
        if (selector.match_criteria && Object.keys(selector.match_criteria).length > 0) {
          criteriaItems = JSON.stringify(selector.match_criteria, null, 2);
        }

        // Create payload display using the formatPayload function
        let payloadDisplay = 'None';
        if (selector.payload && Object.keys(selector.payload).length > 0) {
          payloadDisplay = formatPayload(selector.payload);
        }

        selectorCard.innerHTML = `
          <div class="selector-header">
            <div class="selector-title">Selector ID: ${selector.id}</div>
            <div class="priority-badge">Priority: ${selector.priority}</div>
          </div>
          <div class="match-criteria">
            <h5>Match Criteria</h5>
            <pre class="criteria-list">${criteriaItems}</pre>
          </div>
          <div class="payload">
            <h5>Payload</h5>
            <pre class="payload-list">${payloadDisplay}</pre>
          </div>
        `;

        selectorsList.appendChild(selectorCard);
      });
    }

    return card;
  }

  /**
   * Reset the create segment form
   */
  function resetCreateForm() {
    // Reset template option
    document.querySelector('input[name="template-option"][value="existing"]').checked = true;
    existingTemplateFlow.classList.remove('hidden');
    newTemplateFlow.classList.add('hidden');

    // Reset fields in existing template flow
    templateDropdown.value = '';
    segmentNameInput.value = '';
    domainDropdown.value = '';

    // Clear all but the first variable row in existing flow
    const existingVarRows = segmentVariablesContainer.querySelectorAll('.variable-row');
    existingVarRows.forEach((row, index) => {
      if (index > 0) {
        row.remove();
      } else {
        row.querySelector('.variable-name').value = '';
        row.querySelector('.variable-value').value = '';
      }
    });

    // Reset new template flow
    newTemplateNameInput.value = '';
    templateConfigurationInput.value = '';
    document.querySelector('input[name="selector-set-option"][value="existing"]').checked = true;
    existingSelectorSetDiv.classList.remove('hidden');
    newSelectorSetDiv.classList.add('hidden');
    selectorSetDropdown.value = '';
    selectorSetNameInput.value = '';

    // Clear all but the first selector in new flow
    const selectorItems = selectorsContainer.querySelectorAll('.selector-item');
    selectorItems.forEach((item, index) => {
      if (index > 0) {
        item.remove();
      } else {
        item.querySelector('.selector-priority').value = '1';
        item.querySelector('.match-criteria').value = '';
        item.querySelector('.payload').value = '';
      }
    });

    // Reset new segment details
    document.getElementById('new-segment-name').value = '';
    newDomainDropdown.value = '';

    // Clear all but the first variable row in new flow
    const newVarRows = newSegmentVariablesContainer.querySelectorAll('.variable-row');
    newVarRows.forEach((row, index) => {
      if (index > 0) {
        row.remove();
      } else {
        row.querySelector('.variable-name').value = '';
        row.querySelector('.variable-value').value = '';
      }
    });
  }

  /**
   * Show loading indicator
   * @param {boolean} show - Whether to show or hide the loading indicator
   */
  function showLoading(show) {
    if (show) {
      loadingIndicator.classList.remove('hidden');
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * Show an error message
   * @param {string} message - The error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
  }

  /**
   * Show a success message
   * @param {string} message - The success message to display
   */
  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
  }
});