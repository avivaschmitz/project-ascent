// Hide dropdown when clicking outside
document.addEventListener('click', function(event) {
    const searchInput = document.getElementById('model-segment-search');
    const dropdown = document.getElementById('model-segment-dropdown');

    if (searchInput && dropdown &&
        !searchInput.contains(event.target) &&
        !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }

    // Also handle provision domain dropdown
    const provisionSearchInput = document.getElementById('provision-domain-search');
    const provisionDropdown = document.getElementById('provision-domain-dropdown');

    if (provisionSearchInput && provisionDropdown &&
        !provisionSearchInput.contains(event.target) &&
        !provisionDropdown.contains(event.target)) {
        provisionDropdown.style.display = 'none';
    }
});

// DOMAIN PROVISION FUNCTIONS
async function loadDomainProvisionData() {
    console.log('Loading domain provision data...');

    try {
        const contentArea = document.querySelector('#domain-provision-section .content-area');
        if (!contentArea) {
            console.error('Content area not found for domain-provision-section');
            return;
        }

        // Show loading state
        const provisionInterface = contentArea.querySelector('.domain-provision-interface');
        if (provisionInterface) {
            const provisionControls = provisionInterface.querySelector('.provision-controls');
            if (provisionControls) {
                provisionControls.innerHTML = '<div class="provision-loading">Loading purchased domains...</div>';
            }
        }

        // Load domains with "purchased" status
        const domains = await apiCall('/api/domains');
        const purchasedDomains = domains.filter(domain =>
            domain.status.toLowerCase() === 'purchased'
        );

        console.log('Loaded purchased domains:', purchasedDomains);

        // Restore the provision controls
        if (provisionInterface) {
            loadProvisionInterface(purchasedDomains);
        }

        // Store purchased domains globally
        window.purchasedDomains = purchasedDomains;

        console.log('Domain provision interface loaded successfully');

    } catch (error) {
        console.error('Error loading domain provision data:', error);
        const contentArea = document.querySelector('#domain-provision-section .content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Domain Provision</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadDomainProvisionData()">Retry</button>
                </div>
            `;
        }
    }
}

function loadProvisionInterface(purchasedDomains) {
    const provisionControls = document.querySelector('.provision-controls');
    if (!provisionControls) return;

    if (purchasedDomains.length === 0) {
        provisionControls.innerHTML = `
            <div class="no-data">
                <h3>No Purchased Domains</h3>
                <p>No domains with "purchased" status are available for provisioning.</p>
                <button class="btn btn-primary" onclick="showSection('domain-purchase')">Purchase Domain</button>
            </div>
        `;
        return;
    }

    provisionControls.innerHTML = `
        <div class="form-group">
            <label for="provision-domain-search">Select Domain to Provision *</label>
            <div class="searchable-dropdown">
                <input type="text"
                       id="provision-domain-search"
                       placeholder="Search for a purchased domain..."
                       onkeyup="filterProvisionDomains()"
                       onclick="showProvisionDomainDropdown()"
                       autocomplete="off"
                       required>
                <div id="provision-domain-dropdown" class="dropdown-list" style="display: none;">
                </div>
            </div>
            <span class="form-help">Only domains with "purchased" status are available for provisioning</span>
        </div>
    `;

    // Populate the dropdown
    populateProvisionDomainDropdown(purchasedDomains);
}

function populateProvisionDomainDropdown(domains) {
    const dropdown = document.getElementById('provision-domain-dropdown');
    if (!dropdown) return;

    if (domains.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No purchased domains available</div>';
        return;
    }

    let dropdownHTML = '';
    domains.forEach(domain => {
        dropdownHTML += `
            <div class="dropdown-item" onclick="selectProvisionDomain(${domain.domain_id}, '${domain.domain_name}')" data-domain-id="${domain.domain_id}">
                <div class="provision-domain-item">
                    <span class="provision-domain-name">${domain.domain_name}</span>
                    <span class="provision-domain-status">${domain.status}</span>
                </div>
            </div>
        `;
    });

    dropdown.innerHTML = dropdownHTML;
}

function filterProvisionDomains() {
    const searchInput = document.getElementById('provision-domain-search');
    const dropdown = document.getElementById('provision-domain-dropdown');

    if (!searchInput || !dropdown || !window.purchasedDomains) return;

    const searchTerm = searchInput.value.toLowerCase();

    if (searchTerm.length > 0) {
        dropdown.style.display = 'block';
    }

    const filteredDomains = window.purchasedDomains.filter(domain => {
        return domain.domain_name.toLowerCase().includes(searchTerm);
    });

    populateProvisionDomainDropdown(filteredDomains);

    if (filteredDomains.length === 0 && searchTerm.length > 0) {
        dropdown.innerHTML = '<div class="dropdown-item no-results">No domains match your search</div>';
    }
}

function showProvisionDomainDropdown() {
    const dropdown = document.getElementById('provision-domain-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

function selectProvisionDomain(domainId, domainName) {
    console.log('Selected domain for provision:', { domainId, domainName });

    const searchInput = document.getElementById('provision-domain-search');
    const dropdown = document.getElementById('provision-domain-dropdown');
    const formContainer = document.getElementById('domain-provision-form-container');
    const selectedDomainSpan = document.getElementById('selected-domain-name');

    if (searchInput) {
        searchInput.value = domainName;
    }

    if (dropdown) {
        dropdown.style.display = 'none';
    }

    if (selectedDomainSpan) {
        selectedDomainSpan.textContent = domainName;
    }

    if (formContainer) {
        formContainer.style.display = 'block';
    }

    // Store selected domain for form submission
    window.selectedProvisionDomain = {
        id: domainId,
        name: domainName
    };

    // Clear any existing form data
    clearProvisionForm();

    console.log('Domain provision form displayed for:', domainName);
}

async function provisionDomain(event) {
    event.preventDefault();

    if (!window.selectedProvisionDomain) {
        showProvisionStatus('Please select a domain first', 'error');
        return;
    }

    const submitBtn = document.getElementById('provision-submit-btn');
    const statusMessage = document.getElementById('provision-status-message');

    try {
        // Update UI to show loading state
        if (submitBtn) {
            submitBtn.textContent = 'Provisioning...';
            submitBtn.disabled = true;
        }

        showProvisionStatus('Processing domain provision...', 'loading');

        console.log('Provisioning domain:', window.selectedProvisionDomain);

        // Get form data (even though we're not processing it)
        const formData = {
            contentSubdomain: document.getElementById('content-subdomain')?.value || '',
            searchSubdomain: document.getElementById('search-subdomain')?.value || '',
            theme: document.getElementById('theme-input')?.value || '',
            logoFile: document.getElementById('logo-upload')?.files[0] || null,
            faviconFile: document.getElementById('favicon-upload')?.files[0] || null,
            adsTxtFile: document.getElementById('ads-txt-upload')?.files[0] || null
        };

        console.log('Form data collected (not processed):', {
            contentSubdomain: formData.contentSubdomain,
            searchSubdomain: formData.searchSubdomain,
            theme: formData.theme,
            hasLogo: !!formData.logoFile,
            hasFavicon: !!formData.faviconFile,
            hasAdsTxt: !!formData.adsTxtFile
        });

        // Update domain status to "pending DNS setup"
        const response = await apiCall(`/api/domains/${window.selectedProvisionDomain.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'pending DNS setup' })
        });

        console.log('Domain status updated to pending DNS setup:', response);

        // Show success message
        showProvisionStatus(
            `Domain "${window.selectedProvisionDomain.name}" has been successfully provisioned! Status updated to "pending DNS setup".`,
            'success'
        );

        // Clear form and reset selection after a delay
        setTimeout(() => {
            resetDomainSelection();
            showSection('domain-status'); // Redirect to domain status to see the update
        }, 3000);

    } catch (error) {
        console.error('Error provisioning domain:', error);
        showProvisionStatus(`Error provisioning domain: ${error.message}`, 'error');
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.textContent = 'Provision Domain';
            submitBtn.disabled = false;
        }
    }
}

