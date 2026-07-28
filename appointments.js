const AppointmentsView = (() => {
    let currentStatusFilter = 'all';
    let activeTab = 'today'; // 'today' or 'day_after_tomorrow'

    function getRelativeDateStr(daysOffset) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const user = Auth.getCurrentUser();
        if (!user) return;

        let stylist = null;
        if (user.role === 'stylist') {
            stylist = Store.query(Store.KEYS.STYLISTS, s => s.user_id === user.id)[0];
        }

        const appointments = Store.getAll(Store.KEYS.APPOINTMENTS);
        
        // Filter by role
        let filtered = appointments.filter(a => {
            if (user.role === 'admin') return true;
            return stylist && a.stylist_id === stylist.id;
        });

        // Filter by status dropdown
        if (currentStatusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === currentStatusFilter);
        }

        // Filter by active tab (Date filter)
        const todayStr = getRelativeDateStr(0);
        const tomorrowStr = getRelativeDateStr(1);
        const dayAfterTomorrowStr = getRelativeDateStr(2);
        
        filtered = filtered.filter(a => {
            if (activeTab === 'today') {
                return a.date === todayStr;
            } else if (activeTab === 'tomorrow') {
                return a.date === tomorrowStr;
            } else {
                return a.date === dayAfterTomorrowStr;
            }
        });

        // Sort by time
        filtered.sort((a, b) => {
            return a.time_slot.localeCompare(b.time_slot);
        });

        let listHtml = '';
        if (filtered.length === 0) {
            let dateLabel = 'today';
            if (activeTab === 'tomorrow') dateLabel = 'tomorrow';
            else if (activeTab === 'day_after_tomorrow') dateLabel = 'day after tomorrow';

            listHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3 class="empty-state-title">No appointments found</h3>
                    <p class="empty-state-text">There are no bookings scheduled for ${dateLabel}.</p>
                </div>
            `;
        } else {
            filtered.forEach(a => {
                const client = Store.getById(Store.KEYS.USERS, a.client_id);
                const serviceName = Utils.getAppointmentServiceName(a);
                
                const clientName = client ? client.full_name : 'Unknown Client';
                const dateFormatted = Utils.formatDate(a.date);
                const timeFormatted = Utils.formatTime(a.time_slot);
                const statusBadge = `<span class="badge ${Utils.getStatusClass(a.status)}">${a.status}</span>`;

                listHtml += `
                    <div class="appointment-card" style="cursor: pointer;" onclick="AppointmentsView.openDetailModal('${a.id}')">
                        <div class="appointment-card-time">
                            <div class="appointment-card-time-slot">${timeFormatted}</div>
                            <div class="appointment-card-date">${dateFormatted}</div>
                        </div>
                        <div class="appointment-card-details">
                            <h3 class="appointment-card-service">${Utils.escapeHtml(serviceName)}</h3>
                            <p class="appointment-card-stylist">Client: <strong>${Utils.escapeHtml(clientName)}</strong></p>
                            <div class="mt-2">${statusBadge}</div>
                        </div>
                        <div style="font-size: var(--font-lg); color: var(--text-muted);">👁️</div>
                    </div>
                `;
            });
        }

        const todayLabel = Utils.formatDate(todayStr);
        const tomorrowLabel = Utils.formatDate(tomorrowStr);
        const dayAfterTomorrowLabel = Utils.formatDate(dayAfterTomorrowStr);

        container.innerHTML = `
            <div class="page-header flex-between" style="flex-wrap: wrap; gap: var(--space-4);">
                <div>
                    <h1 class="page-title">Manage Appointments</h1>
                    <p class="page-subtitle">View and update appointment statuses for clients</p>
                </div>
                <div class="form-group" style="margin-bottom: 0; min-width: 200px;">
                    <label class="form-label" for="filter-status" style="display: none;">Status Filter</label>
                    <select class="form-select" id="filter-status">
                        <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                        <option value="pending" ${currentStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${currentStatusFilter === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="completed" ${currentStatusFilter === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${currentStatusFilter === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>

            <!-- Tabs selector for Today vs Tomorrow vs Day After Tomorrow -->
            <div class="tabs" style="margin-bottom: var(--space-6);">
                <div class="tab ${activeTab === 'today' ? 'active' : ''}" onclick="AppointmentsView.switchTab('today')">
                    📅 Today (${todayLabel})
                </div>
                <div class="tab ${activeTab === 'tomorrow' ? 'active' : ''}" onclick="AppointmentsView.switchTab('tomorrow')">
                    📅 Tomorrow (${tomorrowLabel})
                </div>
                <div class="tab ${activeTab === 'day_after_tomorrow' ? 'active' : ''}" onclick="AppointmentsView.switchTab('day_after_tomorrow')">
                    📅 Day After Tomorrow (${dayAfterTomorrowLabel})
                </div>
            </div>

            <div class="appointments-list-container">
                ${listHtml}
            </div>

            <!-- Detail Modal Container -->
            <div id="modal-container-area"></div>
        `;

        // Bind filter change
        const selectFilter = document.getElementById('filter-status');
        if (selectFilter) {
            selectFilter.addEventListener('change', (e) => {
                currentStatusFilter = e.target.value;
                render();
            });
        }
    }

    function switchTab(tab) {
        activeTab = tab;
        render();
    }

    function openDetailModal(id) {
        const app = Store.getById(Store.KEYS.APPOINTMENTS, id);
        if (!app) return;

        const client = Store.getById(Store.KEYS.USERS, app.client_id);
        const stylist = Store.getById(Store.KEYS.STYLISTS, app.stylist_id);
        const stylistUser = stylist ? Store.getById(Store.KEYS.USERS, stylist.user_id) : null;

        const clientName = client ? client.full_name : 'Unknown Client';
        const clientEmail = client ? client.email : '';
        const clientPhone = client ? client.phone : '';
        const serviceName = Utils.getAppointmentServiceName(app);
        const servicePrice = Utils.getAppointmentPrice(app);
        const serviceDuration = Utils.getAppointmentDuration(app);
        const stylistName = stylistUser ? stylistUser.full_name : 'Unknown Stylist';
        
        const dateFormatted = Utils.formatDate(app.date);
        const timeFormatted = Utils.formatTime(app.time_slot);
        const statusBadge = `<span class="badge ${Utils.getStatusClass(app.status)}">${app.status}</span>`;

        let actionButtons = '';
        if (app.status === 'pending') {
            actionButtons = `
                <button class="btn btn-secondary" onclick="AppointmentsView.modalUpdateStatus('${id}', 'cancelled')">Cancel Appointment</button>
                <button class="btn btn-primary" onclick="AppointmentsView.modalUpdateStatus('${id}', 'confirmed')">Confirm Booking</button>
            `;
        } else if (app.status === 'confirmed') {
            actionButtons = `
                <button class="btn btn-secondary" onclick="AppointmentsView.modalUpdateStatus('${id}', 'cancelled')">Cancel Appointment</button>
                <button class="btn btn-primary" onclick="AppointmentsView.modalUpdateStatus('${id}', 'completed')">Mark Completed</button>
            `;
        }

        const area = document.getElementById('modal-container-area');
        if (!area) return;

        area.innerHTML = `
            <div class="modal-overlay" id="appt-detail-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Appointment Details</h3>
                        <button class="modal-close" onclick="AppointmentsView.closeModal()">✕</button>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: var(--space-4);">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
                            <span class="text-muted">Status:</span>
                            <span>${statusBadge}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
                            <span class="text-muted">Date & Time:</span>
                            <span style="font-weight: var(--weight-medium);">${dateFormatted} at ${timeFormatted}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
                            <span class="text-muted">Service Menu:</span>
                            <span style="font-weight: var(--weight-medium);">${Utils.escapeHtml(serviceName)} (${serviceDuration} mins)</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
                            <span class="text-muted">Price:</span>
                            <span class="price">${Utils.formatPrice(servicePrice)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: var(--space-2);">
                            <span class="text-muted">Stylist:</span>
                            <span style="font-weight: var(--weight-medium);">${Utils.escapeHtml(stylistName)}</span>
                        </div>
                        
                        <div style="background-color: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-3); margin-top: var(--space-2);">
                            <h4 style="font-size: var(--font-sm); text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">Client Details</h4>
                            <div style="font-weight: var(--weight-semibold);">${Utils.escapeHtml(clientName)}</div>
                            <div style="font-size: var(--font-sm); color: var(--text-secondary);">✉️ ${Utils.escapeHtml(clientEmail)}</div>
                            <div style="font-size: var(--font-sm); color: var(--text-secondary);">📞 ${Utils.escapeHtml(clientPhone)}</div>
                        </div>
 
                        ${app.notes ? `
                            <div style="margin-top: var(--space-2);">
                                <h4 style="font-size: var(--font-sm); text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px;">Notes from Client</h4>
                                <p style="font-size: var(--font-md); padding: 8px 12px; border-left: 2px solid var(--accent-primary); background-color: var(--bg-primary); font-style: italic; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                                    "${Utils.escapeHtml(app.notes)}"
                                </p>
                            </div>
                        ` : ''}
                    </div>
 
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="AppointmentsView.closeModal()">Close</button>
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;

        // Bind escape or overlay click
        const overlay = document.getElementById('appt-detail-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    function closeModal() {
        const overlay = document.getElementById('appt-detail-overlay');
        if (overlay) {
            overlay.classList.add('removing');
            overlay.remove();
        }
    }

    function modalUpdateStatus(id, newStatus) {
        if (confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
            Store.update(Store.KEYS.APPOINTMENTS, id, { status: newStatus });
            
            // Notification triggers
            Notifications.onStatusChange(id, newStatus);
            App.showToast(`Appointment status updated to ${newStatus}.`, 'success');
            App.updateLayout();
            
            closeModal();
            render();
        }
    }

    return {
        render,
        switchTab,
        openDetailModal,
        closeModal,
        modalUpdateStatus
    };
})();
