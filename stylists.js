const StylistsView = (() => {
    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const stylists = Store.getAll(Store.KEYS.STYLISTS);

        let stylistsHtml = '';
        stylists.forEach(sty => {
            const user = Store.getById(Store.KEYS.USERS, sty.user_id);
            if (!user) return;

            const initials = user.full_name.split(' ').map(n => n[0]).join('');
            
            let specialtiesHtml = '';
            sty.specialties.forEach(spec => {
                specialtiesHtml += `<span class="tag">${Utils.escapeHtml(spec)}</span>`;
            });

            // Availability text helper
            const availabilityText = formatAvailabilityPreview(sty.weekly_availability);

            stylistsHtml += `
                <div class="card" style="display: flex; flex-direction: column; height: 100%;">
                    <div style="display: flex; gap: var(--space-4); align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap;">
                        <div class="avatar avatar-xl avatar-placeholder">${initials}</div>
                        <div>
                            <h2 style="font-family: var(--font-heading); margin-bottom: var(--space-1);">${Utils.escapeHtml(user.full_name)}</h2>
                            <div class="stylist-card-specialties" style="justify-content: flex-start; margin-bottom: 0;">
                                ${specialtiesHtml}
                            </div>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-family: var(--font-body); font-size: var(--font-md); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--text-primary);">About</h4>
                        <p style="font-size: var(--font-md); line-height: 1.6; margin-bottom: var(--space-4);">${Utils.escapeHtml(sty.bio)}</p>
                        
                        <h4 style="font-family: var(--font-body); font-size: var(--font-md); font-weight: var(--weight-semibold); margin-bottom: var(--space-1); color: var(--text-primary);">Availability</h4>
                        <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-5); display: flex; align-items: center; gap: 6px;">
                            <span>🕐</span> ${availabilityText}
                        </p>
                    </div>
                    <div class="card-footer" style="padding-top: var(--space-4); margin-top: auto; border-top: 1px solid var(--border-light); justify-content: flex-end;">
                        <button class="btn btn-primary btn-block" onclick="Router.navigate('/booking?stylist=${sty.id}')">Book Appointment with ${Utils.escapeHtml(user.full_name.split(' ')[0])}</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Our Stylists</h1>
                <p class="page-subtitle">Connect with our team of elite professionals to receive personalized treatments</p>
            </div>

            <div class="grid grid-2">
                ${stylistsHtml}
            </div>
        `;
    }

    function formatAvailabilityPreview(availability) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const workingDays = [];
        
        days.forEach(day => {
            if (availability[day] && !availability[day].closed) {
                const dayAbbrev = day.substr(0, 3).toUpperCase();
                workingDays.push(dayAbbrev);
            }
        });

        if (workingDays.length === 0) return 'No availability';
        if (workingDays.length === 7) return 'Every day (Mon - Sun)';
        
        // simple range formatter
        return workingDays.join(', ');
    }

    return {
        render
    };
})();
