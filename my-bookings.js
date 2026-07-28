const MyBookingsView = (() => {
    let currentTab = 'upcoming'; // 'upcoming' or 'past'
    const TODAY_STR = '2026-07-12';

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const user = Auth.getCurrentUser();
        if (!user) return;

        // Fetch bookings for this client
        const bookings = Store.query(Store.KEYS.APPOINTMENTS, a => a.client_id === user.id);

        // Filter bookings by tabs
        const upcomingBookings = bookings.filter(b => {
            // Upcoming is today or future, and status is pending or confirmed
            return (b.date >= TODAY_STR) && (b.status === 'pending' || b.status === 'confirmed');
        }).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time_slot.localeCompare(b.time_slot);
        });

        const pastBookings = bookings.filter(b => {
            // Past is completed, cancelled, or date is in the past
            return (b.date < TODAY_STR) || (b.status === 'completed' || b.status === 'cancelled');
        }).sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.time_slot.localeCompare(a.time_slot);
        });

        const activeList = currentTab === 'upcoming' ? upcomingBookings : pastBookings;

        let listHtml = '';
        if (activeList.length === 0) {
            const icon = currentTab === 'upcoming' ? '📅' : '📋';
            const title = currentTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings';
            const text = currentTab === 'upcoming' 
                ? 'You don\'t have any scheduled salon appointments. Book one today!'
                : 'Your appointment history is currently empty.';
            
            listHtml = `
                <div class="empty-state">
                    <div class="empty-state-icon">${icon}</div>
                    <h3 class="empty-state-title">${title}</h3>
                    <p class="empty-state-text">${text}</p>
                    ${currentTab === 'upcoming' ? `<button class="btn btn-primary mt-4" onclick="Router.navigate('/booking')">Book Now</button>` : ''}
                </div>
            `;
        } else {
            activeList.forEach(b => {
                const serviceName = Utils.getAppointmentServiceName(b);
                const stylist = Store.getById(Store.KEYS.STYLISTS, b.stylist_id);
                const stylistUser = stylist ? Store.getById(Store.KEYS.USERS, stylist.user_id) : null;
                
                const stylistName = stylistUser ? stylistUser.full_name : 'Salon Stylist';
                const statusBadge = `<span class="badge ${Utils.getStatusClass(b.status)}">${b.status}</span>`;
                const dateFormatted = Utils.formatDate(b.date);
                const timeFormatted = Utils.formatTime(b.time_slot);

                const showCancel = currentTab === 'upcoming' && (b.status === 'pending' || b.status === 'confirmed');

                listHtml += `
                    <div class="appointment-card">
                        <div class="appointment-card-time">
                            <div class="appointment-card-time-slot">${timeFormatted}</div>
                            <div class="appointment-card-date">${dateFormatted}</div>
                        </div>
                        <div class="appointment-card-details">
                            <h3 class="appointment-card-service">${Utils.escapeHtml(serviceName)}</h3>
                            <p class="appointment-card-stylist">with <strong>${Utils.escapeHtml(stylistName)}</strong></p>
                            <div class="mt-2">${statusBadge}</div>
                        </div>
                        ${showCancel ? `
                            <div class="appointment-card-actions">
                                <button class="btn btn-secondary btn-danger btn-sm" onclick="MyBookingsView.cancelAppointment('${b.id}')">Cancel Booking</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">My Bookings</h1>
                <p class="page-subtitle">Track your appointment history and upcoming visits</p>
            </div>

            <div class="tabs">
                <div class="tab ${currentTab === 'upcoming' ? 'active' : ''}" onclick="MyBookingsView.switchTab('upcoming')">Upcoming Appointments</div>
                <div class="tab ${currentTab === 'past' ? 'active' : ''}" onclick="MyBookingsView.switchTab('past')">Past History</div>
            </div>

            <div class="bookings-list-container">
                ${listHtml}
            </div>
        `;
    }

    function switchTab(tab) {
        currentTab = tab;
        render();
    }

    function cancelAppointment(id) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            Store.update(Store.KEYS.APPOINTMENTS, id, { status: 'cancelled' });
            
            // Trigger in-app notification & alert layout
            Notifications.onStatusChange(id, 'cancelled');
            App.showToast('Appointment successfully cancelled.', 'info');
            App.updateLayout();
            
            render();
        }
    }

    return {
        render,
        switchTab,
        cancelAppointment
    };
})();
