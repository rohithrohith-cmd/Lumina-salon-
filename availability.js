const AvailabilityView = (() => {
    let currentStylist = null;
    let localAvailability = {}; // Copy of weekly availability for editing

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const user = Auth.getCurrentUser();
        if (!user) return;

        currentStylist = Store.query(Store.KEYS.STYLISTS, s => s.user_id === user.id)[0];
        if (!currentStylist) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Stylist Profile Missing</h3>
                    <p class="empty-state-text">Your user account does not have an associated stylist profile. Please contact an admin.</p>
                </div>
            `;
            return;
        }

        // Deep copy availability to edit locally
        localAvailability = JSON.parse(JSON.stringify(currentStylist.weekly_availability));

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Manage Availability</h1>
                <p class="page-subtitle">Configure your weekly operating hours and rest days. Bookings are generated based on these slots.</p>
            </div>

            <div class="card">
                <div class="availability-grid" id="availability-rows-container">
                    ${renderAvailabilityRows()}
                </div>

                <div class="card-footer" style="padding-top: var(--space-5); margin-top: var(--space-6); border-top: 1px solid var(--border-light); justify-content: flex-end;">
                    <button class="btn btn-primary" id="btn-save-availability">Save Weekly Hours</button>
                </div>
            </div>
        `;

        bindEvents();
    }

    function renderAvailabilityRows() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        let html = '';

        days.forEach(day => {
            const avail = localAvailability[day] || { open: '09:00', close: '17:00', closed: true };
            const isOpen = !avail.closed;

            html += `
                <div class="availability-day" data-day="${day}">
                    <div class="availability-day-name">${day}</div>
                    
                    <div class="availability-day-times">
                        ${isOpen ? `
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="sr-only" for="open-${day}">Open time</label>
                                <input class="form-input" type="time" id="open-${day}" value="${avail.open}">
                            </div>
                            <span class="text-muted">to</span>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="sr-only" for="close-${day}">Close time</label>
                                <input class="form-input" type="time" id="close-${day}" value="${avail.close}">
                            </div>
                        ` : `
                            <span class="availability-day-closed">⛔ Closed (Off duty)</span>
                        `}
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: var(--font-sm); color: var(--text-secondary);">${isOpen ? 'Open' : 'Closed'}</span>
                        <div class="toggle ${isOpen ? 'active' : ''}" data-day-toggle="${day}"></div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    function bindEvents() {
        // Bind Toggles
        document.querySelectorAll('[data-day-toggle]').forEach(t => {
            t.addEventListener('click', (e) => {
                const day = e.currentTarget.getAttribute('data-day-toggle');
                const isCurrentlyOpen = localAvailability[day] ? !localAvailability[day].closed : false;
                
                if (!localAvailability[day]) {
                    localAvailability[day] = { open: '09:00', close: '17:00', closed: true };
                }

                // Toggle closed status
                localAvailability[day].closed = isCurrentlyOpen; // closed if it was open

                // Re-render rows and preserve user edits
                preserveInputs();
                document.getElementById('availability-rows-container').innerHTML = renderAvailabilityRows();
                bindEvents();
            });
        });

        // Save button
        const saveBtn = document.getElementById('btn-save-availability');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                preserveInputs();
                
                // Update stylist hours in store
                Store.update(Store.KEYS.STYLISTS, currentStylist.id, {
                    weekly_availability: localAvailability
                });

                App.showToast('Weekly availability successfully saved!', 'success');
                render();
            });
        }
    }

    function preserveInputs() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            const openInput = document.getElementById(`open-${day}`);
            const closeInput = document.getElementById(`close-${day}`);
            
            if (localAvailability[day] && !localAvailability[day].closed) {
                if (openInput) localAvailability[day].open = openInput.value;
                if (closeInput) localAvailability[day].close = closeInput.value;
            }
        });
    }

    return {
        render
    };
})();
