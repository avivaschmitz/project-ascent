// Clean Slate JavaScript for Project Ascent
// Your backend API endpoints are ready to use!

document.addEventListener('DOMContentLoaded', () => {
    console.log('Project Ascent - Clean slate ready!');

    // Example: Test API connection
    testAPIConnection();
});

// Example function to test your API endpoints
async function testAPIConnection() {
    try {
        const response = await fetch('/api/domains');
        if (response.ok) {
            const domains = await response.json();
            console.log('API Connection successful!');
            console.log('Available domains:', domains);
        }
    } catch (error) {
        console.log('API test:', error.message);
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