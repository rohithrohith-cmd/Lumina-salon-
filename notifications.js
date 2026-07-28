const Notifications = (() => {
    function create(userId, message, appointmentId) {
        return Store.create(Store.KEYS.NOTIFICATIONS, {
            user_id: userId,
            message: message,
            appointment_id: appointmentId,
            is_read: false
        });
    }

    function getForUser(userId) {
        return Store.query(Store.KEYS.NOTIFICATIONS, n => n.user_id === userId)
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    function getUnreadCount(userId) {
        return Store.query(Store.KEYS.NOTIFICATIONS, n => n.user_id === userId && !n.is_read).length;
    }

    function markAsRead(notifId) {
        return Store.update(Store.KEYS.NOTIFICATIONS, notifId, { is_read: true });
    }

    function markAllAsRead(userId) {
        const unread = Store.query(Store.KEYS.NOTIFICATIONS, n => n.user_id === userId && !n.is_read);
        unread.forEach(n => {
            Store.update(Store.KEYS.NOTIFICATIONS, n.id, { is_read: true });
        });
    }

    function renderBell() {
        const user = Auth.getCurrentUser();
        if (!user) return '';

        const count = getUnreadCount(user.id);
        return `
            🔔
            ${count > 0 ? `<span class="notification-count">${count}</span>` : ''}
        `;
    }

    function renderPanel() {
        const user = Auth.getCurrentUser();
        if (!user) return '';

        const list = getForUser(user.id);

        let html = `
            <div class="notification-header">
                <h3>Notifications</h3>
                ${list.some(n => !n.is_read) ? `<button class="btn btn-ghost btn-sm" onclick="Notifications.handleMarkAllAsRead()">Mark all as read</button>` : ''}
            </div>
            <div class="notification-list">
        `;

        if (list.length === 0) {
            html += `
                <div class="notification-empty">
                    <p>No notifications yet</p>
                </div>
            `;
        } else {
            list.forEach(n => {
                const timeAgo = formatTimeAgo(n.created_date);
                html += `
                    <div class="notification-item ${!n.is_read ? 'unread' : ''}" onclick="Notifications.handleNotifClick('${n.id}', '${n.appointment_id}')">
                        <div class="notification-message">${Utils.escapeHtml(n.message)}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        return html;
    }

    function formatTimeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (60 * 1000));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }

    function handleNotifClick(notifId, appointmentId) {
        markAsRead(notifId);
        App.updateLayout();
        
        // Hide panel
        const panel = document.getElementById('notification-panel');
        if (panel) panel.style.display = 'none';

        // Redirect based on role
        const user = Auth.getCurrentUser();
        if (user.role === 'client') {
            Router.navigate('/my-bookings');
        } else {
            Router.navigate('/appointments');
        }
    }

    function handleMarkAllAsRead() {
        const user = Auth.getCurrentUser();
        if (user) {
            markAllAsRead(user.id);
            App.updateLayout();
            
            // Re-render open panel
            const panel = document.getElementById('notification-panel');
            if (panel && panel.style.display === 'block') {
                panel.innerHTML = renderPanel();
            }
        }
    }

    function onStatusChange(appointmentId, newStatus) {
        const app = Store.getById(Store.KEYS.APPOINTMENTS, appointmentId);
        if (!app) return;

        const serviceName = Utils.getAppointmentServiceName(app);
        const formattedDate = Utils.formatDate(app.date);
        const formattedTime = Utils.formatTime(app.time_slot);

        // Notify Client
        const client = Store.getById(Store.KEYS.USERS, app.client_id);
        if (client) {
            let message = '';
            if (newStatus === 'confirmed') {
                message = `Your ${serviceName} appointment on ${formattedDate} at ${formattedTime} has been confirmed!`;
            } else if (newStatus === 'completed') {
                message = `Your ${serviceName} appointment on ${formattedDate} has been marked as completed. We hope you loved it!`;
            } else if (newStatus === 'cancelled') {
                message = `Your ${serviceName} appointment on ${formattedDate} at ${formattedTime} has been cancelled.`;
            } else if (newStatus === 'pending') {
                message = `Your ${serviceName} appointment on ${formattedDate} is pending approval.`;
            }
            create(client.id, message, appointmentId);

            // Send Real-time WhatsApp Notification to Client
            if (client.phone && (newStatus === 'cancelled' || newStatus === 'confirmed')) {
                const accountSid = localStorage.getItem('twilio_account_sid') || 'AC3f334c365db2ffff2ee9609665823822';
                const authToken = localStorage.getItem('twilio_auth_token');

                if (authToken) {
                    let cleanedPhone = client.phone.replace(/[\s-]/g, '');
                    if (cleanedPhone.length === 10 && /^\d+$/.test(cleanedPhone)) {
                        cleanedPhone = '+91' + cleanedPhone;
                    } else if (!cleanedPhone.startsWith('+')) {
                        cleanedPhone = '+' + cleanedPhone;
                    }

                    fetch('/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            accountSid: accountSid,
                            authToken: authToken,
                            to: 'whatsapp:' + cleanedPhone,
                            from: 'whatsapp:+14155238886',
                            contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
                            contentVariables: JSON.stringify({
                                "1": formattedDate,
                                "2": formattedTime
                            })
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        console.log(`📱 WhatsApp update sent to ${cleanedPhone} (${newStatus}):`, data.sid);
                        App.showToast(`WhatsApp notification sent to client (${newStatus})`, 'info');
                    })
                    .catch(err => {
                        console.error('❌ Status update WhatsApp failed:', err);
                    });
                }
            }
        }

        // Notify Stylist/Admin if cancelled by client
        const user = Auth.getCurrentUser();
        if (user && user.role === 'client' && newStatus === 'cancelled') {
            const stylist = Store.getById(Store.KEYS.STYLISTS, app.stylist_id);
            if (stylist) {
                const clientName = client ? client.full_name : 'A client';
                const message = `${clientName} has cancelled their ${serviceName} appointment on ${formattedDate} at ${formattedTime}.`;
                create(stylist.user_id, message, appointmentId);
            }
        }
    }

    return {
        create,
        getForUser,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        renderBell,
        renderPanel,
        handleNotifClick,
        handleMarkAllAsRead,
        onStatusChange
    };
})();
