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
                    <button class="btn btn