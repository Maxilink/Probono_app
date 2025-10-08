// ===========================================
// PROBONO DESK - FIRM DASHBOARD
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeFirmDashboard();
    checkAuthentication();
});

// ===========================================
// DASHBOARD INITIALIZATION
// ===========================================

function initializeFirmDashboard() {
    initializeSidebar();
    initializeCaseRequests();
    initializeMessaging();
    initializeAnalytics();
    loadDashboardData();
    initializeFilters();
}

// ===========================================
// AUTHENTICATION CHECK
// ===========================================

function checkAuthentication() {
    const currentUser = Storage.get('currentUser');
    
    if (!currentUser || currentUser.userType !== 'firm') {
        window.location.href = 'auth.html';
        return;
    }
    
    // Update firm info in sidebar
    updateFirmInfo(currentUser);
}

function updateFirmInfo(user) {
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
                    'overview': 'Firm Dashboard',
                    'case-requests': 'Case Requests',
                    'active-cases': 'Active Cases',
                    'lawyers': 'Firm Lawyers',
                    'analytics': 'Analytics & Reports',
                    'messages': 'Client Messages',
                    'profile': 'Firm Profile'
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
// CASE REQUESTS FUNCTIONALITY
// ===========================================

function initializeCaseRequests() {
    // Accept/Decline button handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-primary') && e.target.textContent.includes('Accept')) {
            const requestCard = e.target.closest('.request-card, .case-request-item');
            if (requestCard) {
                handleCaseAcceptance(requestCard, 'accept');
            }
        }
        
        if (e.target.closest('.btn-outline') && e.target.textContent.includes('Decline')) {
            const requestCard = e.target.closest('.request-card, .case-request-item');
            if (requestCard) {
                handleCaseAcceptance(requestCard, 'decline');
            }
        }
        
        if (e.target.closest('.btn-secondary') && e.target.textContent.includes('Request More Info')) {
            const requestCard = e.target.closest('.request-card');
            if (requestCard) {
                handleMoreInfoRequest(requestCard);
            }
        }
    });
}

async function handleCaseAcceptance(requestCard, action) {
    const caseTitle = requestCard.querySelector('h3').textContent;
    const clientName = requestCard.querySelector('p').textContent.split(' ')[1]; // Extract client name
    
    const confirmMessage = action === 'accept' 
        ? `Are you sure you want to accept the case "${caseTitle}"?`
        : `Are you sure you want to decline the case "${caseTitle}"?`;
    
    if (!confirm(confirmMessage)) return;
    
    const actionBtn = requestCard.querySelector(action === 'accept' ? '.btn-primary' : '.btn-outline');
    const originalText = actionBtn.innerHTML;
    
    try {
        showLoading(actionBtn);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (action === 'accept') {
            // Move to active cases
            const caseData = {
                id: 'CASE-' + Date.now(),
                title: caseTitle,
                client: clientName,
                status: 'accepted',
                acceptedAt: new Date().toISOString(),
                assignedLawyer: 'Emeka Okafor' // Default assignment
            };
            
            const activeCases = Storage.get('firmActiveCases', []);
            activeCases.push(caseData);
            Storage.set('firmActiveCases', activeCases);
            
            showNotification(`Case "${caseTitle}" accepted successfully! Client will be notified.`, 'success');
        } else {
            showNotification(`Case "${caseTitle}" declined. Client will be notified.`, 'info');
        }
        
        // Remove from requests
        requestCard.style.transition = 'opacity 0.3s ease';
        requestCard.style.opacity = '0';
        setTimeout(() => {
            requestCard.remove();
            updateRequestStats();
        }, 300);
        
    } catch (error) {
        console.error('Case action error:', error);
        showNotification(`Failed to ${action} case. Please try again.`, 'error');
    } finally {
        hideLoading(actionBtn, originalText);
    }
}

function handleMoreInfoRequest(requestCard) {
    const caseTitle = requestCard.querySelector('h3').textContent;
    
    const additionalInfo = prompt(`What additional information do you need for the case "${caseTitle}"?`);
    
    if (additionalInfo && additionalInfo.trim()) {
        showNotification('Information request sent to client.', 'success');
        
        // Add indicator to the card
        const requestHeader = requestCard.querySelector('.request-header');
        const indicator = document.createElement('span');
        indicator.className = 'info-requested';
        indicator.textContent = 'Info Requested';
        indicator.style.cssText = 'background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;';
        requestHeader.appendChild(indicator);
    }
}

// ===========================================
// ACTIVE CASES MANAGEMENT
// ===========================================

function initializeActiveCases() {
    // Case status update handlers
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'Update' && e.target.closest('.cases-table')) {
            const row = e.target.closest('tr');
            if (row) {
                handleCaseStatusUpdate(row);
            }
        }
        
        if (e.target.textContent === 'View' && e.target.closest('.cases-table')) {
            const row = e.target.closest('tr');
            if (row) {
                handleCaseView(row);
            }
        }
    });
}