function showProvisionStatus(message, type) {
    const statusMessage = document.getElementById('provision-status-message');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    // Auto-hide success and loading messages after 5 seconds
    if (type === 'success' || type === 'loading') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

function clearProvisionForm() {
    // Clear text inputs
    const textInputs = [
        'content-subdomain',
        'search-subdomain',
        'theme-input'
    ];

    textInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });

    // Clear file inputs and previews
    const fileInputs = [
        { id: 'logo-upload', preview: 'logo-preview' },
        { id: 'favicon-upload', preview: 'favicon-preview' },
        { id: 'ads-txt-upload', preview: 'ads-txt-preview' }
    ];

    fileInputs.forEach(({ id, preview }) => {
        const input = document.getElementById(id);
        const previewDiv = document.getElementById(preview);
        const uploadDisplay = input?.closest('.file-upload-wrapper')?.querySelector('.file-upload-display');
        const uploadText = uploadDisplay?.querySelector('.file-upload-text');

        if (input) input.value = '';
        if (previewDiv) {
            previewDiv.innerHTML = '';
            previewDiv.classList.remove('show');
        }
        if (uploadDisplay) {
            uploadDisplay.classList.remove('has-file');
        }
        if (uploadText) {
            if (id === 'logo-upload') uploadText.textContent = 'Choose logo image...';
            else if (id === 'favicon-upload') uploadText.textContent = 'Choose favicon image...';
            else if (id === 'ads-txt-upload') uploadText.textContent = 'Choose ads.txt file...';
        }
    });

    // Clear status message
    const statusMessage = document.getElementById('provision-status-message');
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }

    console.log('Provision form cleared');
}

