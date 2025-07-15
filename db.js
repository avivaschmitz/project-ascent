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
                <button class="btn btn-primary" onclick="addNewDomain()">Add New Domain</button>
            </div>
            <div class="data-table">
                <table class="domains-table">
                    <thead>
                        <tr>
                            <th>Domain ID</th>
                            <th>Domain Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (domains.length === 0) {
            domainsHTML += `
                        <tr>
                            <td colspan="3" class="no-data">No domains found</td>
                        </tr>
            `;
        } else {
            domains.forEach(domain => {
                domainsHTML += `
                        <tr>
                            <td class="domain-id">${domain.domain_id}</td>
                            <td class="domain-name">${domain.domain_name}</td>
                            <td class="actions">
                                <button class="btn btn-small btn-secondary" onclick="editDomain(${domain.domain_id})">Edit</button>
                                <button class="btn btn-small btn-danger" onclick="deleteDomain(${domain.domain_id})">Delete</button>
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

// Placeholder functions for domain actions
function addNewDomain() {
    alert('Add new domain functionality to be implemented');
}

function editDomain(domainId) {
    alert(`Edit domain ${domainId} functionality to be implemented`);
}

function deleteDomain(domainId) {
    if (confirm('Are you sure you want to delete this domain?')) {
        alert(`Delete domain ${domainId} functionality to be implemented`);
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
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
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
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
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