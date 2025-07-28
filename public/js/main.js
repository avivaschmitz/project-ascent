// Project Ascent - Navigation and Section Management

document.addEventListener('DOMContentLoaded', () => {
    console.log('Project Ascent - Navigation ready!');

    // Initialize navigation
    initializeNavigation();

    // Test API connection
    testAPIConnection();
});

// Make showSection globally available
window.showSection = showSection;

// Make other functions globally available
window.toggleDomainExpansion = toggleDomainExpansion;
window.viewSegmentDetails = viewSegmentDetails;
window.editSegment = editSegment;
window.createSegmentForDomain = createSegmentForDomain;
window.showAddDomainForm = showAddDomainForm;
window.onDomainChange = onDomainChange;
window.onSegmentChange = onSegmentChange;
window.addNewVariable = addNewVariable;
window.editVariable = editVariable;
window.deleteVariable = deleteVariable;

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const submenuLinks = document.querySelectorAll('.submenu-link[data-section]');
    const contentSections = document.querySelectorAll('.content-section');

    // Handle main nav clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');

            // Update active nav state
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            // Show corresponding section and load data
            showSection(sectionId);
            loadSectionData(sectionId);
        });
    });

    // Handle submenu clicks
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');

            // Update active nav state (highlight parent)
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));

            // Determine parent section and highlight it
            if (sectionId.startsWith('domain-')) {
                document.querySelector('.nav-link[data-section="domains"]').classList.add('active');
            } else if (sectionId.startsWith('segment-')) {
                document.querySelector('.nav-link[data-section="segments"]').classList.add('active');
            } else if (sectionId.startsWith('experiment-')) {
                document.querySelector('.nav-link[data-section="experiments"]').classList.add('active');
            }

            // Show corresponding section and load data
            showSection(sectionId);
            loadSectionData(sectionId);
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
        document.querySelector('.nav-link[data-section="domains"]').classList.add('active');
    } else if (sectionId.startsWith('segment-') || sectionId === 'segments') {
        document.querySelector('.nav-link[data-section="segments"]').classList.add('active');
    } else if (sectionId.startsWith('experiment-') || sectionId === 'experiments') {
        document.querySelector('.nav-link[data-section="experiments"]').classList.add('active');
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

        // Generate domains table HTML
        let domainsHTML = `
            <div class="data-header">
                <h3>All Domains & Segments (${domains.length})</h3>
                <button class="btn btn-primary" onclick="showAddDomainForm()">Add New Domain</button>
            </div>
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
            domainsHTML += `
                        <tr>
                            <td colspan="4" class="no-data">No domains found</td>
                        </tr>
            `;
        } else {
            domains.forEach(domain => {
                domainsHTML += `
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

        domainsHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Update the content area
        contentArea.innerHTML = domainsHTML;

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

    // Update navigation state
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-link[data-section="segments"]').classList.add('active');

    // Load the segment update page
    loadSegmentUpdateData(segmentId);
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
        ';
    }
}

// Handle domain selection change
async function onDomainChange() {
    const domainSelect = document.getElementById('domain-select');
    const segmentSelect = document.getElementById('segment-select');
    const segmentVariablesDisplay = document.getElementById('segment-variables-display');

    // Clear segment dropdown
    segmentSelect.innerHTML = '<option value="">Select a segment...</option>';
    segmentSelect.disabled = true;

    // Hide variables display
    segmentVariablesDisplay.style.display = 'none';

    const selectedDomainId = domainSelect.value;
    const selectedDomainName = domainSelect.options[domainSelect.selectedIndex].dataset.domainName;

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

    const selectedSegmentId = segmentSelect.value;
    const selectedDomainName = domainSelect.options[domainSelect.selectedIndex].dataset.domainName;

    if (!selectedSegmentId) {
        segmentVariablesDisplay.style.display = 'none';
        return;
    }

    try {
        // Show loading state
        segmentVariablesDisplay.style.display = 'block';
        document.getElementById('variables-container').innerHTML = '<div class="loading">Loading segment variables...</div>';

        // Fetch segment details
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(selectedDomainName)}`);
        const selectedSegment = segments.find(segment => segment.id == selectedSegmentId);

        if (!selectedSegment) {
            throw new Error('Segment not found');
        }

        // Update segment info
        document.getElementById('segment-info-title').textContent = `Variables for "${selectedSegment.name}"`;
        document.getElementById('segment-info-details').innerHTML = `
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

        // Display segment variables
        displaySegmentVariables(selectedSegment);

        console.log(`Loaded variables for segment ${selectedSegment.name}`);

    } catch (error) {
        console.error('Error loading segment variables:', error);
        document.getElementById('variables-container').innerHTML = `
            <div class="error-message">
                <h4>Error Loading Variables</h4>
                <p>${error.message}</p>
                <button class="btn btn-small btn-primary" onclick="onSegmentChange()">Retry</button>
            </div>
        `;
    }
}

// Display segment variables
function displaySegmentVariables(segment) {
    const variablesContainer = document.getElementById('variables-container');
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
        domainSelect.value = targetDomain.domain_id;

        // Trigger domain change to load segments
        await onDomainChange();

        // Select the segment
        const segmentSelect = document.getElementById('segment-select');
        segmentSelect.value = segmentId;

        // Trigger segment change to load variables
        await onSegmentChange();

        console.log(`Preselected segment ${targetSegment.name} from domain ${targetDomain.domain_name}`);

    } catch (error) {
        console.error('Error preselecting segment:', error);
    }
}

// Placeholder functions for variable actions
function addNewVariable(segmentId) {
    alert(`Add new variable to segment ${segmentId} (functionality to be implemented)`);
}

function editVariable(segmentId, variableName) {
    alert(`Edit variable "${variableName}" in segment ${segmentId} (functionality to be implemented)`);
}

function deleteVariable(segmentId, variableName) {
    if (confirm(`Are you sure you want to delete the variable "${variableName}"?`)) {
        alert(`Delete variable "${variableName}" from segment ${segmentId} (functionality to be implemented)`);
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