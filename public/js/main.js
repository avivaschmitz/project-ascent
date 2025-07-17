// Project Ascent - Navigation and Section Management

document.addEventListener('DOMContentLoaded', () => {
    console.log('Project Ascent - Navigation ready!');

    // Initialize navigation
    initializeNavigation();

    // Load initial data for active section (domains)
    loadDomainsData();

    // Test API connection
    testAPIConnection();
});

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
            document.querySelector('.nav-link[data-section="segments"]').classList.add('active');

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
    }
}

// Load data based on section
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'domains':
            loadDomainsData();
            break;
        case 'segments':
            // Future: loadSegmentsData();
            break;
        case 'segment-variables':
            loadSegmentVariablesData();
            break;
        case 'experiments':
            // Future: loadExperimentsData();
            break;
    }
}

// Load and display domains data
async function loadDomainsData() {
    try {
        const contentArea = document.querySelector('#domains-section .content-area');

        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading domains...</div>';

        // Fetch domains from API
        const domains = await apiCall('/api/domains');

        // Generate domains table HTML
        let domainsHTML = `
            <div class="data-header">
                <h3>All Domains (${domains.length})</h3>
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
        console.error('Error loading domains:', error);
        const contentArea = document.querySelector('#domains-section .content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Domains</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadDomainsData()">Retry</button>
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
    // Navigate to segment variables page with prepopulated segment
    showSegmentVariables(segmentId);
}

function editSegment(segmentId) {
    alert(`Edit segment ${segmentId} (functionality to be implemented)`);
}

function createSegmentForDomain(domainId, domainName) {
    alert(`Create new segment for domain ${domainName} (ID: ${domainId}) (functionality to be implemented)`);
}

// Navigate to segment variables page with optional prepopulated segment
function showSegmentVariables(segmentId = null) {
    // Switch to segment variables section
    showSection('segment-variables');

    // Update navigation state
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-link[data-section="segments"]').classList.add('active');

    // Load the segment variables page
    loadSegmentVariablesData(segmentId);
}

// Show Add Domain form
function showAddDomainForm() {
    showSection('add-domain');

    // Set up form submission handler
    const form = document.getElementById('add-domain-form');
    if (form) {
        // Remove any existing event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add new event listener
        newForm.addEventListener('submit', handleAddDomainSubmit);

        // Set up file upload handlers
        setupFileUploadHandlers();
    }
}

// Show Step 2 of Add Domain form
function showAddDomainStep2() {
    showSection('add-domain-step2');

    // Set up form submission handler for step 2
    const form = document.getElementById('add-domain-step2-form');
    if (form) {
        // Remove any existing event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add new event listener
        newForm.addEventListener('submit', handleAddDomainStep2Submit);
    }
}

// Set up file upload handlers to show selected file names
function setupFileUploadHandlers() {
    const fileInputs = [
        { input: 'logo-file', display: 'logo-file-name' },
        { input: 'favicon-file', display: 'favicon-file-name' },
        { input: 'ads-txt-file', display: 'ads-txt-file-name' }
    ];

    fileInputs.forEach(({ input, display }) => {
        const fileInput = document.getElementById(input);
        const fileDisplay = document.getElementById(display);

        if (fileInput && fileDisplay) {
            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    fileDisplay.textContent = e.target.files[0].name;
                    fileDisplay.classList.add('has-file');
                } else {
                    fileDisplay.textContent = 'No file selected';
                    fileDisplay.classList.remove('has-file');
                }
            });
        }
    });
}

// Handle add domain form submission (Step 1)
async function handleAddDomainSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(e.target);
    const domainName = formData.get('domain_name');
    const domainOwnership = formData.get('domain_ownership');
    const contentSubdomain = formData.get('content_subdomain');
    const searchSubdomain = formData.get('search_subdomain');
    const logoFile = formData.get('logo_file');
    const faviconFile = formData.get('favicon_file');
    const adsTxtFile = formData.get('ads_txt_file');

    // Basic validation
    if (!domainName) {
        showFormError('domain-name', 'Please select a domain');
        return;
    }

    if (!domainOwnership) {
        showFormError('domain-ownership', 'Please select domain ownership type');
        return;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;

        // Clear any previous errors
        clearFormErrors();

        // Create domain in database (only save domain_name)
        const domainData = { domain_name: domainName };
        const response = await apiCall('/api/domains', {
            method: 'POST',
            body: JSON.stringify(domainData)
        });

        console.log('Domain created successfully:', response);

        // Store step 1 data for display purposes only (not saved to DB)
        window.domainStep1Data = {
            domain_name: domainName,
            domain_ownership: domainOwnership,
            content_subdomain: contentSubdomain,
            search_subdomain: searchSubdomain,
            logo_file: logoFile ? logoFile.name : null,
            favicon_file: faviconFile ? faviconFile.name : null,
            ads_txt_file: adsTxtFile ? adsTxtFile.name : null,
            created_domain: response.domain // Store the created domain info
        };

        console.log('Step 1 Data:', window.domainStep1Data);

        // Proceed to Step 2
        showAddDomainStep2();

    } catch (error) {
        console.error('Error creating domain:', error);

        // Handle specific error cases
        if (error.message.includes('409') || error.message.includes('already exists')) {
            showFormError('domain-name', 'This domain already exists in the system');
        } else {
            showFormError('domain-name', `Error creating domain: ${error.message}`);
        }
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle step 2 form submission
async function handleAddDomainStep2Submit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(e.target);
    const searchTheme = formData.get('search_theme');

    // Basic validation
    if (!searchTheme) {
        showFormError('search-theme', 'Please select a theme');
        return;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;

        // Clear any previous errors
        clearFormErrors('add-domain-step2-form');

        // Simulate processing time for step 2 (theme config not saved to DB)
        await new Promise(resolve => setTimeout(resolve, 800));

        // Store step 2 data
        window.domainStep2Data = {
            search_theme: searchTheme
        };

        console.log('Step 2 Data:', window.domainStep2Data);

        // Proceed to Step 3
        showAddDomainStep3();

    } catch (error) {
        console.error('Error processing step 2:', error);
        showFormError('search-theme', `Error processing form: ${error.message}`);
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Show Step 3 of Add Domain form
function showAddDomainStep3() {
    showSection('add-domain-step3');

    // Set up form submission handler for step 3
    const form = document.getElementById('add-domain-step3-form');
    if (form) {
        // Remove any existing event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        // Add new event listener
        newForm.addEventListener('submit', handleAddDomainStep3Submit);
    }

    // Load organic segments
    loadOrganicSegments();
}

// Load organic segments for the dropdown
async function loadOrganicSegments() {
    try {
        const modelSegmentSelect = document.getElementById('model-segment-select');

        // Show loading state
        modelSegmentSelect.innerHTML = '<option value="">Loading organic segments...</option>';

        // Fetch organic segments
        const organicSegments = await apiCall('/api/organic-segments');

        // Populate dropdown
        modelSegmentSelect.innerHTML = '<option value="">Select a model organic segment...</option>';

        if (organicSegments.length === 0) {
            modelSegmentSelect.innerHTML = '<option value="">No organic segments found</option>';
            modelSegmentSelect.disabled = true;
        } else {
            organicSegments.forEach(segment => {
                const optionText = `Template ID: ${segment.segment_template_id} - Domain: ${segment.domain_name}`;
                modelSegmentSelect.innerHTML += `<option value="${segment.segment_id}">${optionText}</option>`;
            });
            modelSegmentSelect.disabled = false;
        }

        console.log(`Loaded ${organicSegments.length} organic segments`);

    } catch (error) {
        console.error('Error loading organic segments:', error);
        const modelSegmentSelect = document.getElementById('model-segment-select');
        modelSegmentSelect.innerHTML = '<option value="">Error loading segments</option>';
        modelSegmentSelect.disabled = true;
    }
}

// Handle model segment selection change
async function onModelSegmentChange() {
    const modelSegmentSelect = document.getElementById('model-segment-select');
    const segmentVariablesSection = document.getElementById('segment-variables-section');
    const variablesContainer = document.getElementById('variables-container');

    const selectedSegmentId = modelSegmentSelect.value;

    if (!selectedSegmentId) {
        segmentVariablesSection.style.display = 'none';
        return;
    }

    try {
        // Show loading state
        segmentVariablesSection.style.display = 'block';
        variablesContainer.innerHTML = '<div class="loading">Loading segment variables...</div>';

        // Fetch segment variables
        const variables = await apiCall(`/api/segments/${selectedSegmentId}/variables`);

        // Display editable variables
        displayEditableVariables(variables);

        console.log(`Loaded variables for segment ${selectedSegmentId}:`, variables);

    } catch (error) {
        console.error('Error loading segment variables:', error);
        variablesContainer.innerHTML = `
            <div class="error-message">
                <h4>Error Loading Variables</h4>
                <p>${error.message}</p>
                <button class="btn btn-small btn-primary" onclick="onModelSegmentChange()">Retry</button>
            </div>
        `;
    }
}

// Display editable segment variables
function displayEditableVariables(variables) {
    const variablesContainer = document.getElementById('variables-container');

    let variablesHTML = '';

    if (Object.keys(variables).length === 0) {
        variablesHTML = `
            <div class="no-variables">
                <p>No variables found for the selected segment.</p>
            </div>
        `;
    } else {
        Object.entries(variables).forEach(([key, value], index) => {
            const dataType = typeof value;
            const inputType = dataType === 'boolean' ? 'checkbox' : 'text';
            const inputValue = dataType === 'boolean' ? '' : String(value);
            const isChecked = dataType === 'boolean' && value === true;

            variablesHTML += `
                <div class="variable-editor-row">
                    <div class="variable-info">
                        <label class="variable-label" for="var-${index}">${key}</label>
                        <span class="variable-type-badge type-${dataType}">${dataType}</span>
                    </div>
                    <div class="variable-input">
            `;

            if (dataType === 'boolean') {
                variablesHTML += `
                        <label class="checkbox-wrapper">
                            <input type="checkbox" id="var-${index}" name="variable_${key}" ${isChecked ? 'checked' : ''}>
                            <span class="checkbox-label">${isChecked ? 'True' : 'False'}</span>
                        </label>
                `;
            } else {
                variablesHTML += `
                        <input type="text" id="var-${index}" name="variable_${key}" value="${inputValue}" placeholder="Enter ${key}">
                `;
            }

            variablesHTML += `
                    </div>
                </div>
            `;
        });
    }

    variablesContainer.innerHTML = variablesHTML;

    // Add event listeners for boolean checkboxes to update labels
    const checkboxes = variablesContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.parentNode.querySelector('.checkbox-label');
            label.textContent = this.checked ? 'True' : 'False';
        });
    });
}

// Handle step 3 form submission
async function handleAddDomainStep3Submit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const modelSegmentId = formData.get('model_segment_id');

    // Basic validation
    if (!modelSegmentId) {
        showFormError('model-segment-select', 'Please select a model organic segment', 'add-domain-step3-form');
        return;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating Organic Segment...';
        submitBtn.disabled = true;

        // Clear any previous errors
        clearFormErrors('add-domain-step3-form');

        // Collect variable data from the form
        const variableData = [];
        const variableInputs = e.target.querySelectorAll('[name^="variable_"]');

        variableInputs.forEach(input => {
            const variableName = input.name.replace('variable_', '');
            let variableValue;

            if (input.type === 'checkbox') {
                variableValue = input.checked;
            } else {
                variableValue = input.value;
            }

            variableData.push({
                name: variableName,
                value: variableValue
            });
        });

        console.log('Variable data to save:', variableData);

        // Get the created domain info from step 1
        const createdDomain = window.domainStep1Data?.created_domain;
        if (!createdDomain) {
            throw new Error('Domain information not found. Please start over.');
        }

        // First, get the template_id from the selected model segment
        const modelSegment = await apiCall(`/api/segments?domain_name=any`); // We'll filter this on the client side
        const selectedModelSegment = await apiCall(`/api/segments/${modelSegmentId}/variables`); // This will help us get the template info

        // For now, we'll use template_id = 1 as a placeholder since we need to fetch it properly
        // In a real implementation, you'd want to get this from the selected segment
        const templateId = 1; // This should come from the selected model segment

        // Create the new organic segment
        const segmentData = {
            segment_name: 'organic',
            domain_id: createdDomain.domain_id,
            segment_template_id: templateId,
            segment_variables: variableData
        };

        console.log('Creating segment with data:', segmentData);

        const response = await apiCall('/api/segments', {
            method: 'POST',
            body: JSON.stringify(segmentData)
        });

        console.log('Organic segment created successfully:', response);

        // Show success message
        const domainName = createdDomain.domain_name;
        showFormSuccess(
            `Organic segment created successfully for domain "${domainName}"! (Segment ID: ${response.segment_id})`,
            'add-domain-step3-form'
        );

        // Reset and redirect after delay
        setTimeout(() => {
            // Clear stored data
            delete window.domainStep1Data;
            delete window.domainStep2Data;

            // Reset all forms
            const step1Form = document.getElementById('add-domain-form');
            const step2Form = document.getElementById('add-domain-step2-form');
            const step3Form = document.getElementById('add-domain-step3-form');
            if (step1Form) step1Form.reset();
            if (step2Form) step2Form.reset();
            if (step3Form) step3Form.reset();

            // Reset file displays
            const fileDisplays = ['logo-file-name', 'favicon-file-name', 'ads-txt-file-name'];
            fileDisplays.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = 'No file selected';
                    element.classList.remove('has-file');
                }
            });

            // Go back to domains list
            showSection('domains');

            // Update navigation state
            document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-link[data-section="domains"]').classList.add('active');

            // Reload domains data to show the new domain
            loadDomainsData();
        }, 3000);

    } catch (error) {
        console.error('Error creating organic segment:', error);
        showFormError('model-segment-select', `Error creating organic segment: ${error.message}`, 'add-domain-step3-form');
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Go back to step 2
function goBackToStep2() {
    showSection('add-domain-step2');
}

// Go back to step 1
function goBackToStep1() {
    showSection('add-domain');
}

// Cancel add domain and return to domains list
function cancelAddDomain() {
    // Clear form
    const form = document.getElementById('add-domain-form');
    if (form) {
        form.reset();
        clearFormErrors();
    }

    // Go back to domains section
    showSection('domains');

    // Update navigation state
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-link[data-section="domains"]').classList.add('active');
}

// Form utility functions
function showFormError(fieldName, message, formId = 'add-domain-form') {
    let field = document.getElementById(fieldName);
    let parentNode;

    // Handle radio button groups
    if (fieldName === 'domain-ownership') {
        const radioGroup = document.querySelector('input[name="domain_ownership"]');
        if (radioGroup) {
            parentNode = radioGroup.closest('.form-group');
        }
    } else {
        if (field) {
            parentNode = field.parentNode;
        }
    }

    if (!parentNode) return;

    // Remove existing error
    const existingError = parentNode.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    parentNode.appendChild(errorDiv);

    // Add error styling to field
    if (field) {
        field.style.borderColor = '#dc3545';
    }
}

function showFormSuccess(message, formId = 'add-domain-form') {
    const form = document.getElementById(formId);
    if (!form) return;

    // Remove existing success message
    const existingSuccess = form.querySelector('.form-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }

    // Add success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success';
    successDiv.style.textAlign = 'center';
    successDiv.style.padding = '1rem';
    successDiv.style.marginBottom = '1rem';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.border = '1px solid #c3e6cb';
    successDiv.style.borderRadius = '4px';
    successDiv.style.color = '#155724';
    successDiv.style.fontWeight = '500';
    successDiv.textContent = message;

    form.insertBefore(successDiv, form.firstChild);
}

function clearFormErrors(formId = 'add-domain-form') {
    const form = document.getElementById(formId);
    if (!form) return;

    // Remove all error messages
    const errors = form.querySelectorAll('.form-error');
    errors.forEach(error => error.remove());

    // Remove all success messages
    const successes = form.querySelectorAll('.form-success');
    successes.forEach(success => success.remove());

    // Reset field styles
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.style.borderColor = '';
    });
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

// Load segment variables data
async function loadSegmentVariablesData(preselectedSegmentId = null) {
    try {
        const contentArea = document.querySelector('#segment-variables-section .content-area');

        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading segment variables...</div>';

        // Fetch domains and segments data
        const domains = await apiCall('/api/domains');

        // Generate the segment variables page HTML
        let segmentVariablesHTML = `
            <div class="segment-variables-controls">
                <div class="form-group">
                    <label for="domain-select">Select Domain</label>
                    <select id="domain-select" onchange="onDomainChange()">
                        <option value="">Select a domain...</option>
        `;

        domains.forEach(domain => {
            segmentVariablesHTML += `<option value="${domain.domain_id}" data-domain-name="${domain.domain_name}">${domain.domain_name}</option>`;
        });

        segmentVariablesHTML += `
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

        contentArea.innerHTML = segmentVariablesHTML;

        // If we have a preselected segment, find and select it
        if (preselectedSegmentId) {
            await preselectSegment(preselectedSegmentId, domains);
        }

        console.log('Segment variables page loaded');

    } catch (error) {
        console.error('Error loading segment variables:', error);
        const contentArea = document.querySelector('#segment-variables-section .content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Segment Variables</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadSegmentVariablesData()">Retry</button>
            </div>
        `;
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

// Preselect a segment when navigating from domain view
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