function resetDomainSelection() {
    const searchInput = document.getElementById('provision-domain-search');
    const formContainer = document.getElementById('domain-provision-form-container');

    if (searchInput) {
        searchInput.value = '';
    }

    if (formContainer) {
        formContainer.style.display = 'none';
    }

    // Clear form
    clearProvisionForm();

    // Clear selected domain
    window.selectedProvisionDomain = null;

    console.log('Domain selection reset');
}

function handleFileSelect(input, previewId) {
    const file = input.files[0];
    const previewDiv = document.getElementById(previewId);
    const uploadDisplay = input.closest('.file-upload-wrapper').querySelector('.file-upload-display');
    const uploadText = uploadDisplay.querySelector('.file-upload-text');

    if (!file) {
        previewDiv.innerHTML = '';
        previewDiv.classList.remove('show');
        uploadDisplay.classList.remove('has-file');
        return;
    }

    // Update upload display
    uploadDisplay.classList.add('has-file');
    uploadText.textContent = file.name;

    // Create preview content
    let previewContent = '';

    if (file.type.startsWith('image/')) {
        // Create image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContent = `
                <img src="${e.target.result}" alt="Preview">
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            `;
            previewDiv.innerHTML = previewContent;
            previewDiv.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else {
        // Text file or other
        previewContent = `
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-type">${file.type || 'Unknown type'}</div>
            </div>
        `;
        previewDiv.innerHTML = previewContent;
        previewDiv.classList.add('show');
    }

    console.log('File selected:', file.name, file.size, file.type);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}// Project Ascent - Navigation and Section Management

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
    console.log('showSection called with:', sectionId);
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
    } else {
        console.error(`Section not found: ${sectionId}-section`);
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
    console.log('loadSectionData called with:', sectionId);
    switch(sectionId) {
        case 'domain-status':
            loadDomainStatusData();
            break;
        case 'domain-provision':
            loadDomainProvisionData();
            break;
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
            console.log('No specific data loading required for section:', sectionId);
            break;
    }
}

// DOMAIN PURCHASE FUNCTIONS
async function purchaseDomain(event) {
    event.preventDefault();

    const domainInput = document.getElementById('domain-name-input');
    const submitBtn = document.getElementById('purchase-submit-btn');
    const statusMessage = document.getElementById('purchase-status-message');

    if (!domainInput || !submitBtn || !statusMessage) {
        console.error('Required elements not found for domain purchase');
        return;
    }

    const domainName = domainInput.value.trim();

    if (!domainName) {
        showPurchaseStatus('Please enter a domain name', 'error');
        return;
    }

    // Basic domain validation
    if (!isValidDomainName(domainName)) {
        showPurchaseStatus('Please enter a valid domain name (e.g., example.com)', 'error');
        return;
    }

    try {
        // Update UI to show loading state
        submitBtn.textContent = 'Purchasing...';
        submitBtn.disabled = true;
        showPurchaseStatus('Processing domain purchase...', 'loading');

        console.log('Purchasing domain:', domainName);

        // Make API call to create the domain
        const response = await apiCall('/api/domains', {
            method: 'POST',
            body: JSON.stringify({
                domain_name: domainName,
                status: 'DNS Pending'
            })
        });

        console.log('Domain purchase response:', response);

        // Show success message
        showPurchaseStatus(`Domain "${domainName}" has been successfully added to your account!`, 'success');

        // Clear the form
        clearPurchaseForm();

        // Redirect to domain status page after a short delay
        setTimeout(() => {
            console.log('Redirecting to domain status page');
            showSection('domain-status');
        }, 2000);

    } catch (error) {
        console.error('Error purchasing domain:', error);

        let errorMessage = 'An error occurred while purchasing the domain.';

        // Handle specific error cases
        if (error.message.includes('Domain already exists')) {
            errorMessage = `Domain "${domainName}" already exists in your account.`;
        } else if (error.message.includes('409')) {
            errorMessage = `Domain "${domainName}" is already registered.`;
        } else {
            errorMessage = `Error: ${error.message}`;
        }

        showPurchaseStatus(errorMessage, 'error');

    } finally {
        // Reset button state
        submitBtn.textContent = 'Purchase Domain';
        submitBtn.disabled = false;
    }
}

function showPurchaseStatus(message, type) {
    const statusMessage = document.getElementById('purchase-status-message');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    // Auto-hide success and loading messages after 5 seconds
    if (type === 'success' || type === 'loading') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

function clearPurchaseForm() {
    const domainInput = document.getElementById('domain-name-input');
    const statusMessage = document.getElementById('purchase-status-message');

    if (domainInput) {
        domainInput.value = '';
    }

    if (statusMessage) {
        statusMessage.style.display = 'none';
    }

    console.log('Purchase form cleared');
}

function isValidDomainName(domain) {
    // Basic domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;

    // Additional checks
    if (domain.length > 253) return false;
    if (domain.startsWith('-') || domain.endsWith('-')) return false;
    if (domain.includes('..')) return false;

    return domainRegex.test(domain);
}

// DOMAIN STATUS FUNCTIONS
async function loadDomainStatusData() {
    console.log('Loading domain status data...');

    try {
        const contentArea = document.querySelector('#domain-status-section .content-area');
        if (!contentArea) {
            console.error('Content area not found for domain-status-section');
            return;
        }

        contentArea.innerHTML = '<div class="loading">Loading domain status...</div>';

        // Load domains with their status
        const domains = await apiCall('/api/domains');
        console.log('Loaded domains for status view:', domains);

        if (!domains || domains.length === 0) {
            contentArea.innerHTML = `
                <div class="no-data">
                    <h3>No Domains Found</h3>
                    <p>No domains are available in the system.</p>
                </div>
            `;
            return;
        }

        // Build the domain status interface
        let statusHTML = `
            <div class="data-header">
                <h3>Domain Status Overview</h3>
                <div class="view-actions">
                    <span class="segment-count-badge">${domains.length} domain${domains.length !== 1 ? 's' : ''}</span>
                    <button class="btn btn-secondary btn-small" onclick="refreshDomainStatus()">Refresh</button>
                </div>
            </div>

            <div class="data-table">
                <table class="domains-table">
                    <thead>
                        <tr>
                            <th>Domain ID</th>
                            <th>Domain Name</th>
                            <th>Status</th>
                            <th>Segments</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="domains-status-tbody">
        `;

        // Process each domain and get segment counts
        for (const domain of domains) {
            const segmentCount = await getDomainSegmentCount(domain.domain_name);
            const statusClass = getStatusClass(domain.status);

            statusHTML += `
                <tr>
                    <td class="domain-id">${domain.domain_id}</td>
                    <td class="domain-name">${domain.domain_name}</td>
                    <td class="domain-status">
                        <span class="status-badge ${statusClass}">${domain.status}</span>
                    </td>
                    <td class="segment-count">
                        <span class="segment-count-badge">${segmentCount}</span>
                    </td>
                    <td class="domain-actions">
                        <button class="btn btn-small btn-primary"
                                onclick="viewDomainSegments('${domain.domain_name}')"
                                ${segmentCount === 0 ? 'disabled' : ''}>
                            View Segments
                        </button>
                    </td>
                </tr>
            `;
        }

        statusHTML += `
                    </tbody>
                </table>
            </div>
        `;

        contentArea.innerHTML = statusHTML;
        console.log('Domain status interface loaded successfully');

    } catch (error) {
        console.error('Error loading domain status data:', error);
        const contentArea = document.querySelector('#domain-status-section .content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Domain Status</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadDomainStatusData()">Retry</button>
                </div>
            `;
        }
    }
}

