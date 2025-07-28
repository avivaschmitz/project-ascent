function deleteVariable(segmentId, variableName) {
    if (confirm(`Are you sure you want to delete the variable "${variableName}"?`)) {
        alert(`Delete variable "${variableName}" from segment ${segmentId} (functionality to be implemented)`);
    }
}

// ===== SEGMENT CREATION FUNCTIONS =====

// Load segment creation data
async function loadSegmentCreateData() {
    try {
        const contentArea = document.querySelector('#segment-create-section .content-area');

        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading segment creation interface...</div>';

        // Fetch domains and all segments for templates
        const [domains, allSegments] = await Promise.all([
            apiCall('/api/domains'),
            getAllSegments()
        ]);

        // Generate the segment creation HTML
        let segmentCreateHTML = `
            <div class="segment-create-controls">
                <div class="form-group">
                    <label for="create-domain-select">Target Domain *</label>
                    <select id="create-domain-select" onchange="onCreateDomainChange()" required>
                        <option value="">Select target domain...</option>
        `;

        domains.forEach(domain => {
            segmentCreateHTML += `<option value="${domain.domain_id}" data-domain-name="${domain.domain_name}">${domain.domain_name}</option>`;
        });

        segmentCreateHTML += `
                    </select>
                    <small class="form-help">Choose the domain where the new segment will be created</small>
                </div>

                <div class="form-group">
                    <label for="model-segment-search">Model Segment Template *</label>
                    <div class="searchable-dropdown">
                        <input type="text"
                               id="model-segment-search"
                               placeholder="Search for a segment to use as template..."
                               onkeyup="filterModelSegments()"
                               onclick="showModelSegmentDropdown()"
                               autocomplete="off"
                               required>
                        <div id="model-segment-dropdown" class="dropdown-list" style="display: none;">
                            <!-- Segments will be populated here -->
                        </div>
                    </div>
                    <small class="form-help">Search and select an existing segment to copy as template</small>
                </div>
            </div>

            <div id="segment-creation-workspace" class="segment-creation-workspace" style="display: none;">
                <div class="workspace-header">
                    <h3>Create New Segment</h3>
                    <p>Customize your new segment based on the selected template</p>
                </div>

                <div class="two-panel-layout">
                    <div class="template-panel">
                        <div class="panel-header">
                            <h4>Template: <span id="template-segment-name">-</span></h4>
                            <p class="panel-subtitle">Original segment (read-only)</p>
                        </div>
                        <div id="template-segment-details" class="segment-details">
                            <!-- Template segment details will load here -->
                        </div>
                    </div>

                    <div class="new-segment-panel">
                        <div class="panel-header">
                            <h4>New Segment</h4>
                            <p class="panel-subtitle">Customize and save</p>
                        </div>
                        <div class="new-segment-form">
                            <div class="form-group">
                                <label for="new-segment-name">Segment Name *</label>
                                <input type="text" id="new-segment-name" placeholder="Enter name for new segment..." required>
                            </div>

                            <div class="form-group">
                                <label>Segment Variables</label>
                                <div id="new-segment-variables" class="editable-variables">
                                    <!-- Variables will be copied here for editing -->
                                </div>
                            </div>

                            <div class="form-actions">
                                <button class="btn btn-primary" onclick="createNewSegment()">Create Segment</button>
                                <button class="btn btn-secondary" onclick="resetSegmentCreation()">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        contentArea.innerHTML = segmentCreateHTML;

        // Store all segments data for filtering
        window.allSegmentsForTemplate = allSegments;

        // Initialize model segment dropdown with all segments
        populateModelSegmentDropdown(allSegments);

        console.log('Segment creation interface loaded');

    } catch (error) {
        console.error('Error loading segment creation:', error);
        const contentArea = document.querySelector('#segment-create-section .content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Segment Creation</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadSegmentCreateData()">Retry</button>
            </div>
        `;
    }
}

