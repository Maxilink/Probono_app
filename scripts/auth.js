// ===========================================
// PROBONO DESK - AUTHENTICATION PAGE
// ===========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    handleURLParams();
});

// ===========================================
// AUTHENTICATION INITIALIZATION
// ===========================================

function initializeAuth() {
    const userTypeOptions = document.querySelectorAll('.user-type-option');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const userTypeSelection = document.getElementById('user-type-selection');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToSignin = document.getElementById('switch-to-signin');
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    
    let currentUserType = null;
    let isSignupMode = false;
    
    // User type selection
    userTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            userTypeOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            this.classList.add('selected');
            currentUserType = this.dataset.type;
            
            // Show appropriate form after selection
            setTimeout(() => {
                userTypeSelection.style.display = 'none';
                
                if (isSignupMode) {
                    showSignupForm(currentUserType);
                } else {
                    showSigninForm();
                }
            }, 300);
        });
    });
    
    // Form switching
    if (switchToSignup) {
        switchToSignup.addEventListener('click', function(e) {
            e.preventDefault();
            isSignupMode = true;
            signinForm.style.display = 'none';
            userTypeSelection.style.display = 'block';
            updateAuthHeader('Create Your Account', 'Join our platform to access free legal aid');
        });
    }
    
    if (switchToSignin) {
        switchToSignin.addEventListener('click', function(e) {
            e.preventDefault();
            isSignupMode = false;
            signupForm.style.display = 'none';
            userTypeSelection.style.display = 'block';
            updateAuthHeader('Sign In to Your Account', 'Access free legal aid or manage your law firm');
        });
    }
    
    // Form submissions
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Practice areas selection for firms
    const practiceCheckboxes = document.querySelectorAll('input[name="practiceAreas"]');
    practiceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedBoxes = document.querySelectorAll('input[name="practiceAreas"]:checked');
            if (checkedBoxes.length === 0) {
                showNotification('Please select at least one practice area', 'warning');
            }
        });
    });
    
    // File upload handling
    const fileInput = document.getElementById('firm-cac-document');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                validateFile(file);
            }
        });
    }
    
    // Password strength validation
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.name === 'password') {
            input.addEventListener('input', function() {
                validatePasswordStrength(this.value);
            });
        }
    });
    
    // Confirm password validation
    const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
    confirmPasswordInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const passwordField = input.closest('form').querySelector('input[name="password"]');
            if (passwordField && this.value !== passwordField.value) {
                showFieldError(this, 'Passwords do not match');
            } else {
                clearFieldError(this);
            }
        });
    });
}

// Test account functions for development
window.fillTestUser = function() {
    document.querySelector('[data-type="user"]').click();
    setTimeout(() => {
        document.getElementById('user-firstname').value = 'John';
        document.getElementById('user-lastname').value = 'Doe';
        document.getElementById('user-email').value = 'user@test.com';
        document.getElementById('user-phone').value = '+2348012345678';
        document.getElementById('user-state').value = 'lagos';
        document.getElementById('user-password').value = 'password123';
        document.getElementById('user-confirm-password').value = 'password123';
    }, 500);
};

window.fillTestFirm = function() {
    document.querySelector('[data-type="firm"]').click();
    setTimeout(() => {
        document.getElementById('firm-name').value = 'Test Law Firm';
        document.getElementById('firm-email').value = 'firm@test.com';
        document.getElementById('firm-phone').value = '+2348012345678';
        document.getElementById('firm-address').value = 'Test Address, Lagos';
        document.getElementById('firm-state').value = 'lagos';
        document.getElementById('firm-cac').value = 'RC123456';
        document.getElementById('firm-password').value = 'password123';
        document.getElementById('firm-confirm-password').value = 'password123';
        // Check first practice area
        document.querySelector('input[name="practiceAreas"]').checked = true;
    }, 500);
};

window.fillTestAdmin = function() {
    const emailField = document.getElementById('signin-email');
    const passwordField = document.getElementById('signin-password');
    if (emailField && passwordField) {
        emailField.value = 'admin@test.com';
        passwordField.value = 'admin123';
    }
};