async function getDomainSegmentCount(domainName) {
    try {
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(domainName)}`);
        return segments ? segments.length : 0;
    } catch (error) {
        console.warn(`Could not get segment count for domain ${domainName}:`, error);
        return 0;
    }
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('live')) {
        return 'status-active';
    } else if (statusLower.includes('pending') || statusLower.includes('dns')) {
        return 'status-pending';
    } else if (statusLower.includes('error') || statusLower.includes('failed')) {
        return 'status-error';
    } else {
        return 'status-default';
    }
}

function viewDomainSegments(domainName) {
    console.log('Viewing segments for domain:', domainName);

    // Store the domain to pre-select in the segments view
    window.preselectedDomain = domainName;

    // Navigate to segment view
    showSection('segment-view');
}

function updateDomainStatus(domainId, domainName, currentStatus) {
    console.log('Updating status for domain:', { domainId, domainName, currentStatus });

    const newStatus = prompt(`Update status for domain "${domainName}":\n\nCurrent status: ${currentStatus}\n\nEnter new status:`, currentStatus);

    if (newStatus !== null && newStatus.trim() !== '' && newStatus !== currentStatus) {
        updateDomainStatusAPI(domainId, newStatus.trim());
    }
}

async function updateDomainStatusAPI(domainId, newStatus) {
    try {
        console.log('Updating domain status via API:', { domainId, newStatus });

        const response = await apiCall(`/api/domains/${domainId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });

        console.log('Domain status updated successfully:', response);
        alert(`Domain status updated to "${newStatus}" successfully!`);

        // Refresh the domain status view
        loadDomainStatusData();

    } catch (error) {
        console.error('Error updating domain status:', error);
        alert(`Error updating domain status: ${error.message}`);
    }
}