// Get all segments from all domains
async function getAllSegments() {
    try {
        const domains = await apiCall('/api/domains');
        let allSegments = [];

        for (const domain of domains) {
            try {
                const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domain.domain_name)}`);
                // Add domain info to each segment
                segments.forEach(segment => {
                    segment.source_domain = {
                        id: domain.domain_id,
                        name: domain.domain_name
                    };
                });
                allSegments = allSegments.concat(segments);
            } catch (error) {
                console.warn(`Could not load segments for domain ${domain.domain_name}:`, error);
            }
        }

        return allSegments;
    } catch (error) {
        console.error('Error getting all segments:', error);
        return [];
    }
}

// Populate model segment dropdown
function populateModelSegmentDropdown(segments) {
    const dropdown = document.getElementById('model-segment-dropdown');
    if (!dropdown) return;

    if (segments.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No segments available</div>';
        return;
    }

    let dropdownHTML = '';
    segments.forEach(segment => {
        const variableCount = Object.keys(segment.segment_variables || {}).length;
        const templateName = segment.segment_template?.name || 'Unknown Template';

        dropdownHTML += `
            <div class="dropdown-item" onclick="selectModelSegment(${segment.id})" data-segment-id="${segment.id}">
                <div class="dropdown-item-main">
                    <strong>${segment.name}</strong>
                    <span class="segment-domain">${segment.source_domain.name}</span>
                </div>
                <div class="dropdown-item-details">
                    <span class="template-info">${templateName}</span>
                    <span class="variable-count">${variableCount} variables</span>
                </div>
            </div>
        `;
    });

    dropdown.innerHTML = dropdownHTML;
}

// Filter model segments based on search input
function filterModelSegments() {
    const searchInput = document.getElementById('model-segment-search');
    const dropdown = document.getElementById('model-segment-dropdown');

    if (!searchInput || !dropdown || !window.allSegmentsForTemplate) return;

    const searchTerm = searchInput.value.toLowerCase();

    // Show dropdown when typing
    if (searchTerm.length > 0) {
        dropdown.style.display = 'block';
    }

    // Filter segments
    const filteredSegments = window.allSegmentsForTemplate.filter(segment => {
        return segment.name.toLowerCase().includes(searchTerm) ||
               segment.source_domain.name.toLowerCase().includes(searchTerm) ||
               (segment.segment_template?.name || '').toLowerCase().includes(searchTerm);
    });

    populateModelSegmentDropdown(filteredSegments);

    // Show "no results" if nothing matches
    if (filteredSegments.length === 0 && searchTerm.length > 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No segments match your search</div>';
    }
}

// Show model segment dropdown
function showModelSegmentDropdown() {
    const dropdown = document.getElementById('model-segment-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

// Select a model segment
async function selectModelSegment(segmentId) {
    try {
        const searchInput = document.getElementById('model-segment-search');
        const dropdown = document.getElementById('model-segment-dropdown');
        const workspace = document.getElementById('segment-creation-workspace');

        // Find the selected segment
        const selectedSegment = window.allSegmentsForTemplate.find(segment => segment.id == segmentId);
        if (!selectedSegment) {
            throw new Error('Selected segment not found');
        }

        // Update search input to show selected segment
        if (searchInput) {
            searchInput.value = `${selectedSegment.name} (${selectedSegment.source_domain.name})`;
        }

        // Hide dropdown
        if (dropdown) {
            dropdown.style.display = 'none';
        }

        // Show workspace
        if (workspace) {
            workspace.style.display = 'block';
        }

        // Store selected segment for later use
        window.selectedModelSegment = selectedSegment;

        // Populate template panel
        populateTemplatePanel(selectedSegment);

        // Populate new segment panel with editable copy
        populateNewSegmentPanel(selectedSegment);

        console.log('Selected model segment:', selectedSegment.name);

    } catch (error) {
        console.error('Error selecting model segment:', error);
        alert(`Error selecting segment: ${error.message}`);
    }
}

// Populate template panel (read-only)
function populateTemplatePanel(segment) {
    const templateNameSpan = document.getElementById('template-segment-name');
    const templateDetails = document.getElementById('template-segment-details');

    if (templateNameSpan) {
        templateNameSpan.textContent = segment.name;
    }

    if (!templateDetails) return;

    const variables = segment.segment_variables || {};
    const variableCount = Object.keys(variables).length;
    const templateName = segment.segment_template?.name || 'Unknown Template';
    const selectorCount = segment.selector_set?.selectors?.length || 0;

    let templateHTML = `
        <div class="segment-summary">
            <div class="summary-item">
                <strong>Segment ID:</strong> ${segment.id}
            </div>
            <div class="summary-item">
                <strong>Source Domain:</strong> ${segment.source_domain.name}
            </div>
            <div class="summary-item">
                <strong>Template:</strong> ${templateName}
            </div>
            <div class="summary-item">
                <strong>Variables:</strong> ${variableCount}
            </div>
            <div class="summary-item">
                <strong>Selectors:</strong> ${selectorCount}
            </div>
        </div>

        <div class="variables-section">
            <h5>Segment Variables</h5>
    `;

    if (variableCount === 0) {
        templateHTML += '<p class="no-variables">No variables defined</p>';
    } else {
        templateHTML += '<div class="variables-list">';
        Object.entries(variables).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const dataType = typeof value;

            templateHTML += `
                <div class="variable-item readonly">
                    <div class="variable-header">
                        <span class="variable-name">${key}</span>
                        <span class="variable-type type-${dataType}">${dataType}</span>
                    </div>
                    <div class="variable-value">
                        <code>${displayValue}</code>
                    </div>
                </div>
            `;
        });
        templateHTML += '</div>';
    }

    templateHTML += '</div>';

    templateDetails.innerHTML = templateHTML;
}

// Populate new segment panel with editable copy
function populateNewSegmentPanel(segment) {
    const newSegmentVariables = document.getElementById('new-segment-variables');
    const newSegmentName = document.getElementById('new-segment-name');

    // Pre-fill segment name with a copy indicator
    if (newSegmentName) {
        newSegmentName.value = `Copy of ${segment.name}`;
    }

    if (!newSegmentVariables) return;

    const variables = segment.segment_variables || {};
    const variableCount = Object.keys(variables).length;

    let variablesHTML = `
        <div class="variables-header">
            <h5>Variables (${variableCount})</h5>
            <button type="button" class="btn btn-small btn-secondary" onclick="addNewSegmentVariable()">Add Variable</button>
        </div>
    `;

    if (variableCount === 0) {
        variablesHTML += `
            <div class="no-variables-editable">
                <p>No variables to copy from template</p>
                <button type="button" class="btn btn-small btn-primary" onclick="addNewSegmentVariable()">Add First Variable</button>
            </div>
        `;
    } else {
        variablesHTML += '<div class="editable-variables-list">';

        let variableIndex = 0;
        Object.entries(variables).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const dataType = typeof value;

            variablesHTML += `
                <div class="editable-variable-item" data-variable-index="${variableIndex}">
                    <div class="variable-controls">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Variable Name</label>
                                <input type="text" class="variable-name-input" value="${key}" onchange="updateVariablePreview(${variableIndex})">
                            </div>
                            <div class="form-group">
                                <label>Data Type</label>
                                <select class="variable-type-select" onchange="updateVariableType(${variableIndex})" data-original-type="${dataType}">
                                    <option value="string" ${dataType === 'string' ? 'selected' : ''}>String</option>
                                    <option value="number" ${dataType === 'number' ? 'selected' : ''}>Number</option>
                                    <option value="boolean" ${dataType === 'boolean' ? 'selected' : ''}>Boolean</option>
                                </select>
                            </div>
                            <div class="form-group variable-actions">
                                <label>&nbsp;</label>
                                <button type="button" class="btn btn-small btn-danger" onclick="removeNewSegmentVariable(${variableIndex})">Remove</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Variable Value</label>
                            <div class="variable-value-input-container">
                                ${generateEditableValueInput(dataType, displayValue, variableIndex)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            variableIndex++;
        });

        variablesHTML += '</div>';
    }

    newSegmentVariables.innerHTML = variablesHTML;

    // Store the current variable index for adding new variables
    window.nextVariableIndex = variableIndex;
}

