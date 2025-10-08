// ===========================================
// PROBONO DESK - ADMIN DASHBOARD
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
    checkAuthentication();
});

// ===========================================
// DASHBOARD INITIALIZATION
// ===========================================

function initializeAdminDashboard() {
    initializeSidebar();
    initializeVerification();
    initializePlatformManagement();
    initializeUserManagement();
    initializeReports();
    initializeSystemMonitoring();
    loadDashboardData();
    initializeFilters();
}

// ===========================================
// AUTHENTICATION CHECK
// ===========================================

function checkAuthentication() {
    const currentUser = Storage.get('currentUser');
    
    if (!currentUser || currentUser.userType !== 'admin') {
        window.location.href = 'auth.html';
        return;
    }
    
    // Update admin info in sidebar
    updateAdminInfo(currentUser);
}

function updateAdminInfo(user) {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = user.name;
    });
}

// ===========================================
// SIDEBAR NAVIGATION
// ===========================================

function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Navigation click handlers
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.dataset.section;
            
            if (targetSection) {
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                
                // Show target section
                contentSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
                
                // Update page title
                const sectionTitles = {
                    'overview': 'Admin Dashboard',
                    'firm-verification': 'Law Firm Verification',
                    'platform-management': 'Platform Management',
                    'user-management': 'User Management',
                    'reports': 'Abuse Reports',
                    'analytics': 'Platform Analytics',
                    'system': 'System Monitoring'
                };
                
                if (pageTitle) {
                    pageTitle.textContent = sectionTitles[targetSection] || 'Dashboard';
                }
                
                // Load section-specific data
                loadSectionData(targetSection);
            }
        });
    });
    
    // Sidebar toggle for mobile
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }
}

// ===========================================
// FIRM VERIFICATION
// ===========================================

function initializeVerification() {
    // Verification action handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-success') && e.target.textContent.includes('Approve')) {
            const verificationCard = e.target.closest('.verification-card');
            if (verificationCard) {
                handleFirmVerification(verificationCard, 'approve');
            }
        }
        
        if (e.target.closest('.btn-danger') && e.target.textContent.includes('Reject')) {
            const verificationCard = e.target.closest('.verification-card');
            if (verificationCard) {
                handleFirmVerification(verificationCard, 'reject');
            }
        }
        
        if (e.target.closest('.btn-warning') && e.target.textContent.includes('Request More Info')) {
            const verificationCard = e.target.closest('.verification-card');
            if (verificationCard) {
                handleMoreInfoRequest(verificationCard);
            }
        }
        
        if (e.target.textContent.includes('View') && e.target.closest('.verification-actions')) {
            const verificationCard = e.target.closest('.verification-card');
            if (verificationCard) {
                handleViewDetails(verificationCard);
            }
        }
    });
}