function refreshDomainStatus() {
    console.log('Refreshing domain status');
    loadDomainStatusData();
}

// SEGMENT VIEW FUNCTIONS
async function loadSegmentViewData() {
    console.log('Loading segment view data...');

    try {
        const contentArea = document.querySelector('#segment-view-section .content-area');
        if (!contentArea) {
            console.error('Content area not found for segment-view-section');
            return;
        }

        contentArea.innerHTML = '<div class="loading">Loading segments...</div>';

        // Load all segments and domains
        const [domains, allSegments] = await Promise.all([
            apiCall('/api/domains'),
            getAllSegments()
        ]);

        console.log('Loaded domains:', domains);
        console.log('Loaded all segments:', allSegments);

        if (!domains || domains.length === 0) {
            contentArea.innerHTML = `
                <div class="no-data">
                    <h3>No Domains Found</h3>
                    <p>No domains are available. Please add domains first.</p>
                </div>
            `;
            return;
        }

        // Build the segment view interface
        let segmentViewHTML = `
            <div class="segment-view-controls">
                <div class="form-group">
                    <label for="view-domain-select">Filter by Domain (Optional)</label>
                    <select id="view-domain-select" onchange="filterSegmentsByDomain()">
                        <option value="">All domains</option>
        `;

        domains.forEach(domain => {
            // Check if this domain should be pre-selected
            const selected = window.preselectedDomain === domain.domain_name ? ' selected' : '';
            segmentViewHTML += `<option value="${domain.domain_name}" data-domain-id="${domain.domain_id}"${selected}>${domain.domain_name}</option>`;
        });

        segmentViewHTML += `
                    </select>
                </div>
                <div class="view-actions">
                    <button class="btn btn-secondary" onclick="refreshSegmentView()">Refresh</button>
                </div>
            </div>

            <div id="segments-display-area">
            </div>
        `;

        contentArea.innerHTML = segmentViewHTML;

        // Store all segments globally for filtering
        window.allSegments = allSegments;

        // Apply pre-selection filter if available
        if (window.preselectedDomain) {
            filterSegmentsByDomain();
            window.preselectedDomain = null; // Clear after use
        } else {
            displaySegments(allSegments);
        }

        console.log('Segment view interface loaded successfully');

    } catch (error) {
        console.error('Error loading segment view data:', error);
        const contentArea = document.querySelector('#segment-view-section .content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Segment View</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadSegmentViewData()">Retry</button>
                </div>
            `;
        }
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
                        name: domain.domain_name,
                        status: domain.status
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

function filterSegmentsByDomain() {
    const domainSelect = document.getElementById('view-domain-select');
    if (!domainSelect || !window.allSegments) return;

    const selectedDomain = domainSelect.value;

    let filteredSegments;
    if (selectedDomain) {
        filteredSegments = window.allSegments.filter(segment =>
            segment.source_domain.name === selectedDomain
        );
    } else {
        filteredSegments = window.allSegments;
    }

    displaySegments(filteredSegments);
}

function displaySegments(segments) {
    const displayArea = document.getElementById('segments-display-area');
    if (!displayArea) return;

    if (!segments || segments.length === 0) {
        displayArea.innerHTML = `
            <div class="no-data">
                <h3>No Segments Found</h3>
                <p>No segments are available for the selected criteria.</p>
                <button class="btn btn-primary" onclick="showSection('segment-create')">Create First Segment</button>
            </div>
        `;
        return;
    }

    // Group segments by domain for better organization
    const segmentsByDomain = {};
    segments.forEach(segment => {
        const domainName = segment.source_domain.name;
        if (!segmentsByDomain[domainName]) {
            segmentsByDomain[domainName] = [];
        }
        segmentsByDomain[domainName].push(segment);
    });

    let segmentsHTML = `
        <div class="data-header">
            <h3>All Segments</h3>
            <div class="view-actions">
                <span class="segment-count-badge">${segments.length} segment${segments.length !== 1 ? 's' : ''}</span>
                <button class="btn btn-primary btn-small" onclick="showSection('segment-create')">Create New</button>
            </div>
        </div>
    `;

    // Display segments grouped by domain
    Object.entries(segmentsByDomain).forEach(([domainName, domainSegments]) => {
        segmentsHTML += `
            <div class="domain-group" style="margin-bottom: 2rem;">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
                    ${domainName} (${domainSegments.length} segment${domainSegments.length !== 1 ? 's' : ''})
                </h4>

                <div class="data-table">
                    <table class="segments-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Segment Name</th>
                                <th>Template</th>
                                <th>Variables</th>
                                <th>Selectors</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        domainSegments.forEach(segment => {
            const variableCount = Object.keys(segment.segment_variables || {}).length;
            const selectorCount = segment.selector_set?.selectors?.length || 0;
            const templateName = segment.segment_template?.name || 'Unknown';

            segmentsHTML += `
                <tr>
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
                        <button class="btn btn-small btn-secondary" onclick="viewSegmentDetails(${segment.id})">Details</button>
                        <button class="btn btn-small btn-primary" onclick="editSegmentVariables('${segment.source_domain.name}', ${segment.id})">Edit</button>
                    </td>
                </tr>
            `;
        });

        segmentsHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    displayArea.innerHTML = segmentsHTML;
    console.log('Segments display completed successfully');
}

function refreshSegmentView() {
    console.log('Refreshing segment view');
    loadSegmentViewData();
}

function viewSegmentDetails(segmentId) {
    console.log('Viewing details for segment:', segmentId);

    if (!window.allSegments) {
        console.error('No segments data available');
        return;
    }

    const segment = window.allSegments.find(s => s.id === segmentId);
    if (!segment) {
        console.error('Segment not found:', segmentId);
        return;
    }

    // Build segment details modal or display
    const details = `
        Segment: ${segment.name}
        ID: ${segment.id}
        Domain: ${segment.source_domain.name}
        Template: ${segment.segment_template?.name || 'Unknown'}
        Variables: ${JSON.stringify(segment.segment_variables, null, 2)}
        Selectors: ${segment.selector_set?.selectors?.length || 0}
    `;

    alert(`Segment Details:\n\n${details}`);
}

function editSegmentVariables(domainName, segmentId) {
    console.log('Editing variables for segment:', segmentId, 'in domain:', domainName);

    // Store the selection for pre-population
    window.pendingSegmentEdit = {
        domainName: domainName,
        segmentId: segmentId
    };

    // Navigate to segment-update
    showSection('segment-update');
}

// SEGMENT UPDATE FUNCTIONS
async function loadSegmentUpdateData() {
    console.log('Loading segment update data...');

    try {
        const contentArea = document.querySelector('#segment-update-section .content-area');
        if (!contentArea) {
            console.error('Content area not found for segment-update-section');
            return;
        }

        contentArea.innerHTML = '<div class="loading">Loading segment update interface...</div>';

        // Load domains first
        const domains = await apiCall('/api/domains');
        console.log('Loaded domains for update:', domains);

        if (!domains || domains.length === 0) {
            contentArea.innerHTML = `
                <div class="no-data">
                    <h3>No Domains Found</h3>
                    <p>No domains are available.</p>
                </div>
            `;
            return;
        }

        // Build the segment update interface
        let updateHTML = `
            <div class="segment-variables-controls">
                <div class="form-group">
                    <label for="update-domain-select">Select Domain</label>
                    <select id="update-domain-select" onchange="loadDomainSegmentsForUpdate()">
                        <option value="">Choose a domain...</option>
        `;

        domains.forEach(domain => {
            updateHTML += `<option value="${domain.domain_name}" data-domain-id="${domain.domain_id}">${domain.domain_name}</option>`;
        });

        updateHTML += `
                    </select>
                </div>
                <div class="form-group">
                    <label for="update-segment-select">Select Segment</label>
                    <select id="update-segment-select" onchange="loadSegmentVariables()" disabled>
                        <option value="">Choose a segment...</option>
                    </select>
                </div>
            </div>

            <div id="segment-variables-display">
                <div class="placeholder-card">
                    <h3>Select Domain and Segment</h3>
                    <p>Choose a domain and segment from the dropdowns above to edit variables.</p>
                </div>
            </div>
        `;

        contentArea.innerHTML = updateHTML;

        // Check if we have pending edit data to pre-populate
        if (window.pendingSegmentEdit) {
            await prePopulateEditForm();
        }

        console.log('Segment update interface loaded successfully');

    } catch (error) {
        console.error('Error loading segment update data:', error);
        const contentArea = document.querySelector('#segment-update-section .content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Segment Update</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadSegmentUpdateData()">Retry</button>
                </div>
            `;
        }
    }
}

async function prePopulateEditForm() {
    if (!window.pendingSegmentEdit) return;

    const { domainName, segmentId } = window.pendingSegmentEdit;
    console.log('Pre-populating edit form for:', { domainName, segmentId });

    try {
        // Set the domain dropdown
        const domainSelect = document.getElementById('update-domain-select');
        if (domainSelect) {
            domainSelect.value = domainName;

            // Load segments for this domain
            await loadDomainSegmentsForUpdate();

            // Set the segment dropdown
            const segmentSelect = document.getElementById('update-segment-select');
            if (segmentSelect) {
                segmentSelect.value = segmentId.toString();

                // Load the segment variables
                loadSegmentVariables();
            }
        }

        // Clear the pending edit data
        window.pendingSegmentEdit = null;

        console.log('Edit form pre-populated successfully');

    } catch (error) {
        console.error('Error pre-populating edit form:', error);
        window.pendingSegmentEdit = null;
    }
}

async function loadDomainSegmentsForUpdate() {
    console.log('loadDomainSegmentsForUpdate called');

    const domainSelect = document.getElementById('update-domain-select');
    const segmentSelect = document.getElementById('update-segment-select');
    const displayArea = document.getElementById('segment-variables-display');

    if (!domainSelect || !segmentSelect) {
        console.error('Required select elements not found');
        return;
    }

    const selectedDomain = domainSelect.value;
    console.log('Selected domain for update:', selectedDomain);

    // Reset segment dropdown
    segmentSelect.innerHTML = '<option value="">Choose a segment...</option>';
    segmentSelect.disabled = true;

    if (displayArea) {
        displayArea.innerHTML = `
            <div class="placeholder-card">
                <h3>Select Domain and Segment</h3>
                <p>Choose a domain and segment from the dropdowns above to edit variables.</p>
            </div>
        `;
    }

    if (!selectedDomain) {
        return;
    }

    try {
        console.log('Fetching segments for domain update:', selectedDomain);
        const segments = await apiCall(`/api/segments?domain_name=${encodeURIComponent(selectedDomain)}`);
        console.log('Received segments for update:', segments);

        if (!segments || segments.length === 0) {
            segmentSelect.innerHTML = '<option value="">No segments found</option>';
            return;
        }

        // Populate segment dropdown
        let segmentOptions = '<option value="">Choose a segment...</option>';
        segments.forEach(segment => {
            segmentOptions += `<option value="${segment.id}" data-segment='${JSON.stringify(segment).replace(/'/g, "&apos;")}'>${segment.name}</option>`;
        });

        segmentSelect.innerHTML = segmentOptions;
        segmentSelect.disabled = false;

        console.log('Segment dropdown populated for update');

    } catch (error) {
        console.error('Error loading segments for domain update:', error);
        segmentSelect.innerHTML = '<option value="">Error loading segments</option>';
    }
}

