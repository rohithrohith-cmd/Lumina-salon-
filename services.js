const ServicesView = (() => {
    let allServices = [];
    let selectedServiceIds = new Set();

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        allServices = Store.query(Store.KEYS.SERVICES, s => s.is_active);

        container.innerHTML = `
            <div class="page-header flex-between" style="flex-wrap: wrap; gap: var(--space-4);">
                <div>
                    <h1 class="page-title">Service Menu</h1>
                    <p class="page-subtitle">Select single or multiple styling treatments to book together</p>
                </div>
                <div class="form-group" style="margin-bottom: 0; min-width: 280px;">
                    <input class="form-input" type="text" id="service-search" placeholder="Search services... 🔍">
                </div>
            </div>

            <div class="grid grid-auto mb-16" id="services-grid" style="padding-bottom: 60px;">
                ${renderServicesList(allServices)}
            </div>

            <div id="selection-bar-container">
                ${renderSelectionBar()}
            </div>
        `;

        // Add search binding
        const searchInput = document.getElementById('service-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = allServices.filter(s => 
                    s.name.toLowerCase().includes(query) || 
                    s.description.toLowerCase().includes(query)
                );
                document.getElementById('services-grid').innerHTML = renderServicesList(filtered);
            }, 200));
        }
    }

    function toggleService(svcId, event) {
        if (event) event.stopPropagation();
        
        if (selectedServiceIds.has(svcId)) {
            selectedServiceIds.delete(svcId);
        } else {
            selectedServiceIds.add(svcId);
        }

        updateUI();
    }

    function clearSelection() {
        selectedServiceIds.clear();
        updateUI();
    }

    function bookSelected() {
        if (selectedServiceIds.size === 0) return;
        const ids = Array.from(selectedServiceIds).join(',');
        Router.navigate(`/booking?services=${ids}`);
    }

    function updateUI() {
        const grid = document.getElementById('services-grid');
        const barContainer = document.getElementById('selection-bar-container');
        
        if (grid) {
            const searchVal = (document.getElementById('service-search')?.value || '').toLowerCase().trim();
            const currentList = searchVal ? allServices.filter(s => 
                s.name.toLowerCase().includes(searchVal) || 
                s.description.toLowerCase().includes(searchVal)
            ) : allServices;
            grid.innerHTML = renderServicesList(currentList);
        }

        if (barContainer) {
            barContainer.innerHTML = renderSelectionBar();
        }
    }

    function renderServicesList(services) {
        if (services.length === 0) {
            return `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">✂️</div>
                    <h3 class="empty-state-title">No Services Found</h3>
                    <p class="empty-state-text">We couldn't find any services matching your search criteria. Please try another search.</p>
                </div>
            `;
        }

        let html = '';
        services.forEach(svc => {
            const isSelected = selectedServiceIds.has(svc.id);
            html += `
                <div class="service-card ${isSelected ? 'selected' : ''}" style="cursor: pointer; position: relative; transition: all var(--transition-normal); ${isSelected ? 'border-color: var(--accent-primary); box-shadow: 0 0 0 2px var(--accent-primary); background-color: var(--accent-primary-light);' : ''}" onclick="ServicesView.toggleService('${svc.id}', event)">
                    <div class="service-card-content">
                        <div class="service-card-header">
                            <div style="display: flex; align-items: center; gap: var(--space-2);">
                                <input type="checkbox" ${isSelected ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary); cursor: pointer;" onclick="ServicesView.toggleService('${svc.id}', event)">
                                <h3 class="service-card-name">${Utils.escapeHtml(svc.name)}</h3>
                            </div>
                            <span class="service-card-price">${Utils.formatPrice(svc.price)}</span>
                        </div>
                        <p class="service-card-description">${Utils.escapeHtml(svc.description)}</p>
                        <div class="service-card-footer">
                            <div class="service-card-duration">
                                <span>🕐</span> ${svc.duration_minutes} mins
                            </div>
                            <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ServicesView.toggleService('${svc.id}', event)">
                                ${isSelected ? '✓ Selected' : '+ Add Service'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        return html;
    }

    function renderSelectionBar() {
        if (selectedServiceIds.size === 0) return '';

        const selectedServices = allServices.filter(s => selectedServiceIds.has(s.id));
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
        const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const count = selectedServices.length;

        return `
            <div class="sticky-selection-bar" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 900px; background: rgba(30, 27, 46, 0.95); backdrop-filter: blur(12px); color: var(--white); border-radius: var(--radius-xl); padding: var(--space-4) var(--space-6); box-shadow: var(--shadow-xl); border: 1px solid rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); z-index: 1000; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;">
                    <div style="background-color: var(--accent-primary); color: var(--white); font-weight: var(--weight-bold); font-size: var(--font-sm); padding: 6px 14px; border-radius: var(--radius-pill); display: flex; align-items: center; gap: 6px;">
                        <span>✨</span> ${count} ${count === 1 ? 'Service' : 'Services'} Selected
                    </div>
                    <div style="font-size: var(--font-sm); color: rgba(255, 255, 255, 0.85); display: flex; gap: 16px; align-items: center;">
                        <span>🕐 <strong>${totalDuration} mins</strong></span>
                        <span>Total: <strong style="color: var(--accent-secondary); font-size: var(--font-md);">${Utils.formatPrice(totalPrice)}</strong></span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <button class="btn btn-sm" onclick="ServicesView.clearSelection()" style="background: rgba(255, 255, 255, 0.15); color: var(--white); border: none;">Clear</button>
                    <button class="btn btn-primary btn-sm" onclick="ServicesView.bookSelected()" style="font-weight: var(--weight-bold); padding: 10px 20px;">Book Selected Services ➡️</button>
                </div>
            </div>
            <style>
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            </style>
        `;
    }

    return {
        render,
        toggleService,
        clearSelection,
        bookSelected
    };
})();
