// ==================== GLOBAL VARIABLES ====================
const STORAGE_KEY = 'ipt_demo_v1';
const AUTH_USER_ID_KEY = 'auth_user_id';
const PENDING_REG_EMAIL_KEY = 'pending_registration_email';
const USERS_API_URL = '/users';
let currentUser = null;

// Database structure
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// ==================== PHASE 4: DATA PERSISTENCE ====================

function normalizeRole(role) {
    return String(role || '').toLowerCase();
}

function isAdmin(user) {
    return normalizeRole(user?.role) === 'admin';
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof payload === 'object' && payload?.message
            ? payload.message
            : `Request failed (${response.status})`;
        throw new Error(message);
    }

    return payload;
}

async function fetchAccountsFromApi() {
    const users = await apiRequest(USERS_API_URL);
    window.db.accounts = users;
    return users;
}

async function fetchAccountById(id) {
    return apiRequest(`${USERS_API_URL}/${id}`);
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            window.db.departments = parsed.departments || [];
            window.db.employees = parsed.employees || [];
            window.db.requests = parsed.requests || [];
            window.db.accounts = [];
        } else {
            // Seed initial data
            window.db = {
                accounts: [],
                departments: [
                    { id: 1, name: 'Engineering', description: 'Software development and IT' },
                    { id: 2, name: 'HR', description: 'Human Resources' }
                ],
                employees: [],
                requests: []
            };
            saveToStorage();
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        // Reset to seed data on error
        window.db = {
            accounts: [],
            departments: [
                { id: 1, name: 'Engineering', description: 'Software development and IT' },
                { id: 2, name: 'HR', description: 'Human Resources' }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    try {
        // Users are now persisted by the backend API; keep only local-only modules in browser storage.
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            departments: window.db.departments,
            employees: window.db.employees,
            requests: window.db.requests
        }));
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

// ==================== PHASE 2: CLIENT-SIDE ROUTING ====================

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    const route = hash.substring(2); // Remove '#/'
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Protected routes (require authentication)
    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'accounts', 'departments'];
    
    // Check authentication for protected routes
    if (protectedRoutes.includes(route) && !currentUser) {
        showToast('Please login to access this page', 'warning');
        navigateTo('#/login');
        return;
    }
    
    // Check admin access
    if (adminRoutes.includes(route)) {
        if (!currentUser) {
            showToast('Please login to access this page', 'warning');
            navigateTo('#/login');
            return;
        }
        if (!isAdmin(currentUser)) {
            showToast('Access denied. Admin privileges required.', 'danger');
            navigateTo('#/');
            return;
        }
    }
    
    // Route to appropriate page
    let pageId = 'home-page';
    
    switch(route) {
        case '':
        case 'home':
            pageId = 'home-page';
            break;
        case 'register':
            pageId = 'register-page';
            break;
        case 'verify-email':
            pageId = 'verify-email-page';
            displayVerificationEmail();
            break;
        case 'login':
            pageId = 'login-page';
            break;
        case 'profile':
            pageId = 'profile-page';
            renderProfile();
            break;
        case 'employees':
            pageId = 'employees-page';
            void renderEmployeesTable();
            break;
        case 'departments':
            pageId = 'departments-page';
            renderDepartmentsList();
            break;
        case 'accounts':
            pageId = 'accounts-page';
            void renderAccountsList();
            break;
        case 'requests':
            pageId = 'requests-page';
            renderRequestsList();
            break;
        default:
            pageId = 'home-page';
    }
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// ==================== PHASE 3: AUTHENTICATION SYSTEM ====================

function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        // Update username display
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        // Check if admin
        if (isAdmin(user)) {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        currentUser = null;
    }
}

async function checkAuthOnLoad() {
    const savedUserId = localStorage.getItem(AUTH_USER_ID_KEY);
    if (!savedUserId) {
        setAuthState(false);
        return;
    }

    try {
        const user = await fetchAccountById(Number(savedUserId));
        setAuthState(true, user);
    } catch (error) {
        localStorage.removeItem(AUTH_USER_ID_KEY);
        setAuthState(false);
    }
}

