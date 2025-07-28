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
        // Other sections don't have dynamic data loading yet
        default:
            break;
    }
}

// Load segment view data (migrated from old domains functionality)
async function loadSegmentViewData() {
    try {
        const contentArea = document.querySelector('#segment-view-section .content-area');

        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading segments...</div>';

        // Fetch domains from API
        const domains = await apiCall('/api/domains');

        // Generate segment view HTML with domain search
        let segmentViewHTML = `
            <div class="segment-view-controls">
                <div class="form-group">
                    <label for="view-domain-select">Filter by Domain</label>
                    <select id="view-domain-select" onchange="onViewDomainChange()">
                        <option value="">All domains</option>
        `;

        domains.forEach(domain => {
            segmentViewHTML += `<option value="${domain.domain_id}" data-domain-name="${domain.domain_name}">${domain.domain_name}</option>`;
        });

        segmentViewHTML += `
                    </select>
                </div>
                <div class="view-actions">
                    <button class="btn btn-primary" onclick="showAddDomainForm()">Add New Domain</button>
                </div>
            </div>

            <div id="domains-table-container">
        `;

        // Generate domains table HTML
        segmentViewHTML += `
                <div class="data-table">
                    <table class="domains-table">
                        <thead>
                            <tr>
                                <th width="50">Expand</th>
                                <th>Domain ID</th>
                                <th>Domain Name</th>
                                <th>Segments</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (domains.length === 0) {
            segmentViewHTML += `
                            <tr>
                                <td colspan="4" class="no-data">No domains found</td>
                            </tr>
            `;
        } else {
            domains.forEach(domain => {
                segmentViewHTML += `
                            <tr class="domain-row" data-domain-id="${domain.domain_id}" data-domain-name="${domain.domain_name}">
                                <td class="expand-cell">
                                    <button class="expand-btn" onclick="toggleDomainExpansion(${domain.domain_id}, '${domain.domain_name}')">
                                        <span class="expand-icon">▶</span>
                                    </button>
                                </td>
                                <td class="domain-id">${domain.domain_id}</td>
                                <td class="domain-name">${domain.domain_name}</td>
                                <td class="segment-count">
                                    <span class="loading-segments">Loading...</span>
                                </td>
                            </tr>
                            <tr class="segments-row" id="segments-row-${domain.domain_id}" style="display: none;">
                                <td colspan="4" class="segments-container">
                                    <div class="segments-loading">Loading segments...</div>
                                </td>
                            </tr>
                `;
            });
        }

        segmentViewHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Update the content area
        contentArea.innerHTML = segmentViewHTML;

        console.log(`Loaded ${domains.length} domains`);

        // Load segment counts for each domain
        if (domains.length > 0) {
            loadSegmentCounts(domains);
        }

    } catch (error) {
        console.error('Error loading segments:', error);
        const contentArea = document.querySelector('#segment-view-section .content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Segments</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadSegmentViewData()">Retry</button>
            </div>
        `;
    }
}

