const BASE_URL = 'http://127.0.0.1:5001/api';

const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle non-JSON response (like a 404 HTML page)
            const text = await response.text();
            throw new Error(`Server returned non-JSON response. Status: ${response.status}. ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
};