// Generate editable value input based on data type
function generateEditableValueInput(type, currentValue, index) {
    switch (type) {
        case 'boolean':
            const isChecked = currentValue === 'true' || currentValue === true;
            return `
                <label class="checkbox-wrapper">
                    <input type="checkbox" class="variable-value-input" data-index="${index}" ${isChecked ? 'checked' : ''}>
                    <span class="checkbox-label">${isChecked ? 'True' : 'False'}</span>
                </label>
            `;
        case 'number':
            return `<input type="number" class="variable-value-input" data-index="${index}" value="${currentValue}" step="any">`;
        default: // string
            return `<input type="text" class="variable-value-input" data-index="${index}" value="${currentValue}">`;
    }
}

// Update variable type in new segment panel
function updateVariableType(index) {
    const variableItem = document.querySelector(`[data-variable-index="${index}"]`);
    if (!variableItem) return;

    const typeSelect = variableItem.querySelector('.variable-type-select');
    const valueContainer = variableItem.querySelector('.variable-value-input-container');
    const currentInput = variableItem.querySelector('.variable-value-input');

    if (!typeSelect || !valueContainer) return;

    const newType = typeSelect.value;
    let currentValue = '';

    // Get current value based on input type
    if (currentInput) {
        if (currentInput.type === 'checkbox') {
            currentValue = currentInput.checked;
        } else {
            currentValue = currentInput.value;
        }
    }

    // Convert value to new type
    let convertedValue = currentValue;
    switch (newType) {
        case 'boolean':
            convertedValue = Boolean(currentValue);
            break;
        case 'number':
            convertedValue = parseFloat(currentValue) || 0;
            break;
        default: // string
            convertedValue = String(currentValue);
            break;
    }

    // Replace the input with new type
    valueContainer.innerHTML = generateEditableValueInput(newType, convertedValue, index);

    // Add event listener for boolean checkbox label updates
    if (newType === 'boolean') {
        const checkbox = valueContainer.querySelector('input[type="checkbox"]');
        const label = valueContainer.querySelector('.checkbox-label');
        if (checkbox && label) {
            checkbox.addEventListener('change', function() {
                label.textContent = this.checked ? 'True' : 'False';
            });
        }
    }
}