// Load segment counts for domains
async function loadSegmentCounts(domains) {
    for (const domain of domains) {
        try {
            const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domain.domain_name)}`);
            const countElement = document.querySelector(`tr[data-domain-id="${domain.domain_id}"] .segment-count`);
            if (countElement) {
                countElement.innerHTML = `<span class="segment-count-badge">${segments.length}</span>`;
            }
        } catch (error) {
            console.error(`Error loading segment count for domain ${domain.domain_name}:`, error);
            const countElement = document.querySelector(`tr[data-domain-id="${domain.domain_id}"] .segment-count`);
            if (countElement) {
                countElement.innerHTML = '<span class="segment-count-error">Error</span>';
            }
        }
    }
}

// Toggle domain expansion
async function toggleDomainExpansion(domainId, domainName) {
    const domainRow = document.querySelector(`tr[data-domain-id="${domainId}"]`);
    const segmentsRow = document.getElementById(`segments-row-${domainId}`);
    const expandBtn = domainRow.querySelector('.expand-btn');
    const expandIcon = expandBtn.querySelector('.expand-icon');

    if (segmentsRow.style.display === 'none') {
        // Expand - show segments
        expandIcon.textContent = '▼';
        expandBtn.classList.add('expanded');
        segmentsRow.style.display = 'table-row';

        // Load segments if not already loaded
        if (!segmentsRow.dataset.loaded) {
            await loadDomainSegments(domainId, domainName);
            segmentsRow.dataset.loaded = 'true';
        }
    } else {
        // Collapse - hide segments
        expandIcon.textContent = '▶';
        expandBtn.classList.remove('expanded');
        segmentsRow.style.display = 'none';
    }
}

// Load segments for a specific domain
async function loadDomainSegments(domainId, domainName) {
    const segmentsContainer = document.querySelector(`#segments-row-${domainId} .segments-container`);

    try {
        // Show loading state
        segmentsContainer.innerHTML = '<div class="segments-loading">Loading segments...</div>';

        // Fetch segments for this domain
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domainName)}`);

        // Generate segments HTML
        let segmentsHTML = `
            <div class="segments-header">
                <h4>Segments for ${domainName} (${segments.length})</h4>
            </div>
        `;

        if (segments.length === 0) {
            segmentsHTML += `
                <div class="no-segments">
                    <p>No segments found for this domain.</p>
                    <button class="btn btn-small btn-primary" onclick="createSegmentForDomain(${domainId}, '${domainName}')">
                        Create First Segment
                    </button>
                </div>
            `;
        } else {
            segmentsHTML += `
                <div class="segments-table-container">
                    <table class="segments-table">
                        <thead>
                            <tr>
                                <th>Segment ID</th>
                                <th>Segment Name</th>
                                <th>Template</th>
                                <th>Variables</th>
                                <th>Selectors</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            segments.forEach(segment => {
                const variableCount = Object.keys(segment.segment_variables || {}).length;
                const selectorCount = segment.selector_set?.selectors?.length || 0;
                const templateName = segment.segment_template?.name || 'Unknown Template';

                segmentsHTML += `
                    <tr class="segment-row">
                        <td class="segment-id">${segment.id}</td>
                        <td class="segment-name">${segment.name}</td>
                        <td class="segment-template">${templateName}</td>
                        <td class="segment-variables">
                            <span class="count-badge">${variableCount}</span>
                        </td>
                        <td class="segment-selectors">
                            <span class="count-badge">${selectorCount}</span>
                        </td>
                        <td class="segment-actions">
                            <button class="btn btn-small btn-secondary" onclick="viewSegmentDetails(${segment.id})">
                                View
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="editSegment(${segment.id})">
                                Edit
                            </button>
                        </td>
                    </tr>
                `;
            });

            segmentsHTML += `
                        </tbody>
                    </table>
                </div>
                <div class="segments-footer">
                    <button class="btn btn-small btn-primary" onclick="createSegmentForDomain(${domainId}, '${domainName}')">
                        Add New Segment
                    </button>
                </div>
            `;
        }

        // Update the segments container
        segmentsContainer.innerHTML = segmentsHTML;

        console.log(`Loaded ${segments.length} segments for domain ${domainName}`);

    } catch (error) {
        console.error(`Error loading segments for domain ${domainName}:`, error);
        segmentsContainer.innerHTML = `
            <div class="segments-error">
                <h4>Error Loading Segments</h4>
                <p>${error.message}</p>
                <button class="btn btn-small btn-primary" onclick="loadDomainSegments(${domainId}, '${domainName}')">
                    Retry
                </button>
            </div>
        `;
    }
}

// Placeholder functions for segment actions
function viewSegmentDetails(segmentId) {
    // Navigate to segment update page with prepopulated segment
    showSegmentUpdate(segmentId);
}

