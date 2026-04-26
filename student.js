document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user.role !== 'student') {
        redirectBasedOnRole(user.role);
    }

    // Populate Profile Info
    document.getElementById('welcome-msg').textContent = `Welcome, ${user.name}`;
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;

    // Navigation
    const navNewRequest = document.getElementById('nav-new-request');
    const navMyRequests = document.getElementById('nav-my-requests');
    const navDocs = document.getElementById('nav-docs');

    const sectionNewRequest = document.getElementById('section-new-request');
    const sectionMyRequests = document.getElementById('section-my-requests');
    const sectionDocs = document.getElementById('section-docs');

    navNewRequest.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navNewRequest, sectionNewRequest);
    });

    navMyRequests.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navMyRequests, sectionMyRequests);
        loadRequests();
    });

    navDocs.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(navDocs, sectionDocs);
        renderDocs();
    });

    function setActive(nav, section) {
        [navNewRequest, navMyRequests, navDocs].forEach(n => n.classList.remove('active'));
        [sectionNewRequest, sectionMyRequests, sectionDocs].forEach(s => s.classList.add('hidden'));
        nav.classList.add('active');
        section.classList.remove('hidden');
    }

    let globalRequests = []; // Store for docs rendering

    // Initial load for stats
    loadRequests(true);

    // Form Submission
    const requestForm = document.getElementById('request-form');
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const instCode = document.getElementById('instCode').value;
        const remarks = document.getElementById('remarks').value;
        const idProof = document.getElementById('idProof').files[0];
        const admissionProof = document.getElementById('admissionProof').files[0];

        const formData = new FormData();
        formData.append('institutionCode', instCode);
        formData.append('remarks', remarks);
        formData.append('idProof', idProof);
        formData.append('admissionProof', admissionProof);

        try {
            showLoader();
            await apiCall('/student/request', {
                method: 'POST',
                body: formData
            });

            showToast('Request submitted successfully', 'success');
            requestForm.reset();
            
            // Reload stats and switch view
            loadRequests(true);
            navMyRequests.click();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoader();
        }
    });

    // Load Requests
    async function loadRequests(updateStatsOnly = false) {
        try {
            if (!updateStatsOnly) showLoader();
            const requests = await apiCall('/student/requests', { method: 'GET' });
            globalRequests = requests; // Store for docs rendering
            
            // Update Stats
            const total = requests.length;
            const pending = requests.filter(r => r.status === 'pending').length;
            const approved = requests.filter(r => r.status === 'approved').length;

            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-pending').textContent = pending;
            document.getElementById('stat-approved').textContent = approved;

            // Update Progress Bar
            updateProgress(requests);

            // Update Timeline
            updateTimeline(requests);

            if (updateStatsOnly && sectionMyRequests.classList.contains('hidden')) return;

            const tbody = document.getElementById('requests-tbody');
            tbody.innerHTML = '';

            if (requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 40px;">No requests found.</td></tr>';
                return;
            }

            requests.forEach(req => {
                const tr = document.createElement('tr');
                const date = new Date(req.createdAt).toLocaleDateString();
                const instName = req.institutionId ? req.institutionId.name : 'Unknown';
                
                tr.innerHTML = `
                    <td style="font-weight: 500;">${date}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-buildings" style="color: var(--primary-color);"></i>
                            ${instName}
                        </div>
                    </td>
                    <td class="text-muted">${req.remarks || '<span style="opacity: 0.5;">No remarks</span>'}</td>
                    <td><span class="badge badge-${req.status}">${req.status.toUpperCase()}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            showToast('Failed to load requests', 'error');
        } finally {
            if (!updateStatsOnly) hideLoader();
        }
    }

    function updateProgress(requests) {
        const fill = document.getElementById('app-progress-fill');
        const steps = document.querySelectorAll('.progress-steps .step');
        
        // Reset all steps
        steps.forEach((s, idx) => {
            s.classList.remove('active', 'completed');
            const span = s.querySelector('span');
            // Reset labels to default
            if (idx === 0) span.textContent = 'Applied';
            if (idx === 1) span.textContent = 'Review';
            if (idx === 2) span.textContent = 'Verified';
            span.style.color = '';
        });

        if (requests.length === 0) {
            fill.style.width = '0%';
            steps[0].classList.add('active');
            return;
        }

        const latest = requests[0];
        let progress = 0;

        // Step 1: Applied (Always completed if a request exists)
        steps[0].classList.add('completed');

        if (latest.status === 'approved') {
            progress = 100;
            steps[1].classList.add('completed');
            steps[2].classList.add('completed');
        } else if (latest.status === 'pending') {
            progress = 50;
            steps[1].classList.add('active');
        } else if (latest.status === 'rejected') {
            progress = 50;
            steps[1].classList.add('active');
            const span = steps[1].querySelector('span');
            span.textContent = 'Rejected';
            span.style.color = 'var(--danger-color)';
        }

        fill.style.width = `${progress}%`;
    }

    function updateTimeline(requests) {
        const timeline = document.getElementById('activity-timeline');
        if (requests.length === 0) return;

        timeline.innerHTML = '';
        requests.slice(0, 3).forEach(req => {
            const div = document.createElement('div');
            div.className = 'timeline-event';
            const date = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            div.innerHTML = `
                <span class="event-time">${date}</span>
                <span class="event-desc">Applied to ${req.institutionId ? req.institutionId.name : 'Institution'}</span>
                <span class="badge badge-${req.status}" style="font-size: 0.6rem; padding: 2px 6px;">${req.status}</span>
            `;
            timeline.appendChild(div);
        });
    }

    function renderDocs() {
        const grid = document.getElementById('docs-list');
        grid.innerHTML = '';

        if (globalRequests.length === 0) {
            grid.innerHTML = '<p class="text-muted">No documents found.</p>';
            return;
        }

        // Show docs from latest request
        const latest = globalRequests[0];
        const docs = [
            { name: 'ID Proof', path: latest.idProofPath },
            { name: 'Admission Proof', path: latest.admissionProofPath }
        ];

        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.padding = '15px';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'space-between';
            card.style.marginBottom = '10px';

            const getFileUrl = (path) => {
                if (!path) return '#';
                const filename = path.split(/[\\/]/).pop();
                return `http://127.0.0.1:5001/uploads/${filename}`;
            };

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); width: 40px; height: 40px;">
                        <i class="ph ph-file-pdf"></i>
                    </div>
                    <div>
                        <h5 style="margin: 0;">${doc.name}</h5>
                        <small class="text-muted">Uploaded on ${new Date(latest.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
                <a href="${getFileUrl(doc.path)}" target="_blank" class="btn btn-sm">View</a>
            `;
            grid.appendChild(card);
        });
    }
});

