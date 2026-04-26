document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user.role !== 'admin') {
        redirectBasedOnRole(user.role);
    }

    document.getElementById('welcome-msg').textContent = `Welcome, ${user.name}`;

    // Navigation
    const navDashboard = document.getElementById('nav-dashboard');
    const navInstitutions = document.getElementById('nav-institutions');
    const navUsers = document.getElementById('nav-users');

    const sectionStats = document.getElementById('section-stats');
    const sectionInstitutions = document.getElementById('section-institutions');
    const sectionUsers = document.getElementById('section-users');

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navDashboard, sectionStats);
        loadStats();
    });

    navInstitutions.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navInstitutions, sectionInstitutions);
        loadInstitutions();
    });

    navUsers.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navUsers, sectionUsers);
        loadUsers();
    });

    function setActive(nav, section) {
        [navDashboard, navInstitutions, navUsers].forEach(n => n.classList.remove('active'));
        [sectionStats, sectionInstitutions, sectionUsers].forEach(s => s.classList.add('hidden'));
        nav.classList.add('active');
        section.classList.remove('hidden');
    }

    let statusChart;

    // Load Stats
    async function loadStats() {
        try {
            showLoader();
            const data = await apiCall('/admin/stats', { method: 'GET' });
            
            document.getElementById('stat-students').textContent = data.users.students;
            document.getElementById('stat-institutions').textContent = data.users.institutions;
            document.getElementById('stat-requests').textContent = data.requests.total;
            document.getElementById('stat-approval-rate').textContent = `${data.requests.approvalRate}%`;

            renderChart(data.requests);
        } catch (error) {
            showToast('Failed to load stats', 'error');
        } finally {
            hideLoader();
        }
    }

    function renderChart(requests) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    label: 'Applications',
                    data: [requests.pending, requests.approved, requests.rejected],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4F46E5',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Institutions Management
    const addInstFormContainer = document.getElementById('add-inst-form-container');
    const addInstForm = document.getElementById('add-inst-form');

    document.getElementById('btn-add-inst').addEventListener('click', () => {
        addInstFormContainer.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-add').addEventListener('click', () => {
        addInstFormContainer.classList.add('hidden');
        addInstForm.reset();
    });

    async function loadInstitutions() {
        try {
            showLoader();
            const institutions = await apiCall('/admin/institutions', { method: 'GET' });
            
            const tbody = document.getElementById('institutions-tbody');
            tbody.innerHTML = '';

            institutions.forEach(inst => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${inst.name}</td>
                    <td style="font-family: monospace; color: var(--secondary-color);">${inst.code}</td>
                    <td>${inst.userId ? inst.userId.email : 'N/A'}</td>
                    <td><span class="badge ${inst.isVerified ? 'badge-approved' : 'badge-pending'}">${inst.isVerified ? 'VERIFIED' : 'PENDING'}</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteInst('${inst._id}')"><i class="ph ph-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            showToast('Failed to load institutions', 'error');
        } finally {
            hideLoader();
        }
    }

    addInstForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const body = {
            name: document.getElementById('inst-name').value,
            code: document.getElementById('inst-code').value,
            email: document.getElementById('inst-email').value,
            password: document.getElementById('inst-password').value,
            address: document.getElementById('inst-address').value
        };

        try {
            showLoader();
            await apiCall('/admin/institutions', {
                method: 'POST',
                body
            });
            showToast('Institution added', 'success');
            addInstForm.reset();
            addInstFormContainer.classList.add('hidden');
            loadInstitutions();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoader();
        }
    });

    window.deleteInst = async (id) => {
        if (!confirm('Are you sure you want to delete this institution?')) return;
        
        try {
            showLoader();
            await apiCall(`/admin/institutions/${id}`, { method: 'DELETE' });
            showToast('Institution deleted', 'success');
            loadInstitutions();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoader();
        }
    };

    // Users Management
    async function loadUsers() {
        try {
            showLoader();
            const users = await apiCall('/admin/users', { method: 'GET' });
            
            const tbody = document.getElementById('users-tbody');
            tbody.innerHTML = '';

            users.forEach(u => {
                const tr = document.createElement('tr');
                const date = new Date(u.createdAt).toLocaleDateString();
                tr.innerHTML = `
                    <td style="font-weight: 600;">${u.name}</td>
                    <td class="text-muted">${u.email}</td>
                    <td><span class="badge ${u.role === 'student' ? 'badge-approved' : 'badge-pending'}">${u.role.toUpperCase()}</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}')"><i class="ph ph-user-minus"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            showToast('Failed to load users', 'error');
        } finally {
            hideLoader();
        }
    }

    window.deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            showLoader();
            await apiCall(`/admin/users/${id}`, { method: 'DELETE' });
            showToast('User removed', 'success');
            loadUsers();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoader();
        }
    };

    // Initial Load
    loadStats();
});