function handleCaseStatusUpdate(row) {
    const caseTitle = row.querySelector('.case-title h4').textContent;
    const currentStatus = row.querySelector('.status-badge').textContent.trim();
    
    const statusOptions = [
        { value: 'accepted', label: 'Accepted' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'awaiting-client', label: 'Awaiting Client' },
        { value: 'closed', label: 'Closed' }
    ];
    
    const modal = createStatusUpdateModal(caseTitle, currentStatus, statusOptions);
    document.body.appendChild(modal);
    
    // Handle status update
    const updateBtn = modal.querySelector('.update-status-btn');
    updateBtn.addEventListener('click', async function() {
        const newStatus = modal.querySelector('#new-status').value;
        const updateNote = modal.querySelector('#update-note').value;
        
        if (newStatus && newStatus !== currentStatus.toLowerCase()) {
            await updateCaseStatus(row, newStatus, updateNote);
        }
        
        modal.remove();
    });
    
    // Close modal
    modal.querySelector('.close-modal').addEventListener('click', function() {
        modal.remove();
    });
}

function createStatusUpdateModal(caseTitle, currentStatus, statusOptions) {
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
            max-width: 500px; width: 90%;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Update Case Status</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 1rem;"><strong>Case:</strong> ${caseTitle}</p>
                <p style="margin-bottom: 1rem;"><strong>Current Status:</strong> ${currentStatus}</p>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label for="new-status" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">New Status:</label>
                    <select id="new-status" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                        ${statusOptions.map(option => `
                            <option value="${option.value}" ${option.label === currentStatus ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label for="update-note" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Update Note (Optional):</label>
                    <textarea id="update-note" rows="3" placeholder="Add a note about this status update..." style="
                        width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;
                        resize: vertical; font-family: inherit;
                    "></textarea>
                </div>
                
                <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-outline close-modal">Cancel</button>
                    <button class="btn btn-primary update-status-btn">Update Status</button>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

async function updateCaseStatus(row, newStatus, updateNote) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update UI
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.className = `status-badge ${newStatus}`;
        statusBadge.textContent = formatStatus(newStatus);
        
        // Update last update time
        const lastUpdateCell = row.cells[4]; // Assuming 5th column is last update
        lastUpdateCell.textContent = 'Just now';
        
        showNotification('Case status updated successfully!', 'success');
        
        if (updateNote) {
            showNotification('Update note sent to client.', 'info');
        }
        
    } catch (error) {
        console.error('Status update error:', error);
        showNotification('Failed to update case status. Please try again.', 'error');
    }
}

function handleCaseView(row) {
    const caseTitle = row.querySelector('.case-title h4').textContent;
    showNotification(`Viewing details for case: ${caseTitle}`, 'info');
    // In a real app, this would open a detailed case view
}

// ===========================================
// MESSAGING FUNCTIONALITY
// ===========================================

function initializeMessaging() {
    const messageInput = document.querySelector('.message-input');
    const sendBtn = document.querySelector('.send-btn');
    const conversationItems = document.querySelectorAll('.conversation-item');
    
    // Conversation selection
    conversationItems.forEach(item => {
        item.addEventListener('click', function() {
            conversationItems.forEach(conv => conv.classList.remove('active'));
            this.classList.add('active');
            loadConversation(this.dataset.conversationId || 'default');
        });
    });
    
    // Send message
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Attachment handling
    const attachmentBtn = document.querySelector('.attachment-btn');
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
            fileInput.multiple = true;
            
            fileInput.addEventListener('change', function(e) {
                handleMessageAttachments(e.target.files);
            });
            
            fileInput.click();
        });
    }
}

function sendMessage() {
    const messageInput = document.querySelector('.message-input');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (!messageInput || !chatMessages) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${messageText}</p>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;
    
    // Add to chat
    chatMessages.appendChild(messageElement);
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Simulate client response (for demo)
    setTimeout(() => {
        simulateClientResponse();
    }, 1000 + Math.random() * 2000);
}

function simulateClientResponse() {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    const responses = [
        "Thank you for the update. When can we schedule the consultation?",
        "I have the additional documents ready. How should I send them to you?",
        "That sounds good. What are the next steps in the process?",
        "I appreciate your quick response. I'll gather the requested information.",
        "Perfect! I'm available for a meeting anytime this week."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message received';
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${response}</p>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleMessageAttachments(files) {
    Array.from(files).forEach(file => {
        if (validateAttachment(file)) {
            showNotification(`Attachment "${file.name}" added to message.`, 'success');
        }
    });
}

function validateAttachment(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (file.size > maxSize) {
        showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showNotification(`File type "${file.type}" is not supported.`, 'error');
        return false;
    }
    
    return true;
}

// ===========================================
// ANALYTICS FUNCTIONALITY
// ===========================================

function initializeAnalytics() {
    // Date range picker
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            updateAnalytics();
        });
    });
    
    // Apply button
    const applyBtn = document.querySelector('.date-range-picker .btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            updateAnalytics();
            showNotification('Analytics updated for selected date range.', 'success');
        });
    }
}

function updateAnalytics() {
    // Simulate analytics update
    console.log('Updating analytics...');
    
    // Update metric bars with random values for demo
    const metricBars = document.querySelectorAll('.metric-fill');
    metricBars.forEach(bar => {
        const randomWidth = Math.floor(Math.random() * 100) + '%';
        bar.style.width = randomWidth;
    });
    
    // Update response metrics
    const responseMetrics = document.querySelectorAll('.response-metric .metric-value');
    if (responseMetrics.length >= 3) {
        responseMetrics[0].textContent = (15 + Math.floor(Math.random() * 10)) + 'h';
        responseMetrics[1].textContent = (85 + Math.floor(Math.random() * 10)) + '%';
        responseMetrics[2].textContent = (90 + Math.floor(Math.random() * 10)) + '%';
    }
}

// ===========================================
// DATA LOADING
// ===========================================

function loadDashboardData() {
    updateFirmStats();
    loadRecentRequests();
    updatePerformanceMetrics();
}

function loadSectionData(section) {
    switch (section) {
        case 'case-requests':
            loadCaseRequests();
            break;
        case 'active-cases':
            loadActiveCases();
            break;
        case 'lawyers':
            loadLawyers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

function updateFirmStats() {
    // Mock stats
    const stats = {
        newRequests: 8,
        activeCases: 12,
        completedCases: 85,
        avgResponseTime: '18h'
    };
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        const statValue = card.querySelector('h3');
        if (statValue) {
            switch (index) {
                case 0: statValue.textContent = stats.newRequests; break;
                case 1: statValue.textContent = stats.activeCases; break;
                case 2: statValue.textContent = stats.completedCases; break;
                case 3: statValue.textContent = stats.avgResponseTime; break;
            }
        }
    });
}

function updateRequestStats() {
    // Update request count in sidebar badge
    const requestBadge = document.querySelector('[data-section="case-requests"] .badge');
    if (requestBadge) {
        const currentCount = parseInt(requestBadge.textContent) || 0;
        requestBadge.textContent = Math.max(0, currentCount - 1);
    }
}

function loadRecentRequests() {
    // Recent requests are already in the template
    console.log('Recent requests loaded');
}

function updatePerformanceMetrics() {
    // Performance metrics are already in the template
    console.log('Performance metrics loaded');
}

function loadCaseRequests() {
    console.log('Case requests section loaded');
}

function loadActiveCases() {
    const activeCases = Storage.get('firmActiveCases', []);
    const casesTable = document.querySelector('.cases-table tbody');
    
    if (casesTable && activeCases.length > 0) {
        // Add accepted cases to table
        activeCases.forEach(caseItem => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="case-title">
                        <h4>${caseItem.title}</h4>
                        <span class="case-category">New Case</span>
                    </div>
                </td>
                <td>${caseItem.client}</td>
                <td>
                    <div class="lawyer-info">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="Lawyer">
                        <span>${caseItem.assignedLawyer}</span>
                    </div>
                </td>
                <td><span class="status-badge ${caseItem.status}">${formatStatus(caseItem.status)}</span></td>
                <td>${formatDate(caseItem.acceptedAt)}</td>
                <td>
                    <button class="btn btn-outline btn-sm">View</button>
                    <button class="btn btn-primary btn-sm">Update</button>
                </td>
            `;
            casesTable.appendChild(row);
        });
    }
}