function editSegment(segmentId) {
    // Navigate to segment update page with prepopulated segment
    showSegmentUpdate(segmentId);
}

function createSegmentForDomain(domainId, domainName) {
    alert(`Create new segment for domain ${domainName} (ID: ${domainId}) (functionality to be implemented)`);
}

// Navigate to segment update page with optional prepopulated segment
function showSegmentUpdate(segmentId = null) {
    // Switch to segment update section
    showSection('segment-update');

    // Load the segment update page with preselected segment
    if (segmentId) {
        // Wait a bit for the section to load, then preselect
        setTimeout(() => {
            loadSegmentUpdateData(segmentId);
        }, 100);
    }
}

// Show Add Domain form (placeholder)
function showAddDomainForm() {
    alert('Add Domain functionality will be moved to Domains > Provision section');
}

// Load segment update data (migrated from segment variables functionality)
async function loadSegmentUpdateData(preselectedSegmentId = null) {
    try {
        const contentArea = document.querySelector('#segment-update-section .content-area');

        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading segment editor...</div>';

        // Fetch domains and segments data
        const domains = await apiCall('/api/domains');

        // Generate the segment update page HTML
        let segmentUpdateHTML = `
            <div class="segment-variables-controls">
                <div class="form-group">
                    <label for="domain-select">Select Domain</label>
                    <select id="domain-select" onchange="onDomainChange()">
                        <option value="">Select a domain...</option>
        `;

        domains.forEach(domain => {
            segmentUpdateHTML += `<option value="${domain.domain_id}" data-domain-name="${domain.domain_name}">${domain.domain_name}</option>`;
        });

        segmentUpdateHTML += `
                    </select>
                </div>

                <div class="form-group">
                    <label for="segment-select">Select Segment</label>
                    <select id="segment-select" onchange="onSegmentChange()" disabled>
                        <option value="">Select a segment...</option>
                    </select>
                </div>
            </div>

            <div id="segment-variables-display" class="segment-variables-display" style="display: none;">
                <div class="segment-info">
                    <h3 id="segment-info-title">Segment Variables</h3>
                    <div id="segment-info-details"></div>
                </div>

                <div id="variables-container" class="variables-container">
                    <!-- Variables will be loaded here -->
                </div>
            </div>
        `;

        contentArea.innerHTML = segmentUpdateHTML;

        // If we have a preselected segment, find and select it
        if (preselectedSegmentId) {
            await preselectSegment(preselectedSegmentId, domains);
        }

        console.log('Segment update page loaded');

    } catch (error) {
        console.error('Error loading segment update:', error);
        const contentArea = document.querySelector('#segment-update-section .content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Segment Editor</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadSegmentUpdateData()">Retry</button>
            </div>
        `;
    }
}

// Handle domain selection change
async function onDomainChange() {
    const domainSelect = document.getElementById('domain-select');
    const segmentSelect = document.getElementById('segment-select');
    const segmentVariablesDisplay = document.getElementById('segment-variables-display');

    if (!domainSelect || !segmentSelect || !segmentVariablesDisplay) {
        console.error('Required elements not found');
        return;
    }

    // Clear segment dropdown
    segmentSelect.innerHTML = '<option value="">Select a segment...</option>';
    segmentSelect.disabled = true;

    // Hide variables display
    segmentVariablesDisplay.style.display = 'none';

    const selectedDomainId = domainSelect.value;
    const selectedOption = domainSelect.options[domainSelect.selectedIndex];
    const selectedDomainName = selectedOption.dataset.domainName;

    if (!selectedDomainId) {
        return;
    }

    try {
        // Show loading in segment dropdown
        segmentSelect.innerHTML = '<option value="">Loading segments...</option>';

        // Fetch segments for the selected domain
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(selectedDomainName)}`);

        // Populate segment dropdown
        segmentSelect.innerHTML = '<option value="">Select a segment...</option>';
        segments.forEach(segment => {
            segmentSelect.innerHTML += `<option value="${segment.id}">${segment.name}</option>`;
        });

        // Enable segment dropdown
        segmentSelect.disabled = false;

        console.log(`Loaded ${segments.length} segments for domain ${selectedDomainName}`);

    } catch (error) {
        console.error('Error loading segments for domain:', error);
        segmentSelect.innerHTML = '<option value="">Error loading segments</option>';
    }
}

