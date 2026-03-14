// ==================== Data Management ====================

class VehicleReminderSystem {
    constructor() {
        this.vehicles = [];
        this.reminders = [];
        this.editingVehicleId = null;
        this.editingReminderId = null;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderDashboard();
        this.setupThemeToggle();
    }

    // ==================== LocalStorage ====================

    saveToLocalStorage() {
        localStorage.setItem('vehicles', JSON.stringify(this.vehicles));
        localStorage.setItem('reminders', JSON.stringify(this.reminders));
    }

    loadFromLocalStorage() {
        const vehiclesData = localStorage.getItem('vehicles');
        const remindersData = localStorage.getItem('reminders');
        
        this.vehicles = vehiclesData ? JSON.parse(vehiclesData) : [];
        this.reminders = remindersData ? JSON.parse(remindersData) : [];
    }

    // ==================== Vehicle Management ====================

    addVehicle(vehicleData) {
        // Check for duplicate vehicle number
        if (this.vehicles.some(v => v.vehicleNumber.toLowerCase() === vehicleData.vehicleNumber.toLowerCase())) {
            alert('Vehicle with this number already exists!');
            return false;
        }

        const vehicle = {
            id: Date.now(),
            ...vehicleData
        };

        this.vehicles.push(vehicle);
        this.saveToLocalStorage();
        return vehicle.id;
    }