// Add new variable to new segment
function addNewSegmentVariable() {
    const variablesList = document.querySelector('.editable-variables-list');
    const noVariablesDiv = document.querySelector('.no-variables-editable');
    const variablesHeader = document.querySelector('#new-segment-variables .variables-header h5');

    // Initialize nextVariableIndex if not set
    if (typeof window.nextVariableIndex === 'undefined') {
        window.nextVariableIndex = 0;
    }

    const index = window.nextVariableIndex++;

    const newVariableHTML = `
        <div class="editable-variable-item" data-variable-index="${index}">
            <div class="variable-controls">
                <div class="form-row">
                    <div class="form-group">
                        <label>Variable Name</label>
                        <input type="text" class="variable-name-input" value="new_variable_${index}" onchange="updateVariablePreview(${index})">
                    </div>
                    <div class="form-group">
                        <label>Data Type</label>
                        <select class="variable-type-select" onchange="updateVariableType(${index})">
                            <option value="string" selected>String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                        </select>
                    </div>
                    <div class="form-group variable-actions">
                        <label>&nbsp;</label>
                        <button type="button" class="btn btn-small btn-danger" onclick="removeNewSegmentVariable(${index})">Remove</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Variable Value</label>
                    <div class="variable-value-input-container">
                        ${generateEditableValueInput('string', '', index)}
                    </div>
                </div>
            </div>
        </div>
    `;

    // If no variables list exists, create it
    if (!variablesList && noVariablesDiv) {
        noVariablesDiv.style.display = 'none';
        const newVariablesSection = document.createElement('div');
        newVariablesSection.className = 'editable-variables-list';
        newVariablesSection.innerHTML = newVariableHTML;
        noVariablesDiv.parentNode.appendChild(newVariablesSection);
    } else if (variablesList) {
        variablesList.insertAdjacentHTML('beforeend', newVariableHTML);
    }

    // Update variables count
    updateVariableCount();

    console.log('Added new variable with index:', index);
}

// Remove variable from new segment
function removeNewSegmentVariable(index) {
    const variableItem = document.querySelector(`[data-variable-index="${index}"]`);
    if (variableItem) {
        variableItem.remove();
        updateVariableCount();

        // If no variables left, show the no-variables message
        const variablesList = document.querySelector('.editable-variables-list');
        const noVariablesDiv = document.querySelector('.no-variables-editable');

        if (variablesList && variablesList.children.length === 0 && noVariablesDiv) {
            noVariablesDiv.style.display = 'block';
            variablesList.remove();
        }
    }
}

// Update variable count in header
function updateVariableCount() {
    const variablesHeader = document.querySelector('#new-segment-variables .variables-header h5');
    const variableItems = document.querySelectorAll('.editable-variable-item');

    if (variablesHeader) {
        variablesHeader.textContent = `Variables (${variableItems.length})`;
    }
}

