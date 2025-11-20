// Frontend JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('testBtn');
    const resultDiv = document.getElementById('result');

    // Test server connection
    testBtn.addEventListener('click', async () => {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        resultDiv.classList.remove('show', 'success', 'error');

        try {
            const response = await fetch('/health');
            const data = await response.json();

            if (response.ok) {
                showResult('success', `✓ Server is running: ${data.message}`);
            } else {
                showResult('error', '✗ Server responded with an error');
            }
        } catch (error) {
            showResult('error', `✗ Connection failed: ${error.message}`);
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = 'Test Server Connection';
        }
    });

    function showResult(type, message) {
        resultDiv.textContent = message;
        resultDiv.classList.add('show', type);
    }
});

// Utility function for making API calls
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Example usage:
// apiCall('/api/example', { method: 'GET' })
//     .then(data => console.log(data))
//     .catch(error => console.error(error));