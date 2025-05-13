document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const searchForm = document.getElementById('segment-search-form');
  const searchTypeSelect = document.getElementById('search-type');
  const domainSearchGroup = document.getElementById('domain-search-group');
  const partnerSearchGroup = document.getElementById('partner-search-group');
  const domainNameInput = document.getElementById('domain-name');
  const partnerIdInput = document.getElementById('partner-id');
  const resultsSection = document.getElementById('results-section');
  const segmentsContainer = document.getElementById('segments-container');
  const resultCount = document.getElementById('result-count');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const segmentTemplate = document.getElementById('segment-card-template');

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
    resultsSection.classList.add('hidden');

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');

    try {
      // Fetch segments from the API
      const segments = await fetchSegments(searchParams);

      // Hide loading indicator
      loadingIndicator.classList.add('hidden');

      // Display the segments
      displaySegments(segments);
    } catch (error) {
      loadingIndicator.classList.add('hidden');
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
      showError('No segments found for the given domain name.');
      return;
    }

    // Update the result count
    resultCount.textContent = `(${segments.length})`;
    resultsSection.classList.remove('hidden');

    // Save raw data to window for later use
    window.rawSegmentsData = JSON.stringify(segments, null, 2);

    // Create and append segment cards
    segments.forEach(segment => {
      const segmentCard = createSegmentCard(segment);
      segmentsContainer.appendChild(segmentCard);
    });
  }

  /**
   * Check for scrollable content and add appropriate styling
   */
  function checkScrollableContent() {
    // We're no longer adding scrollable classes as we've changed the approach
    // This function is now empty but kept for compatibility
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
    templateInfo.innerHTML = `
      <strong>${segment.segment_template.name}</strong><br>
      <span class="text-light">Template ID: ${segment.segment_template.id}</span>
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
   * Show an error message
   * @param {string} message - The error message to display
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }
});