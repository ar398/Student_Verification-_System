// Toasts
const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// Loader
const showLoader = () => {
    const loader = document.createElement('div');
    loader.className = 'loader-container';
    loader.id = 'global-loader';
    loader.innerHTML = '<div class="loader"></div>';
    document.body.appendChild(loader);
};

const hideLoader = () => {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.remove();
    }
};

// Navigation
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
    return JSON.parse(localStorage.getItem('user'));
};

const redirectBasedOnRole = (role) => {
    if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else if (role === 'institution') {
        window.location.href = 'institution-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
};
