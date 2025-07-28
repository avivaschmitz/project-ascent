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
    // Find the current value by searching through the table rows
    let currentValue = '';
    let currentType = 'string';

    // Try to find the current value from the table
    const allRows = document.querySelectorAll('tr.variable-row');
    for (let row of allRows) {
        const nameCell = row.querySelector('.variable-name');
        if (nameCell && nameCell.textContent.trim() === variableName) {
            const valueCell = row.querySelector('.variable-value code');
            const typeCell = row.querySelector('.variable-type .type-badge');
            if (valueCell) currentValue = valueCell.textContent.trim();
            if (typeCell) currentType = typeCell.textContent.trim();
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
    setTimeout(() => {
        const input = document.getElementById('variable-value-input') || document.getElementById('variable-value-checkbox');
        if (input) input.focus();
    }, 100);
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
});

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

// Segment Creation Functions
window.loadSegmentCreateData = loadSegmentCreateData;
window.filterModelSegments = filterModelSegments;
window.showModelSegmentDropdown = showModelSegmentDropdown;
window.selectModelSegment = selectModelSegment;
window.updateVariableType = updateVariableType;
window.addNewSegmentVariable = addNewSegmentVariable;
window.removeNewSegmentVariable = removeNewSegmentVariable;
window.onCreateDomainChange = onCreateDomainChange;
window.createNewSegment = createNewSegment;
window.resetSegmentCreation = resetSegmentCreation;');

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

// Populate new segment panel with editable copy - FIXED VERSION
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

        let currentIndex = 0;
        Object.entries(variables).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const dataType = typeof value;

            variablesHTML += `
                <div class="editable-variable-item" data-variable-index="${currentIndex}">
                    <div class="variable-controls">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Variable Name</label>
                                <input type="text" class="variable-name-input" value="${key}">
                            </div>
                            <div class="form-group">
                                <label>Data Type</label>
                                <select class="variable-type-select" onchange="updateVariableType(${currentIndex})" data-original-type="${dataType}">
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
                                ${generateEditableValueInput(dataType, displayValue, currentIndex)}
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

    // Store the current variable index for adding new variables
    window.nextVariableIndex = currentIndex;
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
    const workspace = document.getElementById('segment-creation-workspace