// Handle segment selection change
async function onSegmentChange() {
    const segmentSelect = document.getElementById('segment-select');
    const domainSelect = document.getElementById('domain-select');
    const segmentVariablesDisplay = document.getElementById('segment-variables-display');

    if (!segmentSelect || !domainSelect || !segmentVariablesDisplay) {
        console.error('Required elements not found');
        return;
    }

    const selectedSegmentId = segmentSelect.value;
    const selectedOption = domainSelect.options[domainSelect.selectedIndex];
    const selectedDomainName = selectedOption.dataset.domainName;

    if (!selectedSegmentId) {
        segmentVariablesDisplay.style.display = 'none';
        return;
    }

    try {
        // Show loading state
        segmentVariablesDisplay.style.display = 'block';
        const variablesContainer = document.getElementById('variables-container');
        if (variablesContainer) {
            variablesContainer.innerHTML = '<div class="loading">Loading segment variables...</div>';
        }

        // Fetch segment details
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(selectedDomainName)}`);
        const selectedSegment = segments.find(segment => segment.id == selectedSegmentId);

        if (!selectedSegment) {
            throw new Error('Segment not found');
        }

        // Update segment info
        const segmentInfoTitle = document.getElementById('segment-info-title');
        const segmentInfoDetails = document.getElementById('segment-info-details');

        if (segmentInfoTitle) {
            segmentInfoTitle.textContent = `Variables for "${selectedSegment.name}"`;
        }

        if (segmentInfoDetails) {
            segmentInfoDetails.innerHTML = `
                <div class="segment-detail-item">
                    <strong>Segment ID:</strong> ${selectedSegment.id}
                </div>
                <div class="segment-detail-item">
                    <strong>Domain:</strong> ${selectedDomainName}
                </div>
                <div class="segment-detail-item">
                    <strong>Template:</strong> ${selectedSegment.segment_template?.name || 'Unknown'}
                </div>
            `;
        }

        // Display segment variables
        displaySegmentVariables(selectedSegment);

        console.log(`Loaded variables for segment ${selectedSegment.name}`);

    } catch (error) {
        console.error('Error loading segment variables:', error);
        const variablesContainer = document.getElementById('variables-container');
        if (variablesContainer) {
            variablesContainer.innerHTML = `
                <div class="error-message">
                    <h4>Error Loading Variables</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-small btn-primary" onclick="onSegmentChange()">Retry</button>
                </div>
            `;
        }
    }
}

// Display segment variables
function displaySegmentVariables(segment) {
    const variablesContainer = document.getElementById('variables-container');
    if (!variablesContainer) {
        console.error('Variables container not found');
        return;
    }

    const variables = segment.segment_variables || {};

    let variablesHTML = `
        <div class="variables-header">
            <h4>Segment Variables (${Object.keys(variables).length})</h4>
            <button class="btn btn-small btn-primary" onclick="addNewVariable(${segment.id})">Add Variable</button>
        </div>
    `;

    if (Object.keys(variables).length === 0) {
        variablesHTML += `
            <div class="no-variables">
                <p>No variables defined for this segment.</p>
                <button class="btn btn-primary" onclick="addNewVariable(${segment.id})">Add First Variable</button>
            </div>
        `;
    } else {
        variablesHTML += `
            <div class="variables-table-container">
                <table class="variables-table">
                    <thead>
                        <tr>
                            <th>Variable Name</th>
                            <th>Variable Value</th>
                            <th>Data Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(variables).forEach(([key, value]) => {
            const dataType = typeof value;
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            variablesHTML += `
                <tr class="variable-row">
                    <td class="variable-name">${key}</td>
                    <td class="variable-value">
                        <code>${displayValue}</code>
                    </td>
                    <td class="variable-type">
                        <span class="type-badge type-${dataType}">${dataType}</span>
                    </td>
                    <td class="variable-actions">
                        <button class="btn btn-small btn-secondary" onclick="editVariable(${segment.id}, '${key}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteVariable(${segment.id}, '${key}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        variablesHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }

    variablesContainer.innerHTML = variablesHTML;
}

// Preselect a segment when navigating from segment view
async function preselectSegment(segmentId, domains) {
    try {
        // Find which domain contains this segment
        let targetDomain = null;
        let targetSegment = null;

        for (const domain of domains) {
            const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domain.domain_name)}`);
            const foundSegment = segments.find(segment => segment.id == segmentId);

            if (foundSegment) {
                targetDomain = domain;
                targetSegment = foundSegment;
                break;
            }
        }

        if (!targetDomain || !targetSegment) {
            console.error('Could not find segment with ID:', segmentId);
            return;
        }

        // Select the domain
        const domainSelect = document.getElementById('domain-select');
        if (domainSelect) {
            domainSelect.value = targetDomain.domain_id;

            // Trigger domain change to load segments
            await onDomainChange();

            // Select the segment
            const segmentSelect = document.getElementById('segment-select');
            if (segmentSelect) {
                segmentSelect.value = segmentId;

                // Trigger segment change to load variables
                await onSegmentChange();
            }
        }

        console.log(`Preselected segment ${targetSegment.name} from domain ${targetDomain.domain_name}`);

    } catch (error) {
        console.error('Error preselecting segment:', error);
    }
}