function loadLawyers() {
    console.log('Lawyers section loaded');
}

function loadAnalytics() {
    updateAnalytics();
}

function loadMessages() {
    console.log('Messages section loaded');
}

function loadProfile() {
    const currentUser = Storage.get('currentUser');
    if (!currentUser) return;
    
    // Populate profile form
    const firmNameField = document.getElementById('firm-name');
    const firmEmailField = document.getElementById('firm-email');
    
    if (firmNameField) firmNameField.value = currentUser.name;
    if (firmEmailField) firmEmailField.value = currentUser.email;
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
    
    if (sectionId === 'case-requests') {
        filterCaseRequests();
    } else if (sectionId === 'active-cases') {
        filterActiveCases();
    }
}

function filterCaseRequests() {
    const categoryFilter = document.querySelectorAll('.filter-select')[0]?.value;
    const urgencyFilter = document.querySelectorAll('.filter-select')[1]?.value;
    const requestCards = document.querySelectorAll('.request-card');
    
    requestCards.forEach(card => {
        let shouldShow = true;
        
        if (categoryFilter && categoryFilter !== 'all') {
            // Check if card matches category filter
            const categoryText = card.querySelector('.request-meta p')?.textContent;
            if (!categoryText?.toLowerCase().includes(categoryFilter.toLowerCase().replace('-', ' '))) {
                shouldShow = false;
            }
        }
        
        if (urgencyFilter && urgencyFilter !== 'all' && shouldShow) {
            const urgencyTag = card.querySelector('.urgency-tag');
            if (!urgencyTag?.classList.contains(urgencyFilter)) {
                shouldShow = false;
            }
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
}

function filterActiveCases() {
    const statusFilter = document.querySelectorAll('.filter-select')[0]?.value;
    const lawyerFilter = document.querySelectorAll('.filter-select')[1]?.value;
    const tableRows = document.querySelectorAll('.cases-table tbody tr');
    
    tableRows.forEach(row => {
        let shouldShow = true;
        
        if (statusFilter && statusFilter !== 'all') {
            const statusBadge = row.querySelector('.status-badge');
            if (!statusBadge?.classList.contains(statusFilter)) {
                shouldShow = false;
            }
        }
        
        if (lawyerFilter && lawyerFilter !== 'all' && shouldShow) {
            const lawyerName = row.querySelector('.lawyer-info span')?.textContent;
            if (!lawyerName?.toLowerCase().includes(lawyerFilter.toLowerCase().replace('-', ' '))) {
                shouldShow = false;
            }
        }
        
        row.style.display = shouldShow ? 'table-row' : 'none';
    });
}

// ===========================================
// LAWYER MANAGEMENT
// ===========================================

function initializeLawyerManagement() {
    // Add lawyer button
    const addLawyerBtn = document.querySelector('.btn[onclick*="Add Lawyer"], .btn:contains("Add Lawyer")');
    if (addLawyerBtn) {
        addLawyerBtn.addEventListener('click', function() {
            showAddLawyerModal();
        });
    }
    
    // Lawyer card actions
    document.addEventListener('click', function(e) {
        if (e.target.textContent === 'Assign Case' && e.target.closest('.lawyer-card')) {
            const lawyerCard = e.target.closest('.lawyer-card');
            const lawyerName = lawyerCard.querySelector('h3').textContent;
            handleCaseAssignment(lawyerName);
        }
    });
}

function showAddLawyerModal() {
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
            max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
        ">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Add New Lawyer</h3>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <form class="add-lawyer-form">
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">First Name</label>
                        <input type="text" name="firstName" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Last Name</label>
                        <input type="text" name="lastName" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                    </div>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
                        <input type="email" name="email" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Position</label>
                        <select name="position" required style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;">
                            <option value="">Select position</option>
                            <option value="Senior Partner">Senior Partner</option>
                            <option value="Partner">Partner</option>
                            <option value="Associate">Associate</option>
                            <option value="Junior Associate">Junior Associate</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Specializations</label>
                    <div class="checkbox-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Employment Law">
                            <span>Employment Law</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Civil Rights">
                            <span>Civil Rights</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Contract Law">
                            <span>Contract Law</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Family Law">
                            <span>Family Law</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Criminal Law">
                            <span>Criminal Law</span>
                        </label>
                        <label class="checkbox-label" style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="specializations" value="Immigration">
                            <span>Immigration</span>
                        </label>
                    </div>
                </div>
                
                <div class="modal-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-outline close-modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Lawyer</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('.add-lawyer-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            showLoading(submitBtn);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const specializations = formData.getAll('specializations');
            
            if (specializations.length === 0) {
                showNotification('Please select at least one specialization.', 'warning');
                return;
            }
            
            showNotification('Lawyer added successfully!', 'success');
            modal.remove();
            
        } catch (error) {
            console.error('Add lawyer error:', error);
            showNotification('Failed to add lawyer. Please try again.', 'error');
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });
    
    // Close modal handlers
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.remove();
        });
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function handleCaseAssignment(lawyerName) {
    showNotification(`Case assignment feature for ${lawyerName} - This would open a case selection modal.`, 'info');
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function formatStatus(status) {
    const statusMap = {
        'submitted': 'Submitted',
        'accepted': 'Accepted',
        'in-progress': 'In Progress',
        'awaiting-client': 'Awaiting Client',
        'closed': 'Closed',
        'declined': 'Declined'
    };
    return statusMap[status] || status;
}

function loadConversation(conversationId) {
    console.log('Loading conversation:', conversationId);
}

// Initialize additional features when DOM is ready
window.addEventListener('load', function() {
    initializeActiveCases();
    initializeLawyerManagement();
    loadDashboardData();
});