// Handle domain change in creation form
function onCreateDomainChange() {
    // Just for validation - no special logic needed yet
    const domainSelect = document.getElementById('create-domain-select');
    console.log('Target domain selected:', domainSelect?.value);
}

// Create new segment
async function createNewSegment() {
    try {
        // Validate required fields
        const domainSelect = document.getElementById('create-domain-select');
        const segmentNameInput = document.getElementById('new-segment-name');
        const modelSegmentSearch = document.getElementById('model-segment-search');

        if (!domainSelect?.value) {
            alert('Please select a target domain');
            return;
        }

        if (!segmentNameInput?.value?.trim()) {
            alert('Please enter a name for the new segment');
            segmentNameInput?.focus();
            return;
        }

        if (!window.selectedModelSegment) {
            alert('Please select a model segment template');
            modelSegmentSearch?.focus();
            return;
        }

        // Collect variable data from the form
        const variableItems = document.querySelectorAll('.editable-variable-item');
        const segmentVariables = [];

        variableItems.forEach(item => {
            const nameInput = item.querySelector('.variable-name-input');
            const typeSelect = item.querySelector('.variable-type-select');
            const valueInput = item.querySelector('.variable-value-input');

            if (nameInput?.value?.trim()) {
                let variableValue;
                const variableType = typeSelect?.value || 'string';

                // Get value based on type
                switch (variableType) {
                    case 'boolean':
                        variableValue = valueInput?.checked || false;
                        break;
                    case 'number':
                        variableValue = parseFloat(valueInput?.value) || 0;
                        break;
                    default: // string
                        variableValue = valueInput?.value || '';
                        break;
                }

                segmentVariables.push({
                    name: nameInput.value.trim(),
                    value: variableValue
                });
            }
        });

        // Prepare API payload
        const payload = {
            segment_name: segmentNameInput.value.trim(),
            domain_id: parseInt(domainSelect.value),
            segment_template_id: window.selectedModelSegment.segment_template.id,
            segment_variables: segmentVariables
        };

        // Show loading state
        const createBtn = document.querySelector('button[onclick="createNewSegment()"]');
        const originalBtnText = createBtn?.textContent;
        if (createBtn) {
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;
        }

        console.log('Creating segment with payload:', payload);

        // Make API call
        const response = await apiCall('/api/segments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        console.log('Segment created successfully:', response);

        // Show success message
        alert(`Segment "${payload.segment_name}" created successfully with ID: ${response.segment_id}`);

        // Reset the form
        resetSegmentCreation();

        // Optionally navigate to the segments view
        showSection('segment-view');

    } catch (error) {
        console.error('Error creating segment:', error);
        alert(`Error creating segment: ${error.message}`);

        // Reset button state
        const createBtn = document.querySelector('button[onclick="createNewSegment()"]');
        if (createBtn) {
            createBtn.textContent = 'Create Segment';
            createBtn.disabled = false;
        }
    }
}

// Reset segment creation form
function resetSegmentCreation() {
    // Clear form fields
    const domainSelect = document.getElementById('create-domain-select');
    const modelSegmentSearch = document.getElementById('model-segment-search');
    const segmentNameInput = document.getElementById('new-segment-name');
    const workspace = document.getElementById('segment-creation-workspace');

    if (domainSelect) domainSelect.value = '';
    if (modelSegmentSearch) modelSegmentSearch.value = '';
    if (segmentNameInput) segmentNameInput.value = '';
    if (workspace) workspace.style.display = 'none';

    // Clear stored data
    window.selectedModelSegment = null;
    window.nextVariableIndex = 0;

    console.log('Segment creation form reset');
}

// Hide model segment dropdown when clicking outside
document.addEventListener('click', function(event) {
    const searchInput = document.getElementById('model-segment-search');
    const dropdown = document.getElementById('model-segment-dropdown');

    if (searchInput && dropdown &&
        !searchInput.contains(event.target) &&
        !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});// Load data based on section
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'segment-view':
            loadSegmentViewData();
            break;
        case 'segment-update':
            loadSegmentUpdateData();
            break;
        case 'segment-create':
            loadSegmentCreateData();
            break;
        // Other sections don't have dynamic data loading yet
        default:
            break;
    }
}