// Helper functions
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#ef4444';
    field.style.backgroundColor = '#fef2f2';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorElement);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    field.style.backgroundColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function showLoading(element) {
    if (element) {
        element.disabled = true;
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
}

function hideLoading(element, originalText) {
    if (element) {
        element.disabled = false;
        element.innerHTML = originalText;
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Storage utility class
class Storage {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
    
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
}

// ===========================================
// URL PARAMETER HANDLING
// ===========================================

function handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const type = urlParams.get('type');
    
    if (mode === 'signup') {
        isSignupMode = true;
        updateAuthHeader('Create Your Account', 'Join our platform to access free legal aid');
        
        if (type === 'user' || type === 'firm') {
            // Pre-select user type
            const option = document.querySelector(`[data-type="${type}"]`);
            if (option) {
                option.click();
            }
        }
    }
}

// ===========================================
// FORM DISPLAY FUNCTIONS
// ===========================================

function showSigninForm() {
    document.getElementById('user-type-selection').style.display = 'none';
    document.getElementById('signin-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    updateAuthHeader('Sign In to Your Account', 'Access free legal aid or manage your law firm');
}

function showSignupForm(userType) {
    document.getElementById('user-type-selection').style.display = 'none';
    document.getElementById('signin-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    
    // Show appropriate signup section
    const userSignup = document.getElementById('user-signup');
    const firmSignup = document.getElementById('firm-signup');
    
    if (userType === 'user') {
        userSignup.style.display = 'block';
        firmSignup.style.display = 'none';
        updateAuthHeader('Create User Account', 'Join to access free legal aid services');
    } else if (userType === 'firm') {
        userSignup.style.display = 'none';
        firmSignup.style.display = 'block';
        updateAuthHeader('Register Law Firm', 'Join to provide pro bono legal services');
    }
}

function updateAuthHeader(title, subtitle) {
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    
    if (authTitle) authTitle.textContent = title;
    if (authSubtitle) authSubtitle.textContent = subtitle;
}

// ===========================================
// FORM HANDLERS
// ===========================================

async function handleSignin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Validate form
    if (!validateSigninForm(email, password)) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        showLoading(submitBtn);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock authentication logic
        const userData = {
            email: email,
            userType: email.includes('firm') ? 'firm' : email.includes('admin') ? 'admin' : 'user',
            name: email.includes('firm') ? 'Okafor & Associates' : email.includes('admin') ? 'Admin User' : 'Chidi Okwu',
            loginTime: new Date().toISOString()
        };
        
        // Store user data
        Storage.set('currentUser', userData);
        if (remember) {
            Storage.set('rememberUser', true);
        }
        
        showNotification('Sign in successful! Redirecting...', 'success');
        
        // Redirect based on user type
        setTimeout(() => {
            if (userData.userType === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (userData.userType === 'firm') {
                window.location.href = 'firm-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Signin error:', error);
        showNotification('Sign in failed. Please check your credentials.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userType = document.getElementById('user-signup').style.display !== 'none' ? 'user' : 'firm';
    
    // Validate form based on user type
    if (!validateSignupForm(formData, userType)) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        showLoading(submitBtn);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (userType === 'firm') {
            showNotification('Registration submitted! Your firm will be verified within 24-48 hours.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            const userData = {
                email: formData.get('email'),
                userType: 'user',
                name: `${formData.get('firstName')} ${formData.get('lastName')}`,
                loginTime: new Date().toISOString()
            };
            
            Storage.set('currentUser', userData);
            showNotification('Account created successfully! Redirecting to dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        hideLoading(submitBtn, originalText);
    }
}

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

function validateSigninForm(email, password) {
    let isValid = true;
    
    // Email validation
    if (!email || !validateEmail(email)) {
        showFieldError(document.getElementById('signin-email'), 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(document.getElementById('signin-email'));
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showFieldError(document.getElementById('signin-password'), 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearFieldError(document.getElementById('signin-password'));
    }
    
    return isValid;
}

function validateSignupForm(formData, userType) {
    let isValid = true;
    const errors = [];
    
    if (userType === 'user') {
        // User validation
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const state = formData.get('state');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (!firstName || firstName.length < 2) {
            showFieldError(document.getElementById('user-firstname'), 'First name is required');
            isValid = false;
        }
        
        if (!lastName || lastName.length < 2) {
            showFieldError(document.getElementById('user-lastname'), 'Last name is required');
            isValid = false;
        }
        
        if (!email || !validateEmail(email)) {
            showFieldError(document.getElementById('user-email'), 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!phone || !validatePhone(phone)) {
            showFieldError(document.getElementById('user-phone'), 'Please enter a valid phone number');
            isValid = false;
        }
        
        if (!state) {
            showFieldError(document.getElementById('user-state'), 'Please select your state');
            isValid = false;
        }
        
        if (!password || password.length < 8) {
            showFieldError(document.getElementById('user-password'), 'Password must be at least 8 characters');
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            showFieldError(document.getElementById('user-confirm-password'), 'Passwords do not match');
            isValid = false;
        }
        
    } else if (userType === 'firm') {
        // Firm validation
        const firmName = formData.get('firmName');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const address = formData.get('address');
        const state = formData.get('state');
        const cacNumber = formData.get('cacNumber');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const cacDocument = formData.get('cacDocument');
        
        // Check practice areas
        const practiceAreas = formData.getAll('practiceAreas');
        
        if (!firmName || firmName.length < 3) {
            showFieldError(document.getElementById('firm-name'), 'Firm name is required');
            isValid = false;
        }
        
        if (!email || !validateEmail(email)) {
            showFieldError(document.getElementById('firm-email'), 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!phone || !validatePhone(phone)) {
            showFieldError(document.getElementById('firm-phone'), 'Please enter a valid phone number');
            isValid = false;
        }
        
        if (!address || address.length < 10) {
            showFieldError(document.getElementById('firm-address'), 'Please enter a complete address');
            isValid = false;
        }
        
        if (!state) {
            showFieldError(document.getElementById('firm-state'), 'Please select your state');
            isValid = false;
        }
        
        if (!cacNumber || cacNumber.length < 7) {
            showFieldError(document.getElementById('firm-cac'), 'Please enter a valid CAC registration number');
            isValid = false;
        }
        
        if (practiceAreas.length === 0) {
            showNotification('Please select at least one practice area', 'warning');
            isValid = false;
        }
        
        if (!cacDocument || cacDocument.size === 0) {
            showFieldError(document.getElementById('firm-cac-document'), 'Please upload your CAC registration document');
            isValid = false;
        }
        
        if (!password || password.length < 8) {
            showFieldError(document.getElementById('firm-password'), 'Password must be at least 8 characters');
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            showFieldError(document.getElementById('firm-confirm-password'), 'Passwords do not match');
            isValid = false;
        }
    }
    
    // Terms agreement
    const termsAccepted = formData.get('terms');
    if (!termsAccepted) {
        showNotification('Please accept the Terms of Service and Privacy Policy', 'warning');
        isValid = false;
    }
    
    return isValid;
}

function validatePasswordStrength(password) {
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength += 1;
    else feedback.push('at least 8 characters');
    
    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('lowercase letters');
    
    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('uppercase letters');
    
    if (/[0-9]/.test(password)) strength += 1;
    else feedback.push('numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    else feedback.push('special characters');
    
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#ff4444', '#ff8800', '#ffbb00', '#00bb00', '#008800'];
    
    strengthIndicator.textContent = `Password Strength: ${strengthLevels[strength - 1] || 'Very Weak'}`;
    strengthIndicator.style.color = strengthColors[strength - 1] || strengthColors[0];
    
    if (feedback.length > 0) {
        strengthIndicator.textContent += ` (Include: ${feedback.join(', ')})`;
    }
}

function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (file.size > maxSize) {
        showNotification('File size must be less than 10MB', 'error');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please upload a PDF, JPG, or PNG file', 'error');
        return false;
    }
    
    return true;
}

// ===========================================
// UI HELPER FUNCTIONS
// ===========================================

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#ef4444';
    field.style.backgroundColor = '#fef2f2';
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    errorElement.style.fontSize = '0.875rem';
    errorElement.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorElement);
}

function clearFieldError(field) {
    field.style.borderColor = '';
    field.style.backgroundColor = '';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// ===========================================
// AUTO-LOGIN FOR TESTING
// ===========================================

// Add some test accounts for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add test login buttons (only in development)
    window.addEventListener('load', function() {
        const authContainer = document.querySelector('.auth-form-container');
        if (authContainer) {
            const testSection = document.createElement('div');
            testSection.className = 'test-accounts';
            testSection.style.marginTop = '2rem';
            testSection.style.padding = '1rem';
            testSection.style.backgroundColor = '#f3f4f6';
            testSection.style.borderRadius = '0.5rem';
            testSection.innerHTML = `
                <h4 style="margin-bottom: 1rem; color: #374151;">Test Accounts (Development Only)</h4>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-outline btn-sm" onclick="fillTestUser()">Test User</button>
                    <button class="btn btn-outline btn-sm" onclick="fillTestFirm()">Test Firm</button>
                    <button class="btn btn-outline btn-sm" onclick="fillTestAdmin()">Test Admin</button>
                </div>
            `;
            authContainer.appendChild(testSection);
        }
    });
    
    window.fillTestUser = function() {
        document.getElementById('signin-email').value = 'user@test.com';
        document.getElementById('signin-password').value = 'password123';
    };
    
    window.fillTestFirm = function() {
        document.getElementById('signin-email').value = 'firm@test.com';
        document.getElementById('signin-password').value = 'password123';
    };
    
    window.fillTestAdmin = function() {
        document.getElementById('signin-email').value = 'admin@test.com';
        document.getElementById('signin-password').value = 'password123';
    };
}