function loadSegmentVariables() {
    console.log('loadSegmentVariables called');

    const segmentSelect = document.getElementById('update-segment-select');
    const displayArea = document.getElementById('segment-variables-display');

    if (!segmentSelect || !displayArea) {
        console.error('Required elements not found for loading variables');
        return;
    }

    const selectedOption = segmentSelect.options[segmentSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        displayArea.innerHTML = `
            <div class="placeholder-card">
                <h3>Select Domain and Segment</h3>
                <p>Choose a domain and segment from the dropdowns above to edit variables.</p>
            </div>
        `;
        return;
    }

    try {
        const segmentData = JSON.parse(selectedOption.getAttribute('data-segment'));
        console.log('Loading variables for segment:', segmentData);

        displaySegmentVariables(segmentData);

    } catch (error) {
        console.error('Error loading segment variables:', error);
        displayArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Variables</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displaySegmentVariables(segment) {
    console.log('Displaying variables for segment:', segment);

    const displayArea = document.getElementById('segment-variables-display');
    if (!displayArea) {
        console.error('Display area not found');
        return;
    }

    const variables = segment.segment_variables || {};
    const variableCount = Object.keys(variables).length;

    let variablesHTML = `
        <div class="segment-info">
            <h3>Segment: ${segment.name}</h3>
            <div class="segment-detail-item"><strong>ID:</strong> ${segment.id}</div>
            <div class="segment-detail-item"><strong>Template:</strong> ${segment.segment_template?.name || 'Unknown'}</div>
            <div class="segment-detail-item"><strong>Variables:</strong> ${variableCount}</div>
        </div>

        <div class="variables-container">
            <div class="variables-header">
                <h4>Segment Variables</h4>
                <button class="btn btn-small btn-secondary" onclick="addVariableModal(${segment.id})">Add Variable</button>
            </div>
    `;

    if (variableCount === 0) {
        variablesHTML += `
            <div class="no-variables">
                <p>No variables defined for this segment.</p>
                <button class="btn btn-primary" onclick="addVariableModal(${segment.id})">Add First Variable</button>
            </div>
        `;
    } else {
        variablesHTML += `
            <div class="variables-table-container">
                <table class="variables-table">
                    <thead>
                        <tr>
                            <th>Variable Name</th>
                            <th>Value</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        Object.entries(variables).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const dataType = typeof value;

            variablesHTML += `
                <tr>
                    <td class="variable-name">${key}</td>
                    <td class="variable-value"><code>${displayValue}</code></td>
                    <td class="variable-type">
                        <span class="type-badge type-${dataType}">${dataType}</span>
                    </td>
                    <td class="variable-actions">
                        <button class="btn btn-small btn-secondary" onclick="editVariableModal(${segment.id}, '${key}', '${displayValue.replace(/'/g, "\\'")}', '${dataType}')">Edit</button>
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

    variablesHTML += '</div>';

    displayArea.innerHTML = variablesHTML;
    window.currentEditingSegment = segment;
    console.log('Variables displayed successfully');
}

function addVariableModal(segmentId) {
    console.log('Add variable modal for segment:', segmentId);
    const variableName = prompt('Enter variable name:');
    if (variableName) {
        const variableValue = prompt('Enter variable value:');
        if (variableValue !== null) {
            updateSegmentVariable(segmentId, variableName, variableValue);
        }
    }
}

function editVariableModal(segmentId, variableName, currentValue, dataType) {
    console.log('Edit variable modal:', { segmentId, variableName, currentValue, dataType });
    const newValue = prompt(`Edit variable "${variableName}":`, currentValue);
    if (newValue !== null && newValue !== currentValue) {
        updateSegmentVariable(segmentId, variableName, newValue);
    }
}

async function updateSegmentVariable(segmentId, variableName, variableValue) {
    console.log('Updating segment variable:', { segmentId, variableName, variableValue });

    try {
        const response = await apiCall(`/api/segments/${segmentId}/variables/${encodeURIComponent(variableName)}`, {
            method: 'PUT',
            body: JSON.stringify({ variable_value: variableValue })
        });

        console.log('Variable updated successfully:', response);
        alert(`Variable "${variableName}" updated successfully!`);

        // Reload the variables display
        loadSegmentVariables();

    } catch (error) {
        console.error('Error updating variable:', error);
        alert(`Error updating variable: ${error.message}`);
    }
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
        console.log('API Call:', endpoint, options);

        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);
        return data;
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
window.purchaseDomain = purchaseDomain;
window.clearPurchaseForm = clearPurchaseForm;
window.showPurchaseStatus = showPurchaseStatus;
window.isValidDomainName = isValidDomainName;
window.loadDomainStatusData = loadDomainStatusData;
window.viewDomainSegments = viewDomainSegments;
window.updateDomainStatus = updateDomainStatus;
window.refreshDomainStatus = refreshDomainStatus;
window.loadDomainProvisionData = loadDomainProvisionData;
window.filterProvisionDomains = filterProvisionDomains;
window.showProvisionDomainDropdown = showProvisionDomainDropdown;
window.selectProvisionDomain = selectProvisionDomain;
window.provisionDomain = provisionDomain;
window.clearProvisionForm = clearProvisionForm;
window.resetDomainSelection = resetDomainSelection;
window.handleFileSelect = handleFileSelect;
window.loadSegmentViewData = loadSegmentViewData;
window.filterSegmentsByDomain = filterSegmentsByDomain;
window.refreshSegmentView = refreshSegmentView;
window.viewSegmentDetails = viewSegmentDetails;
window.editSegmentVariables = editSegmentVariables;
window.loadSegmentUpdateData = loadSegmentUpdateData;
window.loadDomainSegmentsForUpdate = loadDomainSegmentsForUpdate;
window.loadSegmentVariables = loadSegmentVariables;
window.addVariableModal = addVariableModal;
window.editVariableModal = editVariableModal;
window.updateSegmentVariable = updateSegmentVariable;
window.loadSegmentCreateData = loadSegmentCreateData;
window.filterModelSegments = filterModelSegments;
window.showModelSegmentDropdown = showModelSegmentDropdown;
window.selectModelSegment = selectModelSegment;
window.updateVariableType = updateVariableType;
window.addNewSegmentVariable = addNewSegmentVariable;
window.removeNewSegmentVariable = removeNewSegmentVariable;
window.createNewSegment = createNewSegment;
window.resetSegmentCreation = resetSegmentCreation;