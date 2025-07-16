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
            // Future: loadSegmentVariablesData();
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

        // Fetch domains from API (this uses the SQL: SELECT domain_id, domain_name FROM domains ORDER BY domain_name ASC)
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
                            <th>Domain ID</th>
                            <th>Domain Name</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (domains.length === 0) {
            domainsHTML += `
                        <tr>
                            <td colspan="2" class="no-data">No domains found</td>
                        </tr>
            `;
        } else {
            domains.forEach(domain => {
                domainsHTML += `
                        <tr>
                            <td class="domain-id">${domain.domain_id}</td>
                            <td class="domain-name">${domain.domain_name}</td>
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

// Handle add domain form submission (no actual submission)
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

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Log form data for debugging (since we're not actually submitting)
        console.log('Form Data (not submitted):', {
            domain_name: domainName,
            domain_ownership: domainOwnership,
            content_subdomain: contentSubdomain,
            search_subdomain: searchSubdomain,
            logo_file: logoFile ? logoFile.name : null,
            favicon_file: faviconFile ? faviconFile.name : null,
            ads_txt_file: adsTxtFile ? adsTxtFile.name : null
        });

        // Show success message
        showFormSuccess('Domain configuration saved successfully! (Note: This is a demo - no data was actually saved)');

        // Reset form after a delay
        setTimeout(() => {
            e.target.reset();
            // Reset file displays
            document.getElementById('logo-file-name').textContent = 'No file selected';
            document.getElementById('favicon-file-name').textContent = 'No file selected';
            document.getElementById('ads-txt-file-name').textContent = 'No file selected';
            document.querySelectorAll('.file-name').forEach(el => el.classList.remove('has-file'));
        }, 2000);

    } catch (error) {
        console.error('Error processing form:', error);
        showFormError('domain-name', `Error processing form: ${error.message}`);
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
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
function showFormError(fieldName, message) {
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

function showFormSuccess(message) {
    const form = document.getElementById('add-domain-form');
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
    successDiv.textContent = message;

    form.insertBefore(successDiv, form.firstChild);
}

function clearFormErrors() {
    const form = document.getElementById('add-domain-form');
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
            throw new Error(`API Error: ${response.status}`);
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
        // You can uncomment this to test your API connection
        // const response = await apiCall('/api/domains');
        // console.log('API connection successful');
    } catch (error) {
        console.log('API connection test skipped or failed:', error.message);
    }
}

// Example usage of your API endpoints:
/*

// Get all domains
const domains = await apiCall('/api/domains');

// Get segments by domain
const segments = await apiCall('/api/segments?domain_name=example.com');

// Create a new segment
const newSegment = await apiCall('/api/segments', {
    method: 'POST',
    body: JSON.stringify({
        segment_name: 'My Segment',
        domain_id: 1,
        segment_template_id: 1,
        segment_variables: [
            { name: 'partner_id', value: 'partner123' }
        ]
    })
});

*/