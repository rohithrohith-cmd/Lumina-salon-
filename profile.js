const ProfileView = (() => {
    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const user = Auth.getCurrentUser();
        if (!user) return;

        // Fetch bookings for statistics
        const bookings = Store.query(Store.KEYS.APPOINTMENTS, a => a.client_id === user.id);
        const upcomingCount = bookings.filter(b => b.date >= '2026-07-12' && (b.status === 'pending' || b.status === 'confirmed')).length;
        const completedCount = bookings.filter(b => b.status === 'completed').length;
        
        const initials = user.full_name.split(' ').map(n => n[0]).join('');

        // Fetch last 3 appointments for activity history
        const recentActivity = bookings
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .slice(0, 3);

        let activityHtml = '';
        if (recentActivity.length === 0) {
            activityHtml = `<p class="text-muted" style="font-size: var(--font-md);">No recent activity recorded.</p>`;
        } else {
            recentActivity.forEach(b => {
                const serviceName = Utils.getAppointmentServiceName(b);
                const dateFormatted = Utils.formatDate(b.date);
                const statusBadge = `<span class="badge ${Utils.getStatusClass(b.status)}" style="font-size: 10px; padding: 2px 8px;">${b.status}</span>`;
                
                activityHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--border-light);">
                        <div>
                            <span style="font-weight: var(--weight-medium); display: block; font-size: var(--font-md);">${Utils.escapeHtml(serviceName)}</span>
                            <span style="font-size: var(--font-xs); color: var(--text-muted);">${dateFormatted}</span>
                        </div>
                        <div>
                            ${statusBadge}
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">My Profile</h1>
                <p class="page-subtitle">Manage your personal settings and salon credentials</p>
            </div>

            <div class="card mb-6">
                <div class="profile-header">
                    <div class="avatar avatar-xl avatar-placeholder">${initials}</div>
                    <div class="profile-info">
                        <h2 class="profile-name">${Utils.escapeHtml(user.full_name)}</h2>
                        <p class="profile-email">✉️ ${Utils.escapeHtml(user.email)}</p>
                        <p class="profile-email" style="margin-top: 2px;">📞 ${Utils.escapeHtml(user.phone || 'No phone added')}</p>
                        
                        <div class="profile-stats">
                            <div class="profile-stat">
                                <div class="profile-stat-value">${bookings.length}</div>
                                <div class="profile-stat-label">Total Bookings</div>
                            </div>
                            <div class="profile-stat">
                                <div class="profile-stat-value">${upcomingCount}</div>
                                <div class="profile-stat-label">Upcoming</div>
                            </div>
                            <div class="profile-stat">
                                <div class="profile-stat-value">${completedCount}</div>
                                <div class="profile-stat-label">Completed</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <h3 style="font-family: var(--font-body); font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-4);">Recent Activity</h3>
                    <div style="display: flex; flex-direction: column;">
                        ${activityHtml}
                    </div>
                </div>
                
                <div class="card">
                    <h3 style="font-family: var(--font-body); font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-4);">Account Actions</h3>
                    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                        <button class="btn btn-secondary" onclick="Router.navigate('/my-bookings')">View Scheduled Bookings</button>
                        <button class="btn btn-primary" onclick="Router.navigate('/booking')">Book New Appointment</button>
                        <div class="divider" style="margin: 12px 0;"></div>
                        <button class="btn btn-danger btn-block" onclick="Auth.logout()">Sign Out of Account</button>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        render
    };
})();
