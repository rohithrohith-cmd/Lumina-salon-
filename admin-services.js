const AdminServicesView = (() => {
    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const services = Store.getAll(Store.KEYS.SERVICES);

        let tableRows = '';
        if (services.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="5" class="text-center text-muted" style="padding: var(--space-8);">
                        No services in the catalog. Click "Add Service" to create one.
                    </td>
                </tr>
            `;
        } else {
            services.forEach(svc => {
                const statusBadge = svc.is_active 
                    ? `<span class="badge badge-confirmed">Active</span>`
                    : `<span class="badge badge-completed">Inactive</span>`;
                
                tableRows += `
                    <tr>
                        <td style="font-weight: var(--weight-semibold);">${Utils.escapeHtml(svc.name)}</td>
                        <td>${Utils.escapeHtml(svc.description.substring(0, 50))}${svc.description.length > 50 ? '...' : ''}</td>
                        <td class="price">${Utils.formatPrice(svc.price)}</td>
                        <td>🕐 ${svc.duration_minutes} mins</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="admin-table-actions">
                                <button class="btn btn-secondary btn-sm" onclick="AdminServicesView.openEditModal('${svc.id}')">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="color: var(--accent-primary);" onclick="AdminServicesView.toggleServiceStatus('${svc.id}')">
                                    ${svc.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="AdminServicesView.deleteService('${svc.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        container.innerHTML = `
            <div class="page-header flex-between" style="flex-wrap: wrap; gap: var(--space-4);">
                <div>
                    <h1 class="page-title">Manage Services Catalog</h1>
                    <p class="page-subtitle">Add, edit, or remove services from the client menu</p>
                </div>
                <button class="btn btn-primary" onclick="AdminServicesView.openAddModal()">Add Service ✂️</button>
            </div>

            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <!-- Modal area -->
            <div id="service-modal-area"></div>
        `;
    }

    function openAddModal() {
        renderServiceFormModal('Add Service', {
            id: '',
            name: '',
            description: '',
            price: '',
            duration_minutes: 45,
            is_active: true
        });
    }

    function openEditModal(id) {
        const svc = Store.getById(Store.KEYS.SERVICES, id);
        if (!svc) return;

        renderServiceFormModal('Edit Service', svc);
    }

    function renderServiceFormModal(title, data) {
        const area = document.getElementById('service-modal-area');
        if (!area) return;

        const durations = [15, 30, 45, 60, 90, 120, 150, 180];
        let durationOptions = '';
        durations.forEach(d => {
            durationOptions += `<option value="${d}" ${data.duration_minutes == d ? 'selected' : ''}>${d} minutes</option>`;
        });

        area.innerHTML = `
            <div class="modal-overlay" id="service-form-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="AdminServicesView.closeModal()">✕</button>
                    </div>

                    <form id="service-edit-form">
                        <input type="hidden" id="svc-id" value="${data.id}">
                        
                        <div class="form-group">
                            <label class="form-label" for="svc-name">Service Name</label>
                            <input class="form-input" type="text" id="svc-name" value="${Utils.escapeHtml(data.name)}" required placeholder="e.g. Balayage Highlights">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="svc-desc">Description</label>
                            <textarea class="form-textarea" id="svc-desc" required placeholder="e.g. Beautiful hand-painted highlight technique...">${Utils.escapeHtml(data.description)}</textarea>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="svc-price">Price (INR)</label>
                                <input class="form-input" type="number" id="svc-price" min="0" step="0.01" value="${data.price}" required placeholder="120.00">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="svc-duration">Duration</label>
                                <select class="form-select" id="svc-duration">
                                    ${durationOptions}
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: var(--space-4);">
                            <span style="font-weight: var(--weight-medium); font-size: var(--font-md);">Is Active (Visible to clients)</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div class="toggle ${data.is_active ? 'active' : ''}" id="svc-status-toggle"></div>
                            </div>
                        </div>

                        <div class="form-error" id="svc-form-error" style="display: none; margin-top: 16px;"></div>

                        <div class="modal-footer" style="margin-top: 24px;">
                            <button class="btn btn-ghost" type="button" onclick="AdminServicesView.closeModal()">Cancel</button>
                            <button class="btn btn-primary" type="submit">Save Service</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Toggle handler in modal
        const toggle = document.getElementById('svc-status-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
            });
        }

        // Overlay dismiss
        const overlay = document.getElementById('service-form-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Form submit
        const form = document.getElementById('service-edit-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('svc-id').value;
            const name = document.getElementById('svc-name').value.trim();
            const description = document.getElementById('svc-desc').value.trim();
            const price = parseFloat(document.getElementById('svc-price').value);
            const duration_minutes = parseInt(document.getElementById('svc-duration').value, 10);
            const is_active = document.getElementById('svc-status-toggle').classList.contains('active');
            const errDiv = document.getElementById('svc-form-error');

            if (!name || !description || isNaN(price) || price < 0 || isNaN(duration_minutes)) {
                errDiv.textContent = 'All fields are required. Price must be a positive number.';
                errDiv.style.display = 'block';
                return;
            }

            const serviceData = {
                name,
                description,
                price,
                duration_minutes,
                is_active
            };

            if (id) {
                // Update
                Store.update(Store.KEYS.SERVICES, id, serviceData);
                App.showToast('Service successfully updated.', 'success');
            } else {
                // Create
                Store.create(Store.KEYS.SERVICES, serviceData);
                App.showToast('New service successfully added.', 'success');
            }

            closeModal();
            render();
        });
    }

    function closeModal() {
        const overlay = document.getElementById('service-form-overlay');
        if (overlay) {
            overlay.classList.add('removing');
            overlay.remove();
        }
    }

    function toggleServiceStatus(id) {
        const svc = Store.getById(Store.KEYS.SERVICES, id);
        if (!svc) return;

        const newStatus = !svc.is_active;
        Store.update(Store.KEYS.SERVICES, id, { is_active: newStatus });
        App.showToast(`Service status updated to ${newStatus ? 'active' : 'inactive'}.`, 'success');
        
        render();
    }

    function deleteService(id) {
        if (confirm('Are you sure you want to delete this service? This cannot be undone.')) {
            Store.remove(Store.KEYS.SERVICES, id);
            App.showToast('Service deleted from catalog.', 'info');
            render();
        }
    }

    return {
        render,
        openAddModal,
        openEditModal,
        closeModal,
        toggleServiceStatus,
        deleteService
    };
})();