async function handleFirmVerification(verificationCard, action) {
    const firmName = verificationCard.querySelector('h3').textContent;
    
    const confirmMessage = action === 'approve'
        ? `Are you sure you want to approve ${firmName}?`
        : `Are you sure you want to reject ${firmName}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;
    
    const actionBtn = verificationCard.querySelector(action === 'approve' ? '.btn-success' : '.btn-danger');
    const originalText = actionBtn.innerHTML;
    
    try {
        showLoading(actionBtn);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (action === 'approve') {
            // Add to verified firms list
            const verifiedFirms = Storage.get('verifiedFirms', []);
            const firmData = {
                name: firmName,
                verifiedAt: new Date().toISOString(),
                status: 'verified'
            };
            verifiedFirms.push(firmData);
            Storage.set('verifiedFirms', verifiedFirms);
            
            showNotification(`${firmName} approved successfully! Firm will be notified.`, 'success');
        } else {
            const reason = prompt('Please provide a reason for rejection:');
            if (reason) {
                showNotification(`${firmName} rejected. Reason: ${reason}`, 'info');
            } else {
                return; // User cancelled
            }
        }
        
        // Remove from verification queue
        verificationCard.style.transition = 'opacity 0.3s ease';
        verificationCard.style.opacity = '0';
        setTimeout(() => {
            verificationCard.remove();
            updateVerificationStats();
        }, 300);
        
    } catch (error) {
        console.error('Verification error:', error);
        showNotification(`Failed to ${action} firm. Please try again.`, 'error');
    } finally {
        hideLoading(actionBtn, originalText);
    }
}

function handleMoreInfoRequest(verificationCard) {
    const firmName = verificationCard.querySelector('h3').textContent;
    
    const infoModal = createInfoRequestModal(firmName);
    document.body.appendChild(infoModal);
    
    // Handle form submission
    const form = infoModal.querySelector('.info-request-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            showLoading(submitBtn);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showNotification('Information request sent to firm.', 'success');
            
            // Add indicator to verification card
            const statusDiv = verificationCard.querySelector('.verification-status');
            const indicator = document.createElement('span');
            indicator.className = 'status-badge info-requested';
            indicator.textContent = 'Info Requested';
            indicator.style.cssText = 'background: #f59e0b; color: white; margin-top: 0.5rem;';
            statusDiv.appendChild(indicator);
            
            infoModal.remove();
            
        } catch (error) {
            console.error('Info request error:', error);
            showNotification('Failed to send request. Please try again.', 'error');
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Close modal handlers
    infoModal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            infoModal.remove();
        });
    });
}

function createInfoRequestModal(firmName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white; padding: 2rem; border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            max-width: 600px; width: 90%;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Request Additional Information</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <form class="info-request-form">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Firm:</label>
                    <input type="text" value="${firmName}" readonly style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        background-color: #f9fafb;
                    ">
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Information Required:</label>
                    <div class="checkbox-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="required_info" value="updated_cac">
                            <span>Updated CAC Registration Certificate</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="required_info" value="bar_certificate">
                            <span>Bar Association Certificate</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="required_info" value="insurance">
                            <span>Professional Indemnity Insurance</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="required_info" value="office_proof">
                            <span>Proof of Office Address</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="required_info" value="lawyer_credentials">
                            <span>Lawyer Credentials & Qualifications</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="additional-notes" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Additional Notes:</label>
                    <textarea id="additional-notes" name="notes" rows="4" placeholder="Any specific requirements or clarifications needed..." style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        resize: vertical; font-family: inherit;
                    "></textarea>
                </div>
                
                <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline close-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Send Request</button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

function handleViewDetails(verificationCard) {
    const firmName = verificationCard.querySelector('h3').textContent;
    const detailsModal = createDetailsModal(firmName, verificationCard);
    document.body.appendChild(detailsModal);
    
    // Close modal handlers
    detailsModal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            detailsModal.remove();
        });
    });
}

function createDetailsModal(firmName, verificationCard) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    const firmMeta = verificationCard.querySelector('.firm-meta').innerHTML;
    const practiceAreas = Array.from(verificationCard.querySelectorAll('.practice-tag')).map(tag => tag.textContent).join(', ');
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white; padding: 2rem; border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Firm Verification Details</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <h4 style="margin-bottom: 1rem;">${firmName}</h4>
                <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div>
                        <h5 style="margin-bottom: 0.5rem; color: #374151;">Firm Information</h5>
                        <div style="font-size: 0.875rem; line-height: 1.5;">${firmMeta}</div>
                    </div>
                    <div>
                        <h5 style="margin-bottom: 0.5rem; color: #374151;">Practice Areas</h5>
                        <p style="font-size: 0.875rem; line-height: 1.5;">${practiceAreas}</p>
                    </div>
                </div>
                
                <div class="documents-section" style="margin-bottom: 1.5rem;">
                    <h5 style="margin-bottom: 0.5rem; color: #374151;">Submitted Documents</h5>
                    <div class="documents-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
                                CAC Registration Certificate.pdf
                            </span>
                            <button class="btn btn-outline btn-sm">Download</button>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
                                Bar Association Certificate.pdf
                            </span>
                            <button class="btn btn-outline btn-sm">Download</button>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem;">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
                                Professional Indemnity Insurance.pdf
                            </span>
                            <button class="btn btn-outline btn-sm">Download</button>
                        </div>
                    </div>
                </div>
                
                <div class="verification-notes" style="margin-bottom: 1.5rem;">
                    <h5 style="margin-bottom: 0.5rem; color: #374151;">Verification Notes</h5>
                    <textarea placeholder="Add verification notes..." rows="3" style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        resize: vertical; font-family: inherit;
                    "></textarea>
                </div>
            </div>
            <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-outline close-modal">Close</button>
                <button class="btn btn-danger">Reject Firm</button>
                <button class="btn btn-success">Approve Firm</button>
            </div>
        </div>
    `;
    
    return modal;
}