// Registration
async function handleRegistration(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('reg-firstname').value.trim();
    const lastName = document.getElementById('reg-lastname').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    
    // Validate password length
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }

    try {
        await apiRequest(USERS_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: 'N/A',
                firstName,
                lastName,
                role: 'User',
                email,
                password,
                confirmPassword: password
            })
        });

        await fetchAccountsFromApi();
        localStorage.setItem(PENDING_REG_EMAIL_KEY, email);
        showToast('Registration successful! Click verify to continue.', 'success');
        navigateTo('#/verify-email');
        document.getElementById('register-form').reset();
    } catch (error) {
        showToast(error.message || 'Registration failed', 'danger');
    }
}

// Email Verification Display
function displayVerificationEmail() {
    const email = localStorage.getItem(PENDING_REG_EMAIL_KEY);
    const displayElement = document.getElementById('verify-email-display');
    if (displayElement && email) {
        displayElement.textContent = email;
    }
}

// Simulate Email Verification
function simulateEmailVerification() {
    const email = localStorage.getItem(PENDING_REG_EMAIL_KEY);
    if (!email) {
        showToast('No pending registration', 'warning');
        return;
    }

    localStorage.removeItem(PENDING_REG_EMAIL_KEY);
    showToast('Account is ready. Please login.', 'success');
    navigateTo('#/login');
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    const errorDiv = document.getElementById('login-error');

    try {
        const accounts = await fetchAccountsFromApi();
        const account = accounts.find(acc => acc.email?.toLowerCase() === email);

        if (!account) {
            errorDiv.textContent = 'Account not found';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (!password) {
            errorDiv.textContent = 'Password is required';
            errorDiv.classList.remove('d-none');
            return;
        }

        localStorage.setItem(AUTH_USER_ID_KEY, String(account.id));
        setAuthState(true, account);
        showToast(`Welcome back, ${account.firstName}!`, 'success');
        showToast('Note: this demo backend does not expose password verification yet.', 'warning');
        navigateTo('#/profile');
        document.getElementById('login-form').reset();
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed';
        errorDiv.classList.remove('d-none');
    }
}

// Logout
function handleLogout() {
    localStorage.removeItem(AUTH_USER_ID_KEY);
    setAuthState(false);
    showToast('Logged out successfully', 'info');
    navigateTo('#/');
}

// ==================== PHASE 5: PROFILE PAGE ====================

function renderProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!currentUser || !profileContent) return;
    
    profileContent.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">First Name</label>
                <p class="form-control-plaintext">${currentUser.firstName}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Last Name</label>
                <p class="form-control-plaintext">${currentUser.lastName}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Email</label>
                <p class="form-control-plaintext">${currentUser.email}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Role</label>
                <p class="form-control-plaintext">
                    <span class="badge ${isAdmin(currentUser) ? 'bg-danger' : 'bg-primary'}">
                        ${normalizeRole(currentUser.role) === 'admin' ? 'ADMIN' : 'USER'}
                    </span>
                </p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label fw-bold">Account Status</label>
                <p class="form-control-plaintext">
                    <span class="badge bg-success">Verified</span>
                </p>
            </div>
        </div>
        <div class="mt-4">
            <button class="btn btn-primary" onclick="alert('Edit profile feature coming soon!')">
                Edit Profile
            </button>
        </div>
    `;
}

// ==================== PHASE 6: ADMIN FEATURES ====================

// A. ACCOUNTS MANAGEMENT
async function renderAccountsList() {
    const accountsList = document.getElementById('accounts-list');
    if (!accountsList) return;

    try {
        await fetchAccountsFromApi();
    } catch (error) {
        accountsList.innerHTML = '<div class="empty-state">Failed to load accounts</div>';
        showToast(error.message || 'Failed to fetch accounts', 'danger');
        return;
    }

    if (window.db.accounts.length === 0) {
        accountsList.innerHTML = '<div class="empty-state">No accounts found</div>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.db.accounts.forEach(account => {
        html += `
            <tr>
                <td>${account.firstName} ${account.lastName}</td>
                <td>${account.email}</td>
                <td><span class="badge ${isAdmin(account) ? 'bg-danger' : 'bg-primary'}">${account.role}</span></td>
                <td>API</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editAccount(${account.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${account.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    accountsList.innerHTML = html;
}

function showAccountModal(accountId = null) {
    const account = accountId ? window.db.accounts.find(a => a.id === accountId) : null;
    const isEdit = !!account;
    
    const modalHtml = `
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit Account' : 'Add Account'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="account-form">
                            <input type="hidden" id="account-id" value="${accountId || ''}">
                            <div class="mb-3">
                                <label for="account-firstname" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="account-firstname" value="${account?.firstName || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="account-lastname" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="account-lastname" value="${account?.lastName || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="account-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="account-email" value="${account?.email || ''}" required>
                            </div>
                            ${!isEdit ? `
                            <div class="mb-3">
                                <label for="account-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="account-password" minlength="6" required>
                            </div>
                            ` : ''}
                            <div class="mb-3">
                                <label for="account-role" class="form-label">Role</label>
                                <select class="form-select" id="account-role" required>
                                    <option value="User" ${normalizeRole(account?.role) === 'user' ? 'selected' : ''}>User</option>
                                    <option value="Admin" ${normalizeRole(account?.role) === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveAccount()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('accountModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function editAccount(accountId) {
    showAccountModal(accountId);
}

async function saveAccount() {
    const accountId = document.getElementById('account-id').value;
    const firstName = document.getElementById('account-firstname').value.trim();
    const lastName = document.getElementById('account-lastname').value.trim();
    const email = document.getElementById('account-email').value.trim().toLowerCase();
    const role = document.getElementById('account-role').value;

    try {
        if (accountId) {
            await apiRequest(`${USERS_API_URL}/${accountId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    role
                })
            });
            showToast('Account updated successfully', 'success');
        } else {
            const password = document.getElementById('account-password').value;

            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'danger');
                return;
            }

            await apiRequest(USERS_API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    title: 'N/A',
                    firstName,
                    lastName,
                    role,
                    email,
                    password,
                    confirmPassword: password
                })
            });
            showToast('Account created successfully', 'success');
        }

        await renderAccountsList();

        const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
        modal.hide();
    } catch (error) {
        showToast(error.message || 'Failed to save account', 'danger');
    }
}

