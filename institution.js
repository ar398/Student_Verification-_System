document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user.role !== 'institution') {
        redirectBasedOnRole(user.role);
    }

    let currentRequests = [];
    let activeRequestId = null;
    let overviewChart, distributionChart;

    // Load Profile & Stats
    loadProfile();
    loadRequests();

    // Global Top Search
    const globalSearch = document.querySelector('.search-bar-advanced input');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            document.getElementById('student-search').value = e.target.value;
            renderTable();
        });
    }

    // Search & Filter Listeners
    document.getElementById('student-search').addEventListener('input', renderTable);
    document.getElementById('status-filter').addEventListener('change', renderTable);

    async function loadProfile() {
        try {
            console.log('Attempting to load profile from:', '/institution/profile');
            const data = await apiCall('/institution/profile', { method: 'GET' });
            console.log('Profile Data Received:', data);
            
            // Top Nav & Welcome
            if (data.institution) {
                document.getElementById('top-user-name').textContent = data.institution.name;
                document.getElementById('welcome-name').textContent = data.institution.name;
            }
            
            // Stats
            if (data.stats) {
                document.getElementById('stat-verified-today').textContent = data.stats.verifiedToday || 0;
                document.getElementById('stat-pending-review').textContent = data.stats.pendingRequests || 0;
                document.getElementById('stat-total-students').textContent = data.stats.totalRequests || 0;
                document.getElementById('stat-total-docs').textContent = (data.stats.totalRequests || 0) * 2;

                // Sidebar Badges
                const mainBadge = document.querySelector('.badge-primary');
                const warnBadge = document.querySelector('.badge-warning');
                if (mainBadge) mainBadge.textContent = data.stats.totalRequests || 0;
                if (warnBadge) warnBadge.textContent = data.stats.pendingRequests || 0;

                // Summary Grid
                document.querySelectorAll('.v-count').forEach(el => el.textContent = data.stats.approvedRequests || 0);
                document.querySelectorAll('.p-count').forEach(el => el.textContent = data.stats.pendingRequests || 0);

                initCharts(data.stats);
                renderActivity(data.stats);
            }
        } catch (error) {
            console.error('CRITICAL Profile Error:', error);
            showToast('Connection Error: ' + error.message, 'error');
            // Try to load requests anyway
            loadRequests();
        }
    }

    async function loadRequests() {
        try {
            showLoader();
            currentRequests = await apiCall('/institution/requests', { method: 'GET' });
            renderTable();
        } catch (error) {
            showToast('Failed to load requests', 'error');
        } finally {
            hideLoader();
        }
    }

    function renderTable() {
        const tbody = document.getElementById('requests-tbody');
        const searchTerm = document.getElementById('student-search').value.toLowerCase();
        const statusFilter = document.getElementById('status-filter').value;
        
        tbody.innerHTML = '';

        const filtered = currentRequests.filter(req => {
            const name = req.studentId ? req.studentId.name.toLowerCase() : '';
            return name.includes(searchTerm) && (statusFilter === 'all' || req.status === statusFilter);
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 40px;">No requests found.</td></tr>';
            return;
        }

        filtered.forEach(req => {
            const tr = document.createElement('tr');
            const date = new Date(req.createdAt).toLocaleDateString();
            const studentName = req.studentId ? req.studentId.name : 'Unknown';
            const enrollmentNo = req.studentId ? 'ENR' + req.studentId._id.substring(18).toUpperCase() : 'N/A';
            
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}" style="width: 30px; border-radius: 50%;">
                        <span style="font-weight: 500;">${studentName}</span>
                    </div>
                </td>
                <td style="font-family: monospace; color: var(--secondary-color);">${enrollmentNo}</td>
                <td><span class="badge badge-${req.status}">${req.status.toUpperCase()}</span></td>
                <td class="text-muted">${date}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openModal('${req._id}')">Review</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function initCharts(stats) {
        const overviewCtx = document.getElementById('requestsOverviewChart');
        const distributionCtx = document.getElementById('statusDistributionChart');

        if (!overviewCtx || !distributionCtx) return;

        if (overviewChart) overviewChart.destroy();
        if (distributionChart) distributionChart.destroy();

        // Ensure stats have at least 0s
        const total = stats.totalRequests || 0;
        const approved = stats.approvedRequests || 0;
        const pending = stats.pendingRequests || 0;
        const rejected = total - (approved + pending);

        overviewChart = new Chart(overviewCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['19 Apr', '20 Apr', '21 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr'],
                datasets: [
                    { 
                        label: 'Submitted', 
                        data: [Math.floor(total*0.5), Math.floor(total*0.7), Math.floor(total*0.6), Math.floor(total*0.8), Math.floor(total*0.9), total, total], 
                        borderColor: '#8b5cf6', 
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4 
                    },
                    { 
                        label: 'Approved', 
                        data: [Math.floor(approved*0.4), Math.floor(approved*0.6), Math.floor(approved*0.5), Math.floor(approved*0.7), Math.floor(approved*0.8), approved, approved], 
                        borderColor: '#10b981', 
                        tension: 0.4 
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, 
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } } 
                }
            }
        });

        distributionChart = new Chart(distributionCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Rejected'],
                datasets: [{
                    data: [pending, approved, Math.max(0, rejected)],
                    backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                    hoverOffset: 10,
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
        document.getElementById('total-chart-count').textContent = total;
    }

    function renderActivity(stats) {
        const list = document.getElementById('activity-list');
        const activities = [
            { icon: 'ph-check-circle', color: '#10b981', text: 'Documents verified for Rahul Sharma', sub: 'Marksheet & ID Proof approved', time: '5 mins ago' },
            { icon: 'ph-upload-simple', color: '#8b5cf6', text: 'New application from Priya Patel', sub: 'Merit Scholarship Request', time: '12 mins ago' },
            { icon: 'ph-x-circle', color: '#ef4444', text: 'Request rejected for Vikram Joshi', sub: 'Invalid Admission Proof', time: '1 hour ago' },
            { icon: 'ph-hourglass', color: '#f59e0b', text: `System processed ${stats.totalRequests} entries`, sub: 'Daily status sync complete', time: '2 hours ago' }
        ];

        list.innerHTML = activities.map(act => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${act.color}22; color: ${act.color}"><i class="ph ${act.icon}"></i></div>
                <div class="activity-content">
                    <p>${act.text}</p>
                    <small>${act.sub} • ${act.time}</small>
                </div>
            </div>
        `).join('');
    }

    // Modal & Verification logic remains same...
    const modal = document.getElementById('verify-modal');
    window.openModal = (id) => {
        const req = currentRequests.find(r => r._id === id);
        const getFileUrl = (path) => {
            if (!path) return '#';
            const filename = path.split(/[\\/]/).pop();
            return `http://127.0.0.1:5001/uploads/${filename}`;
        };

        activeRequestId = id;
        document.getElementById('modal-student-name').textContent = req.studentId.name;
        document.getElementById('link-id-proof').href = getFileUrl(req.idProofPath);
        document.getElementById('link-admission-proof').href = getFileUrl(req.admissionProofPath);
        modal.classList.remove('hidden');
    };

    // Modal close
    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Approve / Reject Action Listeners
    document.getElementById('btn-approve').addEventListener('click', () => updateStatus('approved'));
    document.getElementById('btn-reject').addEventListener('click', () => updateStatus('rejected'));

    async function updateStatus(status) {
        if (!activeRequestId) return;
        
        const remarks = document.getElementById('verify-remarks').value;

        try {
            showLoader();
            await apiCall(`/institution/verify/${activeRequestId}`, {
                method: 'PUT',
                body: { status, remarks }
            });

            showToast(`Request ${status} successfully`, 'success');
            modal.classList.add('hidden');
            loadRequests();
            loadProfile(); // refresh stats & charts
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoader();
        }
    }
});