    updateVehicle(vehicleId, vehicleData) {
        // Check for duplicate vehicle number (excluding current vehicle)
        if (this.vehicles.some(v => v.id !== vehicleId && v.vehicleNumber.toLowerCase() === vehicleData.vehicleNumber.toLowerCase())) {
            alert('Vehicle with this number already exists!');
            return false;
        }

        const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex !== -1) {
            this.vehicles[vehicleIndex] = { ...this.vehicles[vehicleIndex], ...vehicleData };
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteVehicle(vehicleId) {
        const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
        if (vehicleIndex !== -1) {
            this.vehicles.splice(vehicleIndex, 1);
            // Also delete associated reminders
            this.reminders = this.reminders.filter(r => r.vehicleId !== vehicleId);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    getVehicleById(vehicleId) {
        return this.vehicles.find(v => v.id === vehicleId);
    }

    // ==================== Reminder Management ====================

    addReminder(reminderData) {
        const reminder = {
            id: Date.now(),
            ...reminderData,
            createdAt: new Date().toISOString()
        };

        this.reminders.push(reminder);
        this.saveToLocalStorage();
        return reminder.id;
    }

    updateReminder(reminderId, reminderData) {
        const reminderIndex = this.reminders.findIndex(r => r.id === reminderId);
        if (reminderIndex !== -1) {
            this.reminders[reminderIndex] = { ...this.reminders[reminderIndex], ...reminderData };
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    deleteReminder(reminderId) {
        const reminderIndex = this.reminders.findIndex(r => r.id === reminderId);
        if (reminderIndex !== -1) {
            this.reminders.splice(reminderIndex, 1);
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    getRemindersByVehicle(vehicleId) {
        return this.reminders.filter(r => r.vehicleId === vehicleId);
    }

    // ==================== Calculations ====================

    calculateRemainingDays(dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const timeDiff = due - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return daysDiff;
    }

    getReminderStatus(daysRemaining) {
        if (daysRemaining < 0) return 'overdue';
        if (daysRemaining <= 7) return 'due-soon';
        return 'upcoming';
    }

    getReminderStatusLabel(daysRemaining) {
        const status = this.getReminderStatus(daysRemaining);
        if (status === 'overdue') return '🔴 Overdue';
        if (status === 'due-soon') return '🟡 Due Soon';
        return '🟢 Upcoming';
    }

    // ==================== Dashboard Calculations ====================

    calculateSummary() {
        const totalVehicles = this.vehicles.length;
        
        const upcomingReminders = this.reminders.filter(r => {
            const daysLeft = this.calculateRemainingDays(r.dueDate);
            return daysLeft >= 0;
        }).length;

        const overdueReminders = this.reminders.filter(r => {
            const daysLeft = this.calculateRemainingDays(r.dueDate);
            return daysLeft < 0;
        }).length;

        return { totalVehicles, upcomingReminders, overdueReminders };
    }

    // ==================== Rendering ====================

    renderDashboard() {
        this.updateSummary();
        this.renderVehicles();
        this.renderReminders();
    }

    updateSummary() {
        const summary = this.calculateSummary();
        document.getElementById('totalVehicles').textContent = summary.totalVehicles;
        document.getElementById('upcomingReminders').textContent = summary.upcomingReminders;
        document.getElementById('overdueReminders').textContent = summary.overdueReminders;
    }

    renderVehicles(searchTerm = '') {
        const container = document.getElementById('vehiclesContainer');
        
        let filteredVehicles = this.vehicles;
        if (searchTerm) {
            filteredVehicles = this.vehicles.filter(v =>
                v.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filteredVehicles.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No vehicles found. Add one to get started!</p></div>';
            return;
        }

        container.innerHTML = filteredVehicles.map(vehicle => `
            <div class="vehicle-card">
                <div class="vehicle-header">
                    <div>
                        <h3 class="vehicle-title">${this.escapeHtml(vehicle.vehicleName)}</h3>
                    </div>
                    <span class="vehicle-type-badge">${this.escapeHtml(vehicle.vehicleType)}</span>
                </div>
                <div class="vehicle-details">
                    <div class="vehicle-detail">
                        <div class="vehicle-detail-label">Vehicle Number</div>
                        <div class="vehicle-detail-value">${this.escapeHtml(vehicle.vehicleNumber)}</div>
                    </div>
                    <div class="vehicle-detail">
                        <div class="vehicle-detail-label">Owner Name</div>
                        <div class="vehicle-detail-value">${this.escapeHtml(vehicle.ownerName)}</div>
                    </div>
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-edit" onclick="app.editVehicle(${vehicle.id})">Edit</button>
                    <button class="btn btn-danger" onclick="app.confirmDeleteVehicle(${vehicle.id})">Delete</button>
                    <button class="btn btn-primary" onclick="app.openReminderModal(${vehicle.id})">Add Reminder</button>
                </div>
            </div>
        `).join('');
    }

    renderReminders(typeFilter = '', statusFilter = '') {
        const container = document.getElementById('remindersContainer');
        
        let filteredReminders = this.reminders;

        if (typeFilter) {
            filteredReminders = filteredReminders.filter(r => r.reminderType === typeFilter);
        }

        if (statusFilter) {
            filteredReminders = filteredReminders.filter(r => {
                const daysLeft = this.calculateRemainingDays(r.dueDate);
                return this.getReminderStatus(daysLeft) === statusFilter;
            });
        }

        // Sort by nearest due date
        filteredReminders.sort((a, b) => {
            const daysA = this.calculateRemainingDays(a.dueDate);
            const daysB = this.calculateRemainingDays(b.dueDate);
            return daysA - daysB;
        });

        if (filteredReminders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No reminders found.</p></div>';
            return;
        }

        container.innerHTML = filteredReminders.map(reminder => {
            const daysLeft = this.calculateRemainingDays(reminder.dueDate);
            const status = this.getReminderStatus(daysLeft);
            const vehicle = this.getVehicleById(reminder.vehicleId);
            const daysText = daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : daysLeft === -1 ? '1 day ago' : Math.abs(daysLeft) + ' days ' + (daysLeft > 0 ? 'left' : 'ago');

            return `
                <div class="reminder-card ${status}">
                    <div class="reminder-header">
                        <div>
                            <h3 class="reminder-title">${this.escapeHtml(reminder.reminderType)} - ${vehicle ? this.escapeHtml(vehicle.vehicleName) : 'Unknown Vehicle'}</h3>
                        </div>
                        <span class="reminder-status-badge ${status}">${this.getReminderStatusLabel(daysLeft)}</span>
                    </div>
                    <div class="reminder-details">
                        <div class="reminder-detail">
                            <div class="reminder-detail-label">Due Date</div>
                            <div class="reminder-detail-value">${reminder.dueDate}</div>
                        </div>
                        <div class="reminder-detail">
                            <div class="reminder-detail-label">Days Remaining</div>
                            <div class="reminder-detail-value">${daysText}</div>
                        </div>
                        <div class="reminder-detail">
                            <div class="reminder-detail-label">Vehicle</div>
                            <div class="reminder-detail-value">${vehicle ? this.escapeHtml(vehicle.vehicleNumber) : 'N/A'}</div>
                        </div>
                    </div>
                    ${reminder.notes ? `<div class="reminder-notes">${this.escapeHtml(reminder.notes)}</div>` : ''}
                    <div class="reminder-actions">
                        <button class="btn btn-edit" onclick="app.editReminder(${reminder.id})">Edit</button>
                        <button class="btn btn-danger" onclick="app.confirmDeleteReminder(${reminder.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== UI Interactions ====================

    openVehicleModal() {
        this.editingVehicleId = null;
        document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
        document.getElementById('vehicleForm').reset();
        this.showModal('vehicleModal');
    }

    openReminderModal(vehicleId = null) {
        this.editingReminderId = null;
        document.getElementById('reminderModalTitle').textContent = 'Add Reminder';
        document.getElementById('reminderForm').reset();
        
        // Populate vehicle dropdown
        const vehicleSelect = document.getElementById('reminderVehicle');
        vehicleSelect.innerHTML = '<option value="">Choose a vehicle</option>' + 
            this.vehicles.map(v => `<option value="${v.id}">${this.escapeHtml(v.vehicleName)} (${this.escapeHtml(v.vehicleNumber)})</option>`).join('');
        
        if (vehicleId) {
            vehicleSelect.value = vehicleId;
        }
        
        this.showModal('reminderModal');
    }

    editVehicle(vehicleId) {
        const vehicle = this.getVehicleById(vehicleId);
        if (!vehicle) return;

        this.editingVehicleId = vehicleId;
        document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
        document.getElementById('vehicleName').value = vehicle.vehicleName;
        document.getElementById('vehicleNumber').value = vehicle.vehicleNumber;
        document.getElementById('vehicleType').value = vehicle.vehicleType;
        document.getElementById('ownerName').value = vehicle.ownerName;
        
        this.showModal('vehicleModal');
    }

    editReminder(reminderId) {
        const reminder = this.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        this.editingReminderId = reminderId;
        document.getElementById('reminderModalTitle').textContent = 'Edit Reminder';
        document.getElementById('reminderVehicle').value = reminder.vehicleId;
        document.getElementById('reminderType').value = reminder.reminderType;
        document.getElementById('reminderDueDate').value = reminder.dueDate;
        document.getElementById('reminderNotes').value = reminder.notes || '';
        
        // Populate vehicle dropdown if empty
        const vehicleSelect = document.getElementById('reminderVehicle');
        if (vehicleSelect.children.length === 1) {
            vehicleSelect.innerHTML = '<option value="">Choose a vehicle</option>' + 
                this.vehicles.map(v => `<option value="${v.id}">${this.escapeHtml(v.vehicleName)}</option>`).join('');
            vehicleSelect.value = reminder.vehicleId;
        }
        
        this.showModal('reminderModal');
    }

    confirmDeleteVehicle(vehicleId) {
        const vehicle = this.getVehicleById(vehicleId);
        if (!vehicle) return;

        if (confirm(`Are you sure you want to delete "${vehicle.vehicleName}"? This will also delete all associated reminders.`)) {
            this.deleteVehicle(vehicleId);
            this.renderDashboard();
        }
    }

    confirmDeleteReminder(reminderId) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            this.deleteReminder(reminderId);
            this.renderDashboard();
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // ==================== Form Handling ====================

    handleVehicleFormSubmit(e) {
        e.preventDefault();

        const vehicleData = {
            vehicleName: document.getElementById('vehicleName').value,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            vehicleType: document.getElementById('vehicleType').value,
            ownerName: document.getElementById('ownerName').value
        };

        if (this.editingVehicleId) {
            if (this.updateVehicle(this.editingVehicleId, vehicleData)) {
                this.closeModal('vehicleModal');
                this.renderDashboard();
            }
        } else {
            this.addVehicle(vehicleData);
            this.closeModal('vehicleModal');
            this.renderDashboard();
        }
    }

    handleReminderFormSubmit(e) {
        e.preventDefault();

        const reminderData = {
            vehicleId: parseInt(document.getElementById('reminderVehicle').value),
            reminderType: document.getElementById('reminderType').value,
            dueDate: document.getElementById('reminderDueDate').value,
            notes: document.getElementById('reminderNotes').value
        };

        if (this.editingReminderId) {
            if (this.updateReminder(this.editingReminderId, reminderData)) {
                this.closeModal('reminderModal');
                this.renderDashboard();
            }
        } else {
            this.addReminder(reminderData);
            this.closeModal('reminderModal');
            this.renderDashboard();
        }
    }

    // ==================== Search and Filter ====================

    handleVehicleSearch(e) {
        const searchTerm = e.target.value;
        this.renderVehicles(searchTerm);
    }

    handleReminderFilters() {
        const typeFilter = document.getElementById('reminderTypeFilter').value;
        const statusFilter = document.getElementById('reminderStatusFilter').value;
        this.renderReminders(typeFilter, statusFilter);
    }

    // ==================== Theme Toggle ====================

    setupThemeToggle() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }

    toggleTheme() {
        const isDarkMode = document.documentElement.classList.toggle('dark-mode');
        const themeIcon = isDarkMode ? '☀️' : '🌙';
        document.getElementById('themeToggle').textContent = themeIcon;
        localStorage.setItem('darkMode', isDarkMode);
    }

    // ==================== Event Listeners ====================

    setupEventListeners() {
        // Vehicle Modal
        document.getElementById('addVehicleBtn').addEventListener('click', () => this.openVehicleModal());
        document.getElementById('vehicleForm').addEventListener('submit', (e) => this.handleVehicleFormSubmit(e));
        document.getElementById('closeVehicleModal').addEventListener('click', () => this.closeModal('vehicleModal'));
        document.getElementById('cancelVehicleBtn').addEventListener('click', () => this.closeModal('vehicleModal'));

        // Reminder Modal
        document.getElementById('closeReminderModal').addEventListener('click', () => this.closeModal('reminderModal'));
        document.getElementById('cancelReminderBtn').addEventListener('click', () => this.closeModal('reminderModal'));
        document.getElementById('reminderForm').addEventListener('submit', (e) => this.handleReminderFormSubmit(e));

        // Search and Filter
        document.getElementById('vehicleSearch').addEventListener('input', (e) => this.handleVehicleSearch(e));
        document.getElementById('reminderTypeFilter').addEventListener('change', () => this.handleReminderFilters());
        document.getElementById('reminderStatusFilter').addEventListener('change', () => this.handleReminderFilters());

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const vehicleModal = document.getElementById('vehicleModal');
            const reminderModal = document.getElementById('reminderModal');
            
            if (e.target === vehicleModal) {
                this.closeModal('vehicleModal');
            }
            if (e.target === reminderModal) {
                this.closeModal('reminderModal');
            }
        });
    }

    // ==================== Utility ====================

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// ==================== Initialize App ====================

const app = new VehicleReminderSystem();