async function deleteAccount(accountId) {
    // Prevent self-deletion
    if (currentUser && currentUser.id === accountId) {
        showToast('You cannot delete your own account', 'danger');
        return;
    }

    if (confirm('Are you sure you want to delete this account?')) {
        try {
            await apiRequest(`${USERS_API_URL}/${accountId}`, { method: 'DELETE' });
            await renderAccountsList();
            showToast('Account deleted successfully', 'success');
        } catch (error) {
            showToast(error.message || 'Failed to delete account', 'danger');
        }
    }
}

// B. DEPARTMENTS MANAGEMENT
function renderDepartmentsList() {
    const departmentsList = document.getElementById('departments-list');
    if (!departmentsList) return;
    
    if (window.db.departments.length === 0) {
        departmentsList.innerHTML = '<div class="empty-state">No departments found</div>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.db.departments.forEach(dept => {
        html += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editDepartment(${dept.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    departmentsList.innerHTML = html;
}

function showDepartmentModal(deptId = null) {
    const dept = deptId ? window.db.departments.find(d => d.id === deptId) : null;
    const isEdit = !!dept;
    
    const modalHtml = `
        <div class="modal fade" id="departmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit Department' : 'Add Department'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="department-form">
                            <input type="hidden" id="dept-id" value="${deptId || ''}">
                            <div class="mb-3">
                                <label for="dept-name" class="form-label">Name</label>
                                <input type="text" class="form-control" id="dept-name" value="${dept?.name || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="dept-description" class="form-label">Description</label>
                                <textarea class="form-control" id="dept-description" rows="3" required>${dept?.description || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveDepartment()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('departmentModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
    modal.show();
}

function editDepartment(deptId) {
    showDepartmentModal(deptId);
}

function saveDepartment() {
    const deptId = document.getElementById('dept-id').value;
    const name = document.getElementById('dept-name').value.trim();
    const description = document.getElementById('dept-description').value.trim();
    
    if (deptId) {
        const dept = window.db.departments.find(d => d.id === parseInt(deptId));
        if (dept) {
            dept.name = name;
            dept.description = description;
            showToast('Department updated successfully', 'success');
        }
    } else {
        const newDept = {
            id: window.db.departments.length > 0 ? Math.max(...window.db.departments.map(d => d.id)) + 1 : 1,
            name,
            description
        };
        window.db.departments.push(newDept);
        showToast('Department created successfully', 'success');
    }
    
    saveToStorage();
    renderDepartmentsList();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('departmentModal'));
    modal.hide();
}

function deleteDepartment(deptId) {
    if (confirm('Are you sure you want to delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== deptId);
        saveToStorage();
        renderDepartmentsList();
        showToast('Department deleted successfully', 'success');
    }
}

// C. EMPLOYEES MANAGEMENT
async function renderEmployeesTable() {
    const employeesList = document.getElementById('employees-list');
    if (!employeesList) return;

    try {
        await fetchAccountsFromApi();
    } catch (error) {
        console.error('Unable to refresh users for employee table:', error);
    }
    
    if (window.db.employees.length === 0) {
        employeesList.innerHTML = '<div class="empty-state">No employees found</div>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Hire Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.db.employees.forEach(emp => {
        const user = window.db.accounts.find(a => a.id === emp.userId);
        const dept = window.db.departments.find(d => d.id === emp.departmentId);
        
        html += `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${user ? user.email : 'N/A'}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : 'N/A'}</td>
                <td>${emp.hireDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee(${emp.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${emp.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    employeesList.innerHTML = html;
}

async function showEmployeeModal(empId = null) {
    try {
        await fetchAccountsFromApi();
    } catch (error) {
        showToast('Unable to load users. Please try again.', 'danger');
        return;
    }

    const emp = empId ? window.db.employees.find(e => e.id === empId) : null;
    const isEdit = !!emp;
    
    // Generate department options
    let deptOptions = '';
    window.db.departments.forEach(dept => {
        deptOptions += `<option value="${dept.id}" ${emp?.departmentId === dept.id ? 'selected' : ''}>${dept.name}</option>`;
    });
    
    const modalHtml = `
        <div class="modal fade" id="employeeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${isEdit ? 'Edit Employee' : 'Add Employee'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="employee-form">
                            <input type="hidden" id="emp-id" value="${empId || ''}">
                            <div class="mb-3">
                                <label for="emp-employee-id" class="form-label">Employee ID</label>
                                <input type="text" class="form-control" id="emp-employee-id" value="${emp?.employeeId || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="emp-user-email" class="form-label">User Email</label>
                                <select class="form-select" id="emp-user-email" required>
                                    <option value="">Select User</option>
                                    ${window.db.accounts.map(acc => `
                                        <option value="${acc.id}" ${emp?.userId === acc.id ? 'selected' : ''}>${acc.email}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="emp-position" class="form-label">Position</label>
                                <input type="text" class="form-control" id="emp-position" value="${emp?.position || ''}" required>
                            </div>
                            <div class="mb-3">
                                <label for="emp-department" class="form-label">Department</label>
                                <select class="form-select" id="emp-department" required>
                                    <option value="">Select Department</option>
                                    ${deptOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="emp-hire-date" class="form-label">Hire Date</label>
                                <input type="date" class="form-control" id="emp-hire-date" value="${emp?.hireDate || ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveEmployee()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('employeeModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

function editEmployee(empId) {
    void showEmployeeModal(empId);
}

function saveEmployee() {
    const empId = document.getElementById('emp-id').value;
    const employeeId = document.getElementById('emp-employee-id').value.trim();
    const userId = parseInt(document.getElementById('emp-user-email').value);
    const position = document.getElementById('emp-position').value.trim();
    const departmentId = parseInt(document.getElementById('emp-department').value);
    const hireDate = document.getElementById('emp-hire-date').value;
    
    if (!userId || !departmentId) {
        showToast('Please select both user and department', 'danger');
        return;
    }
    
    if (empId) {
        const emp = window.db.employees.find(e => e.id === parseInt(empId));
        if (emp) {
            emp.employeeId = employeeId;
            emp.userId = userId;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
            showToast('Employee updated successfully', 'success');
        }
    } else {
        const newEmp = {
            id: window.db.employees.length > 0 ? Math.max(...window.db.employees.map(e => e.id)) + 1 : 1,
            employeeId,
            userId,
            position,
            departmentId,
            hireDate
        };
        window.db.employees.push(newEmp);
        showToast('Employee created successfully', 'success');
    }
    
    saveToStorage();
    renderEmployeesTable();
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
    modal.hide();
}

function deleteEmployee(empId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== empId);
        saveToStorage();
        renderEmployeesTable();
        showToast('Employee deleted successfully', 'success');
    }
}

// ==================== PHASE 7: USER REQUESTS ====================

function renderRequestsList() {
    const requestsList = document.getElementById('requests-list');
    if (!requestsList || !currentUser) return;
    
    // Filter requests for current user
    const userRequests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        requestsList.innerHTML = '<div class="empty-state">No requests found. Click "+ New Request" to create one.</div>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    userRequests.forEach(req => {
        const statusClass = req.status === 'Pending' ? 'warning' : req.status === 'Approved' ? 'success' : 'danger';
        const itemsSummary = req.items.map(item => `${item.name} (${item.quantity})`).join(', ');
        
        html += `
            <tr>
                <td>${new Date(req.date).toLocaleDateString()}</td>
                <td>${req.type}</td>
                <td>${itemsSummary}</td>
                <td><span class="badge bg-${statusClass}">${req.status}</span></td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    requestsList.innerHTML = html;
}

function showNewRequestModal() {
    const modalHtml = `
        <div class="modal fade" id="requestModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="request-form">
                            <div class="mb-3">
                                <label for="request-type" class="form-label">Request Type</label>
                                <select class="form-select" id="request-type" required>
                                    <option value="">Select Type</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Resources">Resources</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Items</label>
                                <div id="items-container">
                                    <div class="request-item mb-2">
                                        <div class="row">
                                            <div class="col-md-7">
                                                <input type="text" class="form-control item-name" placeholder="Item name" required>
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="1" required>
                                            </div>
                                            <div class="col-md-2">
                                                <button type="button" class="btn btn-danger btn-sm w-100 remove-item" disabled>×</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-outline-primary" id="add-item-btn">+ Add Item</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveRequest()">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('requestModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
    
    // Add item functionality
    document.getElementById('add-item-btn').addEventListener('click', addRequestItem);
    
    // Enable remove button when more than one item
    updateRemoveButtons();
}

function addRequestItem() {
    const container = document.getElementById('items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'request-item mb-2';
    itemDiv.innerHTML = `
        <div class="row">
            <div class="col-md-7">
                <input type="text" class="form-control item-name" placeholder="Item name" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm w-100 remove-item">×</button>
            </div>
        </div>
    `;
    container.appendChild(itemDiv);
    
    // Add event listener to remove button
    itemDiv.querySelector('.remove-item').addEventListener('click', function() {
        itemDiv.remove();
        updateRemoveButtons();
    });
    
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const items = document.querySelectorAll('.request-item');
    items.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-item');
        removeBtn.disabled = items.length === 1;
    });
}

function saveRequest() {
    const type = document.getElementById('request-type').value;
    const itemElements = document.querySelectorAll('.request-item');
    
    if (!type) {
        showToast('Please select a request type', 'danger');
        return;
    }
    
    const items = [];
    let valid = true;
    
    itemElements.forEach(itemEl => {
        const name = itemEl.querySelector('.item-name').value.trim();
        const quantity = parseInt(itemEl.querySelector('.item-quantity').value);
        
        if (name && quantity > 0) {
            items.push({ name, quantity });
        } else {
            valid = false;
        }
    });
    
    if (!valid || items.length === 0) {
        showToast('Please add at least one valid item', 'danger');
        return;
    }
    
    const newRequest = {
        id: window.db.requests.length > 0 ? Math.max(...window.db.requests.map(r => r.id)) + 1 : 1,
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString(),
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    renderRequestsList();
    showToast('Request submitted successfully', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    modal.hide();
}

// ==================== UTILITY FUNCTIONS ====================

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toastId = 'toast-' + Date.now();
    
    const bgClass = type === 'success' ? 'bg-success' : 
                    type === 'danger' ? 'bg-danger' : 
                    type === 'warning' ? 'bg-warning' : 
                    'bg-info';
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async function() {
    // Load data from storage
    loadFromStorage();
    
    // Check authentication
    await checkAuthOnLoad();

    // Prime account cache for account- and employee-related UI.
    try {
        await fetchAccountsFromApi();
    } catch (error) {
        console.error('Unable to pre-load users from API:', error);
    }
    
    // Set up event listeners
    document.getElementById('register-form').addEventListener('submit', handleRegistration);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('simulate-verify-btn').addEventListener('click', simulateEmailVerification);
    
    // Admin buttons
    document.getElementById('add-account-btn')?.addEventListener('click', () => showAccountModal());
    document.getElementById('add-department-btn')?.addEventListener('click', () => showDepartmentModal());
    document.getElementById('add-employee-btn')?.addEventListener('click', () => void showEmployeeModal());
    document.getElementById('new-request-btn')?.addEventListener('click', showNewRequestModal);
    
    // Set up routing
    window.addEventListener('hashchange', handleRouting);
    
    // Initial routing
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    handleRouting();
    
    console.log('App initialized successfully!');
});