function updateVerificationStats() {
    // Update verification count in sidebar badge
    const verificationBadge = document.querySelector('[data-section="firm-verification"] .badge');
    if (verificationBadge) {
        const currentCount = parseInt(verificationBadge.textContent) || 0;
        verificationBadge.textContent = Math.max(0, currentCount - 1);
    }
}

// ===========================================
// PLATFORM MANAGEMENT
// ===========================================

function initializePlatformManagement() {
    // Add new practice area/state handlers
    document.addEventListener('click', function(e) {
        if (e.target.textContent.includes('Add New') && e.target.closest('.management-card')) {
            const cardHeader = e.target.closest('.card-header');
            const cardTitle = cardHeader.querySelector('h3').textContent;
            
            if (cardTitle.includes('Practice Areas')) {
                handleAddPracticeArea();
            } else if (cardTitle.includes('State Coverage')) {
                handleAddState();
            }
        }
        
        if (e.target.textContent === 'Edit' && e.target.closest('.practice-item, .state-item')) {
            const item = e.target.closest('.practice-item, .state-item');
            handleEditItem(item);
        }
        
        if (e.target.textContent === 'Remove' && e.target.closest('.practice-item')) {
            const item = e.target.closest('.practice-item');
            handleRemoveItem(item);
        }
        
        if (e.target.textContent === 'Configure' && e.target.closest('.setting-item')) {
            const settingItem = e.target.closest('.setting-item');
            const settingName = settingItem.querySelector('h4').textContent;
            handleConfigureSetting(settingName);
        }
    });
}

function handleAddPracticeArea() {
    const name = prompt('Enter new practice area name:');
    if (name && name.trim()) {
        showNotification(`Practice area "${name}" added successfully.`, 'success');
        
        // Add to list (in real app, this would update the database)
        const practiceList = document.querySelector('.practice-areas-list');
        if (practiceList) {
            const newItem = document.createElement('div');
            newItem.className = 'practice-item';
            newItem.innerHTML = `
                <span class="practice-name">${name}</span>
                <div class="practice-stats">
                    <span>0 cases</span>
                    <span>•</span>
                    <span>0 firms</span>
                </div>
                <div class="practice-actions">
                    <button class="btn btn-outline btn-sm">Edit</button>
                    <button class="btn btn-danger btn-sm">Remove</button>
                </div>
            `;
            practiceList.appendChild(newItem);
        }
    }
}

function handleAddState() {
    const name = prompt('Enter state name:');
    if (name && name.trim()) {
        showNotification(`State "${name}" added to coverage.`, 'success');
    }
}

function handleEditItem(item) {
    const nameElement = item.querySelector('.practice-name, .state-name h4');
    const currentName = nameElement.textContent;
    const newName = prompt('Edit name:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        nameElement.textContent = newName;
        showNotification('Item updated successfully.', 'success');
    }
}

function handleRemoveItem(item) {
    const nameElement = item.querySelector('.practice-name');
    const name = nameElement.textContent;
    
    if (confirm(`Are you sure you want to remove "${name}"? This action cannot be undone.`)) {
        item.style.transition = 'opacity 0.3s ease';
        item.style.opacity = '0';
        setTimeout(() => {
            item.remove();
            showNotification(`"${name}" removed successfully.`, 'success');
        }, 300);
    }
}

function handleConfigureSetting(settingName) {
    showNotification(`Opening configuration for: ${settingName}`, 'info');
    // In a real app, this would open a detailed configuration modal
}

// ===========================================
// USER MANAGEMENT
// ===========================================

function initializeUserManagement() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterUsers(this.value);
        }, 300));
    }
    
    // User actions
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'View' && e.target.closest('.users-table')) {
            const row = e.target.closest('tr');
            handleViewUser(row);
        }
        
        if (e.target.textContent === 'Suspend' && e.target.closest('.users-table')) {
            const row = e.target.closest('tr');
            handleSuspendUser(row);
        }
    });
}

