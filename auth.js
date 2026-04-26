document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Auto redirect if on auth pages
    if (token && user && (window.location.pathname.includes('login') || window.location.pathname.includes('signup'))) {
        redirectBasedOnRole(user.role);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                showLoader();
                const data = await apiCall('/auth/login', {
                    method: 'POST',
                    body: { email, password }
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                
                showToast('Login successful', 'success');
                setTimeout(() => redirectBasedOnRole(data.role), 1000);
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoader();
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = 'student'; // Force role to student
            const phone = document.getElementById('phone').value;
            const enrollmentNo = document.getElementById('enrollmentNo').value;

            const body = { name, email, password, role, phone, enrollmentNo };

            try {
                showLoader();
                const data = await apiCall('/auth/register', {
                    method: 'POST',
                    body
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data));
                
                showToast('Registration successful', 'success');
                setTimeout(() => redirectBasedOnRole(data.role), 1000);
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                hideLoader();
            }
        });
    }
});
