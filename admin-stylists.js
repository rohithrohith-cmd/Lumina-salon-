const AdminStylistsView = (() => {
    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        const stylists = Store.getAll(Store.KEYS.STYLISTS);

        let tableRows = '';
        if (stylists.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="5" class="text-center text-muted" style="padding: var(--space-8);">
                        No stylists found. Click "Add Stylist" to create one.
                    </td>
                </tr>
            `;
        } else {
            stylists.forEach(sty => {
                const user = Store.getById(Store.KEYS.USERS, sty.user_id);
                if (!user) return;

                const specialtiesBadges = sty.specialties.map(spec => 
                    `<span class="tag" style="margin-right: 4px; margin-bottom: 4px; font-size: 0.7rem;">${Utils.escapeHtml(spec)}</span>`
                ).join('');

                tableRows += `
                    <tr>
                        <td style="font-weight: var(--weight-semibold); display: flex; align-items: center; gap: 12px; border-bottom: none;">
                            <div class="avatar avatar-sm avatar-placeholder">
                                ${user.full_name.charAt(0)}
                            </div>
                            <div>
                                <div style="font-weight: var(--weight-bold);">${Utils.escapeHtml(user.full_name)}</div>
                                <div style="font-size: var(--font-xs); color: var(--text-secondary);">${Utils.escapeHtml(user.email)}</div>
                            </div>
                        </td>
                        <td>${Utils.escapeHtml(user.phone || 'N/A')}</td>
                        <td style="max-width: 250px; font-size: var(--font-sm); white-space: normal;">
                            ${Utils.escapeHtml(sty.bio)}
                        </td>
                        <td>
                            <div style="display: flex; flex-wrap: wrap;">
                                ${specialtiesBadges || '<span class="text-muted">None</span>'}
                            </div>
                        </td>
                        <td>
                            <div class="admin-table-actions">
                                <button class="btn btn-secondary btn-sm" onclick="AdminStylistsView.openEditModal('${sty.id}')">Edit</button>
                                <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="AdminStylistsView.deleteStylist('${sty.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        container.innerHTML = `
            <div class="page-header flex-between" style="flex-wrap: wrap; gap: var(--space-4);">
                <div>
                    <h1 class="page-title">Manage Stylists</h1>
                    <p class="page-subtitle">Add, edit, or remove salon stylists and their bio details</p>
                </div>
                <button class="btn btn-primary" onclick="AdminStylistsView.openAddModal()">Add Stylist 💇</button>
            </div>

            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Stylist</th>
                            <th>Phone</th>
                            <th>Bio</th>
                            <th>Specialties</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <!-- Modal container -->
            <div id="stylist-modal-area"></div>
        `;
    }

    function openAddModal() {
        renderStylistFormModal('Add Stylist', {
            id: '',
            user_id: '',
            bio: '',
            specialties: [],
            full_name: '',
            email: '',
            phone: '',
            password: ''
        });
    }

    function openEditModal(id) {
        const sty = Store.getById(Store.KEYS.STYLISTS, id);
        if (!sty) return;

        const user = Store.getById(Store.KEYS.USERS, sty.user_id);
        if (!user) return;

        renderStylistFormModal('Edit Stylist', {
            id: sty.id,
            user_id: sty.user_id,
            bio: sty.bio,
            specialties: sty.specialties,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone || '',
            password: '' // Don't expose password
        });
    }

    function renderStylistFormModal(title, data) {
        const area = document.getElementById('stylist-modal-area');
        if (!area) return;

        const isEdit = !!data.id;
        const specialtiesString = data.specialties.join(', ');

        area.innerHTML = `
            <div class="modal-overlay" id="stylist-form-overlay" style="display: flex;">
                <div class="modal" style="max-width: 550px;">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" onclick="AdminStylistsView.closeModal()">✕</button>
                    </div>
                    <form id="stylist-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="sty-name">Full Name</label>
                                <input class="form-input" type="text" id="sty-name" value="${Utils.escapeHtml(data.full_name)}" required placeholder="e.g. Sophia Laurent">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="sty-phone">Phone Number</label>
                                <input class="form-input" type="text" id="sty-phone" value="${Utils.escapeHtml(data.phone)}" placeholder="e.g. 555-0201">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="sty-email">Email Address</label>
                                <input class="form-input" type="email" id="sty-email" value="${Utils.escapeHtml(data.email)}" required placeholder="e.g. sophia@luminastyle.com" ${isEdit ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="sty-password">${isEdit ? 'Password (Leave blank to keep)' : 'Password'}</label>
                                <input class="form-input" type="password" id="sty-password" placeholder="••••••••" ${isEdit ? '' : 'required'}>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="sty-specialties">Specialties (Comma separated)</label>
                            <input class="form-input" type="text" id="sty-specialties" value="${Utils.escapeHtml(specialtiesString)}" placeholder="e.g. Balayage, Creative Color, Haircut">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="sty-bio">Stylist Biography</label>
                            <textarea class="form-textarea" id="sty-bio" required placeholder="Describe the stylist's experience, techniques, and background..." style="min-height: 80px;">${Utils.escapeHtml(data.bio)}</textarea>
                        </div>

                        <div class="modal-footer">
                            <button class="btn btn-ghost" type="button" onclick="AdminStylistsView.closeModal()">Cancel</button>
                            <button class="btn btn-primary" type="submit">Save Stylist</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Bind form submit
        document.getElementById('stylist-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveStylist(data.id, data.user_id);
        });
    }

    function saveStylist(id, userId) {
        const fullName = document.getElementById('sty-name').value.trim();
        const phone = document.getElementById('sty-phone').value.trim();
        const email = document.getElementById('sty-email') ? document.getElementById('sty-email').value.trim() : '';
        const password = document.getElementById('sty-password').value;
        const bio = document.getElementById('sty-bio').value.trim();
        
        // Parse specialties
        const specsVal = document.getElementById('sty-specialties').value;
        const specialties = specsVal ? specsVal.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];

        if (id) {
            // Edit Mode
            // 1. Update user credentials
            const userUpdates = { full_name: fullName, phone };
            if (password) {
                userUpdates.password = password;
            }
            Store.update(Store.KEYS.USERS, userId, userUpdates);

            // 2. Update stylist details
            Store.update(Store.KEYS.STYLISTS, id, { bio, specialties });
            
            App.showToast('Stylist updated successfully!');
        } else {
            // Add Mode
            // 1. Validate email duplicate
            const existingUser = Store.query(Store.KEYS.USERS, u => u.email.toLowerCase() === email.toLowerCase())[0];
            if (existingUser) {
                alert('A user with this email address already exists!');
                return;
            }

            // 2. Create User Account
            const newUser = Store.create(Store.KEYS.USERS, {
                full_name: fullName,
                email: email,
                phone: phone,
                password: password,
                role: 'stylist',
                avatar_url: ''
            });

            // 3. Create Stylist Profile
            Store.create(Store.KEYS.STYLISTS, {
                user_id: newUser.id,
                bio: bio,
                specialties: specialties,
                profile_image_url: '',
                weekly_availability: {
                    monday: { open: '09:00', close: '17:00', closed: false },
                    tuesday: { open: '09:00', close: '17:00', closed: false },
                    wednesday: { open: '09:00', close: '17:00', closed: false },
                    thursday: { open: '09:00', close: '17:00', closed: false },
                    friday: { open: '09:00', close: '17:00', closed: false },
                    saturday: { open: '09:00', close: '17:00', closed: false },
                    sunday: { open: '00:00', close: '00:00', closed: true }
                }
            });

            App.showToast('New Stylist created successfully!');
        }

        closeModal();
        render();
    }

    function deleteStylist(id) {
        const sty = Store.getById(Store.KEYS.STYLISTS, id);
        if (!sty) return;

        const user = Store.getById(Store.KEYS.USERS, sty.user_id);
        const name = user ? user.full_name : 'this stylist';

        if (confirm(`Are you sure you want to delete ${name}? This will also delete their stylist login account.`)) {
            Store.remove(Store.KEYS.STYLISTS, id);
            if (sty.user_id) {
                Store.remove(Store.KEYS.USERS, sty.user_id);
            }
            App.showToast('Stylist deleted.');
            render();
        }
    }

    function closeModal() {
        const overlay = document.getElementById('stylist-form-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    return {
        render,
        openAddModal,
        openEditModal,
        deleteStylist,
        closeModal
    };
})();
