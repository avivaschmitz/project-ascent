// Project Ascent - Navigation and Section Management

document.addEventListener('DOMContentLoaded', () => {
    console.log('Project Ascent - Navigation ready!');

    // Initialize navigation
    initializeNavigation();

    // Test API connection
    testAPIConnection();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const submenuLinks = document.querySelectorAll('.submenu-link[data-section]');

    // Handle main nav clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Handle submenu clicks
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });
}

// Show specific section
function showSection(sectionId) {
    const contentSections = document.querySelectorAll('.content-section');

    // Hide all sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log(`Switched to ${sectionId} section`);

        // Update navigation state based on section
        updateNavigationState(sectionId);

        // Load section data
        loadSectionData(sectionId);
    }
}

// Update navigation state based on current section
function updateNavigationState(sectionId) {
    // Clear all active states
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));

    // Determine parent section and highlight it
    if (sectionId.startsWith('domain-') || sectionId === 'domains') {
        const domainNav = document.querySelector('.nav-link[data-section="domains"]');
        if (domainNav) domainNav.classList.add('active');
    } else if (sectionId.startsWith('segment-') || sectionId === 'segments') {
        const segmentNav = document.querySelector('.nav-link[data-section="segments"]');
        if (segmentNav) segmentNav.classList.add('active');
    } else if (sectionId.startsWith('experiment-') || sectionId === 'experiments') {
        const experimentNav = document.querySelector('.nav-link[data-section="experiments"]');
        if (experimentNav) experimentNav.classList.add('active');
    }
}

// Load data based on section
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
        default:
            break;
    }
}

// Basic placeholder functions
function loadSegmentViewData() {
    console.log('Loading segment view data...');
}

function loadSegmentUpdateData() {
    console.log('Loading segment update data...');
}

