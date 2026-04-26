document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.getElementById('verify-form');
    const modal = document.getElementById('verify-result-modal');
    const closeBtn = document.getElementById('close-verify-modal');
    const resultContent = document.getElementById('verify-result-content');

    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enrollmentNo = document.getElementById('verify-enrollment').value.trim();
            if (!enrollmentNo) return;

            try {
                showLoader();
                const data = await apiCall(`/student/verify/${enrollmentNo}`);
                
                let contentHTML = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 3rem; margin-bottom: 10px; color: ${data.isVerified ? 'var(--success-color)' : 'var(--warning-color)'};">
                            ${data.isVerified ? '<i class="ph-fill ph-check-circle"></i>' : '<i class="ph-fill ph-clock"></i>'}
                        </div>
                        <h4 style="font-size: 1.2rem; margin-bottom: 5px;">${data.name}</h4>
                        <p class="text-muted">${data.enrollmentNo}</p>
                    </div>
                `;

                if (data.requests && data.requests.length > 0) {
                    contentHTML += `<h5 style="margin-bottom: 10px; color: var(--text-muted);">Verification History</h5>`;
                    contentHTML += `<div style="max-height: 200px; overflow-y: auto; padding-right: 10px;">`;
                    data.requests.forEach(req => {
                        let statusColor = 'var(--text-muted)';
                        if (req.status === 'approved') statusColor = 'var(--success-color)';
                        if (req.status === 'rejected') statusColor = 'var(--danger-color)';
                        if (req.status === 'pending') statusColor = 'var(--warning-color)';

                        contentHTML += `
                            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${req.institution}</strong>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(req.date).toLocaleDateString()}</div>
                                </div>
                                <span style="color: ${statusColor}; font-weight: 500; text-transform: capitalize;">${req.status}</span>
                            </div>
                        `;
                    });
                    contentHTML += `</div>`;
                } else {
                    contentHTML += `<p style="text-align: center; color: var(--text-muted);">No verification requests found.</p>`;
                }

                resultContent.innerHTML = contentHTML;
                modal.style.display = 'flex';

            } catch (error) {
                resultContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <i class="ph-fill ph-x-circle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 10px;"></i>
                        <h4>Not Found</h4>
                        <p class="text-muted">${error.message}</p>
                    </div>
                `;
                modal.style.display = 'flex';
            } finally {
                hideLoader();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
