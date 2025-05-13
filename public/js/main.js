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
  }document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const searchForm = document.getElementById('segment-search-form');
  const domainNameInput = document.getElementById('domain-name');
  const resultsSection = document.getElementById('results-section');
  const segmentsContainer = document.getElementById('segments-container');
  const resultCount = document.getElementById('result-count');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const segmentTemplate = document.getElementById('segment-card-template');

  // Event listener for the search form
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const domainName = domainNameInput.value.trim();

    if (!domainName) {
      showError('Please enter a domain name to search for.');
      return;
    }

    // Clear previous results and error messages
    segmentsContainer.innerHTML = '';
    errorMessage.classList.add('hidden');
    resultsSection.classList.add('hidden');

    // Show loading indicator
    loadingIndicator.classList.remove('hidden');

    try {
      // Fetch segments from the API
      const segments = await fetchSegments(domainName);

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
   * @param {string} domainName - The domain name to search for
   * @returns {Promise<Array>} - An array of segment objects
   */
  async function fetchSegments(domainName) {
    const response = await fetch(`/api/segments?domain_name=${encodeURIComponent(domainName)}`);

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

    // Set segment name and ID
    card.querySelector('.segment-name').textContent = segment.name;
    card.querySelector('.segment-id').textContent = `ID: ${segment.id}`;

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
        const criteriaItems = Object.entries(selector.match_criteria)
          .map(([key, value]) => `<span>${key}: <strong>${value}</strong></span>`)
          .join(', ');

        // Create payload display
        const payloadItems = Object.entries(selector.payload)
          .map(([key, value]) => {
            if (typeof value === 'boolean') {
              return `<span>${key}: <strong class="boolean-${value}">${value}</strong></span>`;
            }
            return `<span>${key}: <strong>${value}</strong></span>`;
          })
          .join(', ');

        selectorCard.innerHTML = `
          <div class="selector-header">
            <div class="selector-title">Selector ID: ${selector.id}</div>
            <div class="priority-badge">Priority: ${selector.priority}</div>
          </div>
          <div class="match-criteria">
            <h5>Match Criteria</h5>
            <div class="criteria-list">${criteriaItems || 'None'}</div>
          </div>
          <div class="payload">
            <h5>Payload</h5>
            <div class="payload-list">${payloadItems || 'None'}</div>
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