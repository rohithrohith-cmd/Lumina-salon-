const HomeView = (() => {
    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        // Fetch first 4 active services
        const services = Store.query(Store.KEYS.SERVICES, s => s.is_active).slice(0, 4);
        
        // Fetch all stylists
        const stylists = Store.getAll(Store.KEYS.STYLISTS);

        let servicesHtml = '';
        services.forEach(svc => {
            servicesHtml += `
                <div class="service-card">
                    <div class="service-card-content">
                        <div class="service-card-header">
                            <h3 class="service-card-name">${Utils.escapeHtml(svc.name)}</h3>
                            <span class="service-card-price">${Utils.formatPrice(svc.price)}</span>
                        </div>
                        <p class="service-card-description">${Utils.escapeHtml(svc.description)}</p>
                        <div class="service-card-footer">
                            <div class="service-card-duration">
                                <span>🕐</span> ${svc.duration_minutes} mins
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('/booking?service=${svc.id}')">Book Now</button>
                        </div>
                    </div>
                </div>
            `;
        });

        let stylistsHtml = '';
        stylists.forEach(sty => {
            const user = Store.getById(Store.KEYS.USERS, sty.user_id);
            if (!user) return;

            const initials = user.full_name.split(' ').map(n => n[0]).join('');
            
            let specialtiesHtml = '';
            sty.specialties.forEach(spec => {
                specialtiesHtml += `<span class="tag">${Utils.escapeHtml(spec)}</span>`;
            });

            stylistsHtml += `
                <div class="stylist-card">
                    <div class="avatar avatar-xl avatar-placeholder stylist-card-image">${initials}</div>
                    <h3 class="stylist-card-name">${Utils.escapeHtml(user.full_name)}</h3>
                    <p class="stylist-card-bio">${Utils.escapeHtml(sty.bio)}</p>
                    <div class="stylist-card-specialties">
                        ${specialtiesHtml}
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="Router.navigate('/booking?stylist=${sty.id}')">Book with ${Utils.escapeHtml(user.full_name.split(' ')[0])}</button>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="hero">
                <div class="hero-decoration hero-dec-1"></div>
                <div class="hero-decoration hero-dec-2"></div>
                <h1 class="hero-title">Elevate Your <span class="accent">Style</span></h1>
                <p class="hero-subtitle">Lumina Style connects you with top stylists and premium salon services. Pick your favorite stylist, select a date, and book in real-time.</p>
                <div class="hero-actions">
                    <button class="btn btn-primary" onclick="Router.navigate('/booking')">Book Appointment</button>
                    <button class="btn btn-secondary" onclick="Router.navigate('/services')">Our Services</button>
                </div>
            </div>

            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">✨ Featured Services</h2>
                    <p class="section-subtitle">Experience our most popular treatments designed for perfection</p>
                </div>
                <div class="grid grid-auto">
                    ${servicesHtml}
                </div>
                <div class="text-center mt-6">
                    <button class="btn btn-ghost" onclick="Router.navigate('/services')">View Menu Catalog ↗️</button>
                </div>
            </section>

            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">✨ Meet Our Stylists</h2>
                    <p class="section-subtitle">Dedicated professionals committed to bringing out your best look</p>
                </div>
                <div class="grid grid-2">
                    ${stylistsHtml}
                </div>
            </section>
        `;
    }

    return {
        render
    };
})();