// Placeholder functions for variable actions
function addNewVariable(segmentId) {
    alert(`Add new variable to segment ${segmentId} (functionality to be implemented)`);
}

// Show edit variable modal
function editVariable(segmentId, variableName) {
    // First, find the current value
    const variableRow = document.querySelector(`tr.variable-row td.variable-name:contains('${variableName}')`);
    let currentValue = '';
    let currentType = 'string';

    // Try to find the current value from the table
    const allRows = document.querySelectorAll('tr.variable-row');
    for (let row of allRows) {
        const nameCell = row.querySelector('.variable-name');
        if (nameCell && nameCell.textContent === variableName) {
            const valueCell = row.querySelector('.variable-value code');
            const typeCell = row.querySelector('.variable-type .type-badge');
            if (valueCell) currentValue = valueCell.textContent;
            if (typeCell) currentType = typeCell.textContent;
            break;
        }
    }

    // Create modal HTML
    const modalHTML = `
        <div id="edit-variable-modal" class="modal-overlay" onclick="closeEditVariableModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Edit Variable: ${variableName}</h3>
                    <button class="modal-close" onclick="closeEditVariableModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-variable-form" onsubmit="saveVariableEdit(event, ${segmentId}, '${variableName}')">
                        <div class="form-group">
                            <label for="variable-name-display">Variable Name</label>
                            <input type="text" id="variable-name-display" value="${variableName}" disabled>
                        </div>
                        <div class="form-group">
                            <label for="variable-type-select">Data Type</label>
                            <select id="variable-type-select" onchange="onVariableTypeChange()">
                                <option value="string" ${currentType === 'string' ? 'selected' : ''}>String</option>
                                <option value="number" ${currentType === 'number' ? 'selected' : ''}>Number</option>
                                <option value="boolean" ${currentType === 'boolean' ? 'selected' : ''}>Boolean</option>
                            </select>
                        </div>
                        <div class="form-group" id="variable-value-group">
                            <label for="variable-value-input">Variable Value</label>
                            ${generateValueInput(currentType, currentValue)}
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save</button>
                            <button type="button" class="btn btn-secondary" onclick="closeEditVariableModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Focus on the input
    const input = document.getElementById('variable-value-input') || document.getElementById('variable-value-checkbox');
    if (input) input.focus();
}

// Generate appropriate input based on data type
function generateValueInput(type, currentValue) {
    switch (type) {
        case 'boolean':
            const isChecked = currentValue === 'true' || currentValue === true;
            return `
                <label class="checkbox-wrapper">
                    <input type="checkbox" id="variable-value-checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="checkbox-label">${isChecked ? 'True' : 'False'}</span>
                </label>
            `;
        case 'number':
            return `<input type="number" id="variable-value-input" value="${currentValue}" step="any" required>`;
        default: // string
            return `<input type="text" id="variable-value-input" value="${currentValue}" required>`;
    }
}

// Handle variable type change in modal
function onVariableTypeChange() {
    const typeSelect = document.getElementById('variable-type-select');
    const valueGroup = document.getElementById('variable-value-group');

    if (!typeSelect || !valueGroup) return;

    const selectedType = typeSelect.value;
    const currentValue = getCurrentModalValue();

    valueGroup.innerHTML = `
        <label for="variable-value-input">Variable Value</label>
        ${generateValueInput(selectedType, currentValue)}
    `;

    // Update checkbox label behavior for boolean type
    if (selectedType === 'boolean') {
        const checkbox = document.getElementById('variable-value-checkbox');
        const label = document.querySelector('.checkbox-label');
        if (checkbox && label) {
            checkbox.addEventListener('change', function() {
                label.textContent = this.checked ? 'True' : 'False';
            });
        }
    }
}

// Get current value from modal inputs
function getCurrentModalValue() {
    const textInput = document.getElementById('variable-value-input');
    const checkbox = document.getElementById('variable-value-checkbox');

    if (textInput) return textInput.value;
    if (checkbox) return checkbox.checked;
    return '';
}

// Save variable edit
async function saveVariableEdit(event, segmentId, variableName) {
    event.preventDefault();

    const typeSelect = document.getElementById('variable-type-select');
    const textInput = document.getElementById('variable-value-input');
    const checkbox = document.getElementById('variable-value-checkbox');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    if (!typeSelect) {
        alert('Error: Could not find form elements');
        return;
    }

    let variableValue;
    const variableType = typeSelect.value;

    // Get value based on type
    switch (variableType) {
        case 'boolean':
            variableValue = checkbox ? checkbox.checked : false;
            break;
        case 'number':
            variableValue = textInput ? parseFloat(textInput.value) : 0;
            if (isNaN(variableValue)) {
                alert('Please enter a valid number');
                return;
            }
            break;
        default: // string
            variableValue = textInput ? textInput.value : '';
            break;
    }

    try {
        // Show loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        // Make API call to update variable
        const response = await apiCall(`/api/segments/${segmentId}/variables/${encodeURIComponent(variableName)}`, {
            method: 'PUT',
            body: JSON.stringify({
                variable_value: variableValue
            })
        });

        console.log('Variable updated successfully:', response);

        // Close modal
        closeEditVariableModal();

        // Refresh the variables display
        await refreshCurrentSegmentVariables();

        // Show success message
        showSuccessMessage(`Variable "${variableName}" updated successfully!`);

    } catch (error) {
        console.error('Error updating variable:', error);
        alert(`Error updating variable: ${error.message}`);

        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Close edit variable modal
function closeEditVariableModal(event) {
    if (event && event.target !== event.currentTarget) {
        return; // Only close if clicking overlay, not modal content
    }

    const modal = document.getElementById('edit-variable-modal');
    if (modal) {
        modal.remove();
    }
}

// Refresh current segment variables display
async function refreshCurrentSegmentVariables() {
    const segmentSelect = document.getElementById('segment-select');
    if (segmentSelect && segmentSelect.value) {
        await onSegmentChange();
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 1rem 1.5rem;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        font-weight: 500;
    `;

    document.body.appendChild(successDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

function deleteVariable(segmentId, variableName) {
    if (confirm(`Are you sure you want to delete the variable "${variableName}"?`)) {
        alert(`Delete variable "${variableName}" from segment ${segmentId} (functionality to be implemented)`);
    }
}

// Handle domain filter change in view segments
async function onViewDomainChange() {
    const domainSelect = document.getElementById('view-domain-select');
    const domainsTableContainer = document.getElementById('domains-table-container');

    if (!domainSelect || !domainsTableContainer) {
        console.error('Required elements not found');
        return;
    }

    const selectedDomainId = domainSelect.value;
    const selectedOption = domainSelect.options[domainSelect.selectedIndex];
    const selectedDomainName = selectedOption.dataset.domainName;

    try {
        // Show loading state
        domainsTableContainer.innerHTML = '<div class="loading">Loading filtered results...</div>';

        if (!selectedDomainId) {
            // Show all domains
            await loadSegmentViewData();
            return;
        }

        // Show only selected domain
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(selectedDomainName)}`);

        let filteredHTML = `
            <div class="data-table">
                <table class="domains-table">
                    <thead>
                        <tr>
                            <th width="50">Expand</th>
                            <th>Domain ID</th>
                            <th>Domain Name</th>
                            <th>Segments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="domain-row" data-domain-id="${selectedDomainId}" data-domain-name="${selectedDomainName}">
                            <td class="expand-cell">
                                <button class="expand-btn" onclick="toggleDomainExpansion(${selectedDomainId}, '${selectedDomainName}')">
                                    <span class="expand-icon">▶</span>
                                </button>
                            </td>
                            <td class="domain-id">${selectedDomainId}</td>
                            <td class="domain-name">${selectedDomainName}</td>
                            <td class="segment-count">
                                <span class="segment-count-badge">${segments.length}</span>
                            </td>
                        </tr>
                        <tr class="segments-row" id="segments-row-${selectedDomainId}" style="display: none;">
                            <td colspan="4" class="segments-container">
                                <div class="segments-loading">Loading segments...</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        domainsTableContainer.innerHTML = filteredHTML;

        console.log(`Filtered to show domain ${selectedDomainName} with ${segments.length} segments`);

    } catch (error) {
        console.error('Error filtering domains:', error);
        domainsTableContainer.innerHTML = `
            <div class="error-message">
                <h4>Error Loading Filtered Results</h4>
                <p>${error.message}</p>
                <button class="btn btn-small btn-primary" onclick="onViewDomainChange()">Retry</button>
            </div>
        `;
    }
}

// Utility function for making API calls
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
        // Test the domains endpoint
        const response = await apiCall('/api/domains');
        console.log('API connection successful - loaded domains:', response.length);
    } catch (error) {
        console.log('API connection test failed:', error.message);
    }
}

// Make functions globally available
window.showSection = showSection;
window.toggleDomainExpansion = toggleDomainExpansion;
window.viewSegmentDetails = viewSegmentDetails;
window.editSegment = editSegment;
window.createSegmentForDomain = createSegmentForDomain;
window.showAddDomainForm = showAddDomainForm;
window.loadSegmentViewData = loadSegmentViewData;
window.loadSegmentUpdateData = loadSegmentUpdateData;
window.onDomainChange = onDomainChange;
window.onSegmentChange = onSegmentChange;
window.onViewDomainChange = onViewDomainChange;
window.addNewVariable = addNewVariable;
window.editVariable = editVariable;
window.deleteVariable = deleteVariable;
window.closeEditVariableModal = closeEditVariableModal;
window.saveVariableEdit = saveVariableEdit;
window.onVariableTypeChange = onVariableTypeChange;