function filterUsers(searchTerm) {
    const tableRows = document.querySelectorAll('.users-table tbody tr');
    
    tableRows.forEach(row => {
        const userName = row.querySelector('.user-info h4')?.textContent.toLowerCase() || '';
        const userEmail = row.querySelector('.user-info span')?.textContent.toLowerCase() || '';
        
        if (userName.includes(searchTerm.toLowerCase()) || userEmail.includes(searchTerm.toLowerCase())) {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleViewUser(row) {
    const userName = row.querySelector('.user-info h4').textContent;
    const userEmail = row.querySelector('.user-info span').textContent;
    
    showNotification(`Viewing details for: ${userName} (${userEmail})`, 'info');
    // In a real app, this would open a detailed user profile modal
}

async function handleSuspendUser(row) {
    const userName = row.querySelector('.user-info h4').textContent;
    
    if (!confirm(`Are you sure you want to suspend ${userName}?`)) return;
    
    const suspendBtn = row.querySelector('.btn-warning');
    const originalText = suspendBtn.innerHTML;
    
    try {
        showLoading(suspendBtn);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update status
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.className = 'status-badge suspended';
        statusBadge.textContent = 'Suspended';
        statusBadge.style.background = '#ef4444';
        statusBadge.style.color = 'white';
        
        // Update button
        suspendBtn.textContent = 'Unsuspend';
        suspendBtn.className = 'btn btn-success btn-sm';
        
        showNotification(`${userName} suspended successfully.`, 'success');
        
    } catch (error) {
        console.error('Suspend user error:', error);
        showNotification('Failed to suspend user. Please try again.', 'error');
    } finally {
        hideLoading(suspendBtn, originalText);
    }
}

// ===========================================
// ABUSE REPORTS MANAGEMENT
// ===========================================

function initializeReports() {
    // Report action handlers
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'Investigate' && e.target.closest('.report-actions')) {
            const reportCard = e.target.closest('.report-card');
            handleInvestigateReport(reportCard);
        }
        
        if (e.target.textContent === 'Take Action' && e.target.closest('.report-actions')) {
            const reportCard = e.target.closest('.report-card');
            handleTakeAction(reportCard);
        }
        
        if (e.target.textContent === 'Contact Parties' && e.target.closest('.report-actions')) {
            const reportCard = e.target.closest('.report-card');
            handleContactParties(reportCard);
        }
        
        if (e.target.textContent.includes('View Full Report') && e.target.closest('.report-actions')) {
            const reportCard = e.target.closest('.report-card');
            handleViewFullReport(reportCard);
        }
    });
}

function handleInvestigateReport(reportCard) {
    const reportTitle = reportCard.querySelector('h3').textContent;
    
    // Update status
    const statusBadge = reportCard.querySelector('.status-badge');
    statusBadge.className = 'status-badge investigating';
    statusBadge.textContent = 'Under Investigation';
    statusBadge.style.background = '#f59e0b';
    statusBadge.style.color = 'white';
    
    // Update button
    const investigateBtn = reportCard.querySelector('.btn-primary');
    investigateBtn.textContent = 'Continue Investigation';
    
    showNotification(`Investigation started for: ${reportTitle}`, 'success');
}

function handleTakeAction(reportCard) {
    const reportTitle = reportCard.querySelector('h3').textContent;
    const reportedUser = reportCard.querySelector('p:contains("Reported User:"), p[innerHTML*="Reported User:"]');
    
    const actionModal = createActionModal(reportTitle, reportedUser?.textContent || 'Unknown User');
    document.body.appendChild(actionModal);
    
    // Handle action submission
    const form = actionModal.querySelector('.action-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const action = formData.get('action');
        const reason = formData.get('reason');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            showLoading(submitBtn);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showNotification(`Action taken: ${action}. Reason: ${reason}`, 'success');
            
            // Update report status
            const statusBadge = reportCard.querySelector('.status-badge');
            statusBadge.className = 'status-badge resolved';
            statusBadge.textContent = 'Resolved';
            statusBadge.style.background = '#10b981';
            statusBadge.style.color = 'white';
            
            actionModal.remove();
            
        } catch (error) {
            console.error('Action error:', error);
            showNotification('Failed to take action. Please try again.', 'error');
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Close modal handlers
    actionModal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            actionModal.remove();
        });
    });
}

function createActionModal(reportTitle, reportedUser) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white; padding: 2rem; border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            max-width: 600px; width: 90%;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Take Action on Report</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <form class="action-form">
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Report:</label>
                    <input type="text" value="${reportTitle}" readonly style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        background-color: #f9fafb;
                    ">
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Reported User:</label>
                    <input type="text" value="${reportedUser}" readonly style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        background-color: #f9fafb;
                    ">
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Action to Take:</label>
                    <select name="action" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                        <option value="">Select action</option>
                        <option value="warning">Issue Warning</option>
                        <option value="temporary_suspension">Temporary Suspension (7 days)</option>
                        <option value="permanent_suspension">Permanent Suspension</option>
                        <option value="remove_content">Remove Content</option>
                        <option value="dismiss_report">Dismiss Report</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="action-reason" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Reason for Action:</label>
                    <textarea id="action-reason" name="reason" rows="4" required placeholder="Provide a detailed reason for this action..." style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        resize: vertical; font-family: inherit;
                    "></textarea>
                </div>
                
                <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button type="button" class="btn btn-outline close-modal">Cancel</button>
                    <button type="submit" class="btn btn-danger">Take Action</button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