// SEGMENT CREATION FUNCTIONS
async function loadSegmentCreateData() {
    try {
        const contentArea = document.querySelector('#segment-create-section .content-area');
        contentArea.innerHTML = '<div class="loading">Loading segment creation interface...</div>';

        const [domains, allSegments] = await Promise.all([
            apiCall('/api/domains'),
            getAllSegments()
        ]);

        let segmentCreateHTML = `
            <div class="segment-create-controls">
                <div class="form-group">
                    <label for="create-domain-select">Target Domain *</label>
                    <select id="create-domain-select" required>
                        <option value="">Select target domain...</option>
        `;

        domains.forEach(domain => {
            segmentCreateHTML += `<option value="${domain.domain_id}" data-domain-name="${domain.domain_name}">${domain.domain_name}</option>`;
        });

        segmentCreateHTML += `
                    </select>
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
                        </div>
                    </div>
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
        window.allSegmentsForTemplate = allSegments;
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

async function getAllSegments() {
    try {
        const domains = await apiCall('/api/domains');
        let allSegments = [];

        for (const domain of domains) {
            try {
                const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domain.domain_name)}`);
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

function filterModelSegments() {
    const searchInput = document.getElementById('model-segment-search');
    const dropdown = document.getElementById('model-segment-dropdown');

    if (!searchInput || !dropdown || !window.allSegmentsForTemplate) return;

    const searchTerm = searchInput.value.toLowerCase();

    if (searchTerm.length > 0) {
        dropdown.style.display = 'block';
    }

    const filteredSegments = window.allSegmentsForTemplate.filter(segment => {
        return segment.name.toLowerCase().includes(searchTerm) ||
               segment.source_domain.name.toLowerCase().includes(searchTerm) ||
               (segment.segment_template?.name || '').toLowerCase().includes(searchTerm);
    });

    populateModelSegmentDropdown(filteredSegments);

    if (filteredSegments.length === 0 && searchTerm.length > 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No segments match your search</div>';
    }
}

function showModelSegmentDropdown() {
    const dropdown = document.getElementById('model-segment-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

async function selectModelSegment(segmentId) {
    try {
        console.log('selectModelSegment called with ID:', segmentId);

        const searchInput = document.getElementById('model-segment-search');
        const dropdown = document.getElementById('model-segment-dropdown');
        const workspace = document.getElementById('segment-creation-workspace');

        const selectedSegment = window.allSegmentsForTemplate.find(segment => segment.id == segmentId);
        if (!selectedSegment) {
            throw new Error('Selected segment not found');
        }

        console.log('Found segment:', selectedSegment);

        if (searchInput) {
            searchInput.value = `${selectedSegment.name} (${selectedSegment.source_domain.name})`;
        }

        if (dropdown) {
            dropdown.style.display = 'none';
        }

        if (workspace) {
            workspace.style.display = 'block';
        }

        window.selectedModelSegment = selectedSegment;

        console.log('About to populate template panel...');
        populateTemplatePanel(selectedSegment);

        console.log('About to populate new segment panel...');
        populateNewSegmentPanel(selectedSegment);

        console.log('Successfully selected model segment:', selectedSegment.name);

    } catch (error) {
        console.error('Error in selectModelSegment:', error);
        // Remove the alert and just log the error
        console.error(`Error selecting segment: ${error.message}`);
    }
}

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

function populateNewSegmentPanel(segment) {
    const newSegmentVariables = document.getElementById('new-segment-variables');
    const newSegmentName = document.getElementById('new-segment-name');

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

        let currentIndex = 0;
        Object.entries(variables).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const dataType = typeof value;

            // Escape HTML characters in key and value
            const escapedKey = escapeHtml(key);
            const escapedValue = escapeHtml(displayValue);

            variablesHTML += `
                <div class="editable-variable-item" data-variable-index="${currentIndex}">
                    <div class="variable-controls">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Variable Name</label>
                                <input type="text" class="variable-name-input" value="${escapedKey}">
                            </div>
                            <div class="form-group">
                                <label>Data Type</label>
                                <select class="variable-type-select" onchange="updateVariableType(${currentIndex})">
                                    <option value="string" ${dataType === 'string' ? 'selected' : ''}>String</option>
                                    <option value="number" ${dataType === 'number' ? 'selected' : ''}>Number</option>
                                    <option value="boolean" ${dataType === 'boolean' ? 'selected' : ''}>Boolean</option>
                                </select>
                            </div>
                            <div class="form-group variable-actions">
                                <label>&nbsp;</label>
                                <button type="button" class="btn btn-small btn-danger" onclick="removeNewSegmentVariable(${currentIndex})">Remove</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Variable Value</label>
                            <div class="variable-value-input-container">
                                ${generateEditableValueInput(dataType, escapedValue, currentIndex)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            currentIndex++;
        });

        variablesHTML += '</div>';
    }

    newSegmentVariables.innerHTML = variablesHTML;
    window.nextVariableIndex = currentIndex;
}

// Helper function to escape HTML characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
        default:
            return `<input type="text" class="variable-value-input" data-index="${index}" value="${currentValue}">`;
    }
}

function updateVariableType(index) {
    const variableItem = document.querySelector(`[data-variable-index="${index}"]`);
    if (!variableItem) return;

    const typeSelect = variableItem.querySelector('.variable-type-select');
    const valueContainer = variableItem.querySelector('.variable-value-input-container');
    const currentInput = variableItem.querySelector('.variable-value-input');

    if (!typeSelect || !valueContainer) return;

    const newType = typeSelect.value;
    let currentValue = '';

    if (currentInput) {
        if (currentInput.type === 'checkbox') {
            currentValue = currentInput.checked;
        } else {
            currentValue = currentInput.value;
        }
    }

    let convertedValue = currentValue;
    switch (newType) {
        case 'boolean':
            convertedValue = Boolean(currentValue);
            break;
        case 'number':
            convertedValue = parseFloat(currentValue) || 0;
            break;
        default:
            convertedValue = String(currentValue);
            break;
    }

    valueContainer.innerHTML = generateEditableValueInput(newType, convertedValue, index);

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

function addNewSegmentVariable() {
    const variablesList = document.querySelector('.editable-variables-list');
    const noVariablesDiv = document.querySelector('.no-variables-editable');

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
                        <input type="text" class="variable-name-input" value="new_variable_${index}">
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

    if (!variablesList && noVariablesDiv) {
        noVariablesDiv.style.display = 'none';
        const newVariablesSection = document.createElement('div');
        newVariablesSection.className = 'editable-variables-list';
        newVariablesSection.innerHTML = newVariableHTML;
        noVariablesDiv.parentNode.appendChild(newVariablesSection);
    } else if (variablesList) {
        variablesList.insertAdjacentHTML('beforeend', newVariableHTML);
    }

    updateVariableCount();
    console.log('Added new variable with index:', index);
}

function removeNewSegmentVariable(index) {
    const variableItem = document.querySelector(`[data-variable-index="${index}"]`);
    if (variableItem) {
        variableItem.remove();
        updateVariableCount();

        const variablesList = document.querySelector('.editable-variables-list');
        const noVariablesDiv = document.querySelector('.no-variables-editable');

        if (variablesList && variablesList.children.length === 0 && noVariablesDiv) {
            noVariablesDiv.style.display = 'block';
            variablesList.remove();
        }
    }
}

function updateVariableCount() {
    const variablesHeader = document.querySelector('#new-segment-variables .variables-header h5');
    const variableItems = document.querySelectorAll('.editable-variable-item');

    if (variablesHeader) {
        variablesHeader.textContent = `Variables (${variableItems.length})`;
    }
}

async function createNewSegment() {
    try {
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

        const variableItems = document.querySelectorAll('.editable-variable-item');
        const segmentVariables = [];

        variableItems.forEach(item => {
            const nameInput = item.querySelector('.variable-name-input');
            const typeSelect = item.querySelector('.variable-type-select');
            const valueInput = item.querySelector('.variable-value-input');

            if (nameInput?.value?.trim()) {
                let variableValue;
                const variableType = typeSelect?.value || 'string';

                switch (variableType) {
                    case 'boolean':
                        variableValue = valueInput?.checked || false;
                        break;
                    case 'number':
                        variableValue = parseFloat(valueInput?.value) || 0;
                        break;
                    default:
                        variableValue = valueInput?.value || '';
                        break;
                }

                segmentVariables.push({
                    name: nameInput.value.trim(),
                    value: variableValue
                });
            }
        });

        const payload = {
            segment_name: segmentNameInput.value.trim(),
            domain_id: parseInt(domainSelect.value),
            segment_template_id: window.selectedModelSegment.segment_template.id,
            segment_variables: segmentVariables
        };

        const createBtn = document.querySelector('button[onclick="createNewSegment()"]');
        const originalBtnText = createBtn?.textContent;
        if (createBtn) {
            createBtn.textContent = 'Creating...';
            createBtn.disabled = true;
        }

        console.log('Creating segment with payload:', payload);

        const response = await apiCall('/api/segments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        console.log('Segment created successfully:', response);
        alert(`Segment "${payload.segment_name}" created successfully with ID: ${response.segment_id}`);

        resetSegmentCreation();
        showSection('segment-view');

    } catch (error) {
        console.error('Error creating segment:', error);
        alert(`Error creating segment: ${error.message}`);

        const createBtn = document.querySelector('button[onclick="createNewSegment()"]');
        if (createBtn) {
            createBtn.textContent = 'Create Segment';
            createBtn.disabled = false;
        }
    }
}

function resetSegmentCreation() {
    const domainSelect = document.getElementById('create-domain-select');
    const modelSegmentSearch = document.getElementById('model-segment-search');
    const segmentNameInput = document.getElementById('new-segment-name');
    const workspace = document.getElementById('segment-creation-workspace');

    if (domainSelect) domainSelect.value = '';
    if (modelSegmentSearch) modelSegmentSearch.value = '';
    if (segmentNameInput) segmentNameInput.value = '';
    if (workspace) workspace.style.display = 'none';

    window.selectedModelSegment = null;
    window.nextVariableIndex = 0;

    console.log('Segment creation form reset');
}

// Hide dropdown when clicking outside
document.addEventListener('click', function(event) {
    const searchInput = document.getElementById('model-segment-search');
    const dropdown = document.getElementById('model-segment-dropdown');

    if (searchInput && dropdown &&
        !searchInput.contains(event.target) &&
        !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// API utility function
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Test API connection
async function testAPIConnection() {
    try {
        const response = await apiCall('/api/domains');
        console.log('API connection successful - loaded domains:', response.length);
    } catch (error) {
        console.log('API connection test failed:', error.message);
    }
}

// Make functions globally available
window.showSection = showSection;
window.loadSegmentCreateData = loadSegmentCreateData;
window.filterModelSegments = filterModelSegments;
window.showModelSegmentDropdown = showModelSegmentDropdown;
window.selectModelSegment = selectModelSegment;
window.updateVariableType = updateVariableType;
window.addNewSegmentVariable = addNewSegmentVariable;
window.removeNewSegmentVariable = removeNewSegmentVariable;
window.createNewSegment = createNewSegment;
window.resetSegmentCreation = resetSegmentCreation;