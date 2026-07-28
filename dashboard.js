const DashboardView = (() => {
    let currentViewMode = 'today'; // 'today' or 'week'
    const TODAY_STR = '2026-07-12';

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const user = Auth.getCurrentUser();
        if (!user) return;

        // Find stylist profile (if not admin)
        let stylist = null;
        if (user.role === 'stylist') {
            stylist = Store.query(Store.KEYS.STYLISTS, s => s.user_id === user.id)[0];
            if (!stylist) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3 class="empty-state-title">Stylist Profile Missing</h3>
                        <p class="empty-state-text">Your user account does not have an associated stylist profile. Please contact an admin.</p>
                    </div>
                `;
                return;
            }
        }

        // Get appointments for today or all based on role
        const allAppointments = Store.getAll(Store.KEYS.APPOINTMENTS);
        
        // Filter appointments for this stylist
        const stylistAppointments = allAppointments.filter(a => {
            if (user.role === 'admin') return true; // admin sees all
            return a.stylist_id === stylist.id;
        });

        // Compute statistics for TODAY
        const todayAppointments = stylistAppointments.filter(a => a.date === TODAY_STR);
        const pendingCount = todayAppointments.filter(a => a.status === 'pending').length;
        const confirmedCount = todayAppointments.filter(a => a.status === 'confirmed').length;
        const completedCount = todayAppointments.filter(a => a.status === 'completed').length;

        // Filter list based on toggle (Today vs Week)
        let displayList = [];
        if (currentViewMode === 'today') {
            displayList = todayAppointments.sort((a, b) => a.time_slot.localeCompare(b.time_slot));
        } else {
            // Next 7 days starting from today
            const endDate = getFutureDate(TODAY_STR, 6);
            displayList = stylistAppointments.filter(a => a.date >= TODAY_STR && a.date <= endDate)
                .sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return a.time_slot.localeCompare(b.time_slot);
                });
        }

        // Render schedule lists
        let listHtml = '';
        if (displayList.length === 0) {
            listHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3 class="empty-state-title">No appointments scheduled</h3>
                    <p class="empty-state-text">There are no client bookings for this ${currentViewMode}.</p>
                </div>
            `;
        } else {
            // If week view, we group by date
            if (currentViewMode === 'week') {
                let lastDate = '';
                displayList.forEach(a => {
                    if (a.date !== lastDate) {
                        lastDate = a.date;
                        listHtml += `
                            <div style="font-weight: var(--weight-bold); font-size: var(--font-md); margin-top: var(--space-4); margin-bottom: var(--space-2); color: var(--accent-primary); border-bottom: 1px solid var(--border-light); padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
                                📅 ${Utils.formatDate(a.date)}
                            </div>
                        `;
                    }
                    listHtml += renderScheduleItem(a, user.role === 'admin');
                });
            } else {
                displayList.forEach(a => {
                    listHtml += renderScheduleItem(a, user.role === 'admin');
                });
            }
        }

        const todayFormatted = Utils.formatDate(TODAY_STR);

        container.innerHTML = `
            <div class="page-header flex-between" style="flex-wrap: wrap; gap: var(--space-4);">
                <div>
                    <h1 class="page-title">Today's Schedule</h1>
                    <p class="page-subtitle">${todayFormatted} • Welcome, ${Utils.escapeHtml(user.full_name)}</p>
                </div>
                <div style="display: flex; gap: var(--space-2);">
                    <button class="btn ${currentViewMode === 'today' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="DashboardView.switchViewMode('today')">Today Only</button>
                    <button class="btn ${currentViewMode === 'week' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="DashboardView.switchViewMode('week')">Weekly View</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${todayAppointments.length}</div>
                    <div class="stat-label">Total Today</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--status-pending);">${pendingCount}</div>
                    <div class="stat-label">Pending Requests</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--status-confirmed);">${confirmedCount}</div>
                    <div class="stat-label">Confirmed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--status-completed);">${completedCount}</div>
                    <div class="stat-label">Completed</div>
                </div>
            </div>

            <div class="card">
                <h3 style="font-family: var(--font-body); font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-5);">
                    ${currentViewMode === 'today' ? 'Daily Schedule' : '7-Day Upcoming Bookings'}
                </h3>
                
                <div class="schedule-list">
                    ${listHtml}
                </div>
            </div>

            <!-- WhatsApp API Configuration (Only shown to Admin) -->
            ${user.role === 'admin' ? `
            <div class="card mt-6" style="border: 1px solid var(--border); padding: 20px;">
                <h3 style="font-family: var(--font-body); font-weight: var(--weight-bold); font-size: 1.1rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    💬 WhatsApp API Settings (Twilio Sandbox)
                </h3>
                <p style="font-size: var(--font-xs); color: var(--text-secondary); margin-bottom: 16px;">
                    Configure your Twilio account details below to send automatic WhatsApp booking confirmation messages to clients.
                </p>
                <div class="form-row" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: var(--font-xs); margin-bottom: 4px;" for="twilio-account-sid">Twilio Account SID</label>
                        <input class="form-input" style="padding: 8px 12px; font-size: var(--font-sm);" type="text" id="twilio-account-sid" value="${localStorage.getItem('twilio_account_sid') || 'AC3f334c365db2ffff2ee9609665823822'}" placeholder="Enter Account SID">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="font-size: var(--font-xs); margin-bottom: 4px;" for="twilio-auth-token">Twilio Auth Token</label>
                        <input class="form-input" style="padding: 8px 12px; font-size: var(--font-sm);" type="password" id="twilio-auth-token" value="${localStorage.getItem('twilio_auth_token') || ''}" placeholder="Enter Auth Token">
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm mt-3" onclick="DashboardView.saveTwilioSettings()" style="padding: 8px 16px;">Save Settings ✅</button>
            </div>
            ` : ''}
        `;
    }

    function renderScheduleItem(appt, showStylistName = false) {
        const client = Store.getById(Store.KEYS.USERS, appt.client_id);
        const serviceName = Utils.getAppointmentServiceName(appt);
        
        let stylistNameText = '';
        if (showStylistName) {
            const stylist = Store.getById(Store.KEYS.STYLISTS, appt.stylist_id);
            const stylistUser = stylist ? Store.getById(Store.KEYS.USERS, stylist.user_id) : null;
            if (stylistUser) {
                stylistNameText = ` | Stylist: <strong>${Utils.escapeHtml(stylistUser.full_name.split(' ')[0])}</strong>`;
            }
        }

        const clientName = client ? client.full_name : 'Walk-in Client';
        const timeFormatted = Utils.formatTime(appt.time_slot);
        const statusBadge = `<span class="badge ${Utils.getStatusClass(appt.status)}" style="font-size: 10px; padding: 2px 8px;">${appt.status}</span>`;

        let actionButtonsHtml = '';
        if (appt.status === 'pending') {
            actionButtonsHtml = `
                <button class="btn btn-secondary btn-sm" style="color: var(--status-confirmed); border-color: var(--status-confirmed); padding: 4px 10px;" onclick="DashboardView.updateStatus('${appt.id}', 'confirmed')">Confirm</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: 4px 10px;" onclick="DashboardView.updateStatus('${appt.id}', 'cancelled')">Cancel</button>
            `;
        } else if (appt.status === 'confirmed') {
            actionButtonsHtml = `
                <button class="btn btn-secondary btn-sm" style="color: var(--status-completed); border-color: var(--status-completed); padding: 4px 10px;" onclick="DashboardView.updateStatus('${appt.id}', 'completed')">Complete</button>
                <button class="btn btn-ghost btn-sm" style="color: var(--danger); padding: 4px 10px;" onclick="DashboardView.updateStatus('${appt.id}', 'cancelled')">Cancel</button>
            `;
        }

        return `
            <div class="schedule-item">
                <div class="schedule-item-time">${timeFormatted}</div>
                <div class="schedule-item-info">
                    <div class="schedule-item-client">${Utils.escapeHtml(clientName)}</div>
                    <div class="schedule-item-service">${Utils.escapeHtml(serviceName)}${stylistNameText}</div>
                    ${appt.notes ? `<div style="font-size: var(--font-xs); color: var(--text-muted); font-style: italic; margin-top: 2px;">Note: "${Utils.escapeHtml(appt.notes)}"</div>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
                    ${statusBadge}
                    <div class="schedule-item-actions">
                        ${actionButtonsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function switchViewMode(mode) {
        currentViewMode = mode;
        render();
    }

    function updateStatus(id, newStatus) {
        if (confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
            Store.update(Store.KEYS.APPOINTMENTS, id, { status: newStatus });
            
            // Trigger in-app notifications
            Notifications.onStatusChange(id, newStatus);
            App.showToast(`Appointment successfully marked as ${newStatus}.`, 'success');
            App.updateLayout();
            
            render();
        }
    }

    // Date helper
    function getFutureDate(dateStr, offsetDays) {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + offsetDays);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function saveTwilioSettings() {
        const sid = document.getElementById('twilio-account-sid').value.trim();
        const token = document.getElementById('twilio-auth-token').value.trim();
        if (sid) {
            localStorage.setItem('twilio_account_sid', sid);
        }
        if (token) {
            localStorage.setItem('twilio_auth_token', token);
        }
        App.showToast('Twilio settings saved successfully!', 'success');
    }

    return {
        render,
        switchViewMode,
        updateStatus,
        saveTwilioSettings
    };
})();