function handleContactParties(reportCard) {
    const reportTitle = reportCard.querySelector('h3').textContent;
    showNotification(`Sending messages to involved parties for: ${reportTitle}`, 'info');
}

function handleViewFullReport(reportCard) {
    const reportTitle = reportCard.querySelector('h3').textContent;
    showNotification(`Opening full report details for: ${reportTitle}`, 'info');
}

// ===========================================
// SYSTEM MONITORING
// ===========================================

function initializeSystemMonitoring() {
    // Real-time updates simulation
    setInterval(updateSystemMetrics, 30000); // Update every 30 seconds
    
    // Initial load
    updateSystemMetrics();
}

function updateSystemMetrics() {
    // Simulate real-time system metrics
    const cpuBar = document.querySelector('.health-metric .metric-bar .metric-fill');
    const memoryBar = document.querySelectorAll('.health-metric .metric-bar .metric-fill')[1];
    const diskBar = document.querySelectorAll('.health-metric .metric-bar .metric-fill')[2];
    
    if (cpuBar) {
        const cpuUsage = 30 + Math.floor(Math.random() * 20); // 30-50%
        cpuBar.style.width = cpuUsage + '%';
        cpuBar.parentNode.nextElementSibling.textContent = cpuUsage + '%';
    }
    
    if (memoryBar) {
        const memoryUsage = 55 + Math.floor(Math.random() * 15); // 55-70%
        memoryBar.style.width = memoryUsage + '%';
        memoryBar.parentNode.nextElementSibling.textContent = memoryUsage + '%';
    }
    
    if (diskBar) {
        const diskUsage = 40 + Math.floor(Math.random() * 10); // 40-50%
        diskBar.style.width = diskUsage + '%';
        diskBar.parentNode.nextElementSibling.textContent = diskUsage + '%';
    }
    
    // Update API metrics
    const apiMetrics = document.querySelectorAll('.api-metric .metric-value');
    if (apiMetrics.length >= 4) {
        apiMetrics[0].textContent = (200 + Math.floor(Math.random() * 100)) + 'ms'; // Response time
        apiMetrics[1].textContent = (1000 + Math.floor(Math.random() * 500)); // Requests per minute
        apiMetrics[2].textContent = (0.01 + Math.random() * 0.02).toFixed(2) + '%'; // Error rate
        apiMetrics[3].textContent = (99.5 + Math.random() * 0.4).toFixed(1) + '%'; // Uptime
    }
}

// ===========================================
// DATA LOADING
// ===========================================

function loadDashboardData() {
    updatePlatformStats();
    loadPendingVerifications();
    updateKPIs();
    loadRecentActivity();
}

function loadSectionData(section) {
    switch (section) {
        case 'firm-verification':
            loadFirmVerifications();
            break;
        case 'platform-management':
            loadPlatformManagement();
            break;
        case 'user-management':
            loadUserManagement();
            break;
        case 'reports':
            loadAbuseReports();
            break;
        case 'analytics':
            loadPlatformAnalytics();
            break;
        case 'system':
            loadSystemMonitoring();
            break;
    }
}

function updatePlatformStats() {
    // Mock platform stats
    const stats = {
        totalUsers: 2847,
        verifiedFirms: 156,
        activeCases: 1234,
        casesResolved: 8965
    };
    
    // Update stat cards
    const statCards = document.querySelectorAll('.admin-stats .stat-card');
    statCards.forEach((card, index) => {
        const statValue = card.querySelector('h3');
        if (statValue) {
            switch (index) {
                case 0: 
                    statValue.textContent = stats.totalUsers.toLocaleString();
                    break;
                case 1: 
                    statValue.textContent = stats.verifiedFirms;
                    break;
                case 2: 
                    statValue.textContent = stats.activeCases.toLocaleString();
                    break;
                case 3: 
                    statValue.textContent = stats.casesResolved.toLocaleString();
                    break;
            }
        }
    });
}

function loadPendingVerifications() {
    console.log('Pending verifications loaded');
}

function updateKPIs() {
    // Update KPI values with mock data
    const kpiValues = document.querySelectorAll('.kpi-value');
    if (kpiValues.length >= 4) {
        kpiValues[0].textContent = '94.2%'; // Case match rate
        kpiValues[1].textContent = '24h'; // Avg response time
        kpiValues[2].textContent = '97.8%'; // User satisfaction
        kpiValues[3].textContent = '89.5%'; // Case closure rate
    }
}

function loadRecentActivity() {
    console.log('Recent activity loaded');
}

function loadFirmVerifications() {
    console.log('Firm verifications section loaded');
}

function loadPlatformManagement() {
    console.log('Platform management section loaded');
}

function loadUserManagement() {
    console.log('User management section loaded');
}

function loadAbuseReports() {
    console.log('Abuse reports section loaded');
}

function loadPlatformAnalytics() {
    // Update analytics charts and metrics
    updateAnalyticsCharts();
}

function updateAnalyticsCharts() {
    // Simulate chart updates
    const geoFills = document.querySelectorAll('.geo-fill');
    geoFills.forEach(fill => {
        const randomWidth = Math.floor(Math.random() * 50 + 10) + '%';
        fill.style.width = randomWidth;
    });
    
    const categoryFills = document.querySelectorAll('.category-fill');
    categoryFills.forEach(fill => {
        const randomWidth = Math.floor(Math.random() * 60 + 20) + '%';
        fill.style.width = randomWidth;
    });
}

function loadSystemMonitoring() {
    updateSystemMetrics();
}

// ===========================================
// FILTERS AND SEARCH
// ===========================================

function initializeFilters() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            applyFilters();
        });
    });
}

function applyFilters() {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;
    
    const sectionId = activeSection.id;
    
    switch (sectionId) {
        case 'firm-verification':
            filterVerifications();
            break;
        case 'user-management':
            filterUserManagement();
            break;
        case 'reports':
            filterReports();
            break;
    }
}

function filterVerifications() {
    const statusFilter = document.querySelectorAll('.filter-select')[0]?.value;
    const stateFilter = document.querySelectorAll('.filter-select')[1]?.value;
    const verificationCards = document.querySelectorAll('.verification-card');
    
    verificationCards.forEach(card => {
        let shouldShow = true;
        
        if (statusFilter && statusFilter !== 'all') {
            const statusBadge = card.querySelector('.status-badge');
            if (!statusBadge?.classList.contains(statusFilter)) {
                shouldShow = false;
            }
        }
        
        if (stateFilter && stateFilter !== 'all' && shouldShow) {
            const firmMeta = card.querySelector('.firm-meta');
            if (!firmMeta?.textContent.toLowerCase().includes(stateFilter.toLowerCase())) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

function filterUserManagement() {
    const typeFilter = document.querySelectorAll('.filter-select')[1]?.value;
    const tableRows = document.querySelectorAll('.users-table tbody tr');
    
    tableRows.forEach(row => {
        let shouldShow = true;
        
        if (typeFilter && typeFilter !== 'all') {
            const userType = row.querySelector('.user-type');
            if (typeFilter === 'seekers' && !userType?.classList.contains('seeker')) {
                shouldShow = false;
            } else if (typeFilter === 'firms' && !userType?.classList.contains('firm')) {
                shouldShow = false;
            } else if (typeFilter === 'suspended') {
                const statusBadge = row.querySelector('.status-badge');
                if (!statusBadge?.textContent.includes('Suspended')) {
                    shouldShow = false;
                }
            }
        }
        
        row.style.display = shouldShow ? 'table-row' : 'none';
    });
}

function filterReports() {
    const statusFilter = document.querySelectorAll('.filter-select')[0]?.value;
    const typeFilter = document.querySelectorAll('.filter-select')[1]?.value;
    const reportCards = document.querySelectorAll('.report-card');
    
    reportCards.forEach(card => {
        let shouldShow = true;
        
        if (statusFilter && statusFilter !== 'all') {
            const statusBadge = card.querySelector('.status-badge');
            if (!statusBadge?.classList.contains(statusFilter)) {
                shouldShow = false;
            }
        }
        
        if (typeFilter && typeFilter !== 'all' && shouldShow) {
            const reportType = card.querySelector('h3')?.textContent.toLowerCase();
            if (!reportType?.includes(typeFilter.replace('_', ' '))) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize additional features when DOM is ready
window.addEventListener('load', function() {
    loadDashboardData();
});