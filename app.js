const App = (() => {
    function init() {
        // 1. Initialize seed data
        Seed.initialize();
        Seed.migrate();
        
        // 2. Register all routes
        Router.register('/login', () => renderAuth('login'), { requireAuth: false, title: 'Login' });
        Router.register('/register', () => renderAuth('register'), { requireAuth: false, title: 'Register' });
        Router.register('/home', () => HomeView.render(), { requireAuth: true, roles: ['client'], title: 'Home' });
        Router.register('/services', () => ServicesView.render(), { requireAuth: true, roles: ['client'], title: 'Services' });
        Router.register('/stylists', () => StylistsView.render(), { requireAuth: true, roles: ['client'], title: 'Stylists' });
        Router.register('/booking', () => BookingView.render(), { requireAuth: true, roles: ['client'], title: 'Book Appointment' });
        Router.register('/my-bookings', () => MyBookingsView.render(), { requireAuth: true, roles: ['client'], title: 'My Bookings' });
        Router.register('/profile', () => ProfileView.render(), { requireAuth: true, roles: ['client'], title: 'Profile' });
        Router.register('/dashboard', () => DashboardView.render(), { requireAuth: true, roles: ['admin'], title: 'Dashboard' });
        Router.register('/appointments', () => AppointmentsView.render(), { requireAuth: true, roles: ['stylist', 'admin'], title: 'Appointments' });
        Router.register('/availability', () => AvailabilityView.render(), { requireAuth: true, roles: ['admin'], title: 'Availability' });
        Router.register('/admin-services', () => AdminServicesView.render(), { requireAuth: true, roles: ['admin'], title: 'Manage Services' });
        Router.register('/admin-stylists', () => AdminStylistsView.render(), { requireAuth: true, roles: ['admin'], title: 'Manage Stylists' });
        
        // 3. Document level click listener to dismiss notification panel when clicking outside
        document.addEventListener('click', (event) => {
            const panel = document.getElementById('notification-panel');
            const clientBell = document.getElementById('notification-bell-client');
            const adminBell = document.getElementById('notification-bell-admin');
            
            if (panel && panel.style.display === 'block') {
                if (!panel.contains(event.target) && 
                    (!clientBell || !clientBell.contains(event.target)) && 
                    (!adminBell || !adminBell.contains(event.target))) {
                    panel.style.display = 'none';
                }
            }
        });

        // 4. Start router
        Router.start();
    }

    function renderAuth(mode) {
        const authContent = document.getElementById('auth-content');
        
        if (mode === 'login') {
            authContent.innerHTML = `
                <div class="auth-page">
                    <div class="auth-card">
                        <h2 class="auth-title">Welcome Back</h2>
                        <p class="auth-subtitle">Log in to manage your bookings and schedule</p>
                        
                        <form id="login-form">
                            <div class="form-group">
                                <label class="form-label" for="login-email">Email Address</label>
                                <input class="form-input" type="email" id="login-email" required placeholder="emma@example.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="login-password">Password</label>
                                <input class="form-input" type="password" id="login-password" required placeholder="••••••••">
                            </div>
                            <div class="form-error" id="login-error" style="display: none; margin-bottom: 16px;"></div>
                            <button class="btn btn-primary btn-block" type="submit">Log In</button>
                        </form>
                        
                        <div class="auth-divider">or</div>
                        
                        <div class="auth-footer">
                            Don't have an account? <a href="#/register">Register here</a>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                const errDiv = document.getElementById('login-error');

                const res = Auth.login(email, password);
                if (res.success) {
                    showToast('Successfully logged in!', 'success');
                    updateLayout();
                    if (res.user.role === 'client') {
                        Router.navigate('/home');
                    } else {
                        Router.navigate('/dashboard');
                    }
                } else {
                    errDiv.textContent = res.error;
                    errDiv.style.display = 'block';
                }
            });
        } else {
            authContent.innerHTML = `
                <div class="auth-page">
                    <div class="auth-card" style="max-width: 500px;">
                        <h2 class="auth-title">Create Account</h2>
                        <p class="auth-subtitle">Join Lumina Style to experience seamless booking</p>
                        
                        <form id="register-form">
                            <div class="form-group">
                                <label class="form-label" for="reg-name">Full Name</label>
                                <input class="form-input" type="text" id="reg-name" required placeholder="Emma Thompson">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="reg-email">Email Address</label>
                                <input class="form-input" type="email" id="reg-email" required placeholder="emma@example.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="reg-phone">Phone Number</label>
                                <input class="form-input" type="tel" id="reg-phone" required placeholder="555-0101">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="reg-password">Password</label>
                                <input class="form-input" type="password" id="reg-password" required placeholder="••••••••">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="reg-role">I want to join as</label>
                                <select class="form-select" id="reg-role">
                                    <option value="client">Client</option>
                                    <option value="stylist">Stylist</option>
                                </select>
                            </div>
                            <div class="form-error" id="reg-error" style="display: none; margin-bottom: 16px;"></div>
                            <button class="btn btn-primary btn-block" type="submit">Create Account</button>
                        </form>
                        
                        <div class="auth-divider">or</div>
                        
                        <div class="auth-footer">
                            Already have an account? <a href="#/login">Log in here</a>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('register-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const full_name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const phone = document.getElementById('reg-phone').value.trim();
                const password = document.getElementById('reg-password').value;
                const role = document.getElementById('reg-role').value;
                const errDiv = document.getElementById('reg-error');

                const res = Auth.register({ full_name, email, phone, password, role });
                if (res.success) {
                    showToast('Successfully registered!', 'success');
                    updateLayout();
                    if (res.user.role === 'client') {
                        Router.navigate('/home');
                    } else {
                        Router.navigate('/dashboard');
                    }
                } else {
                    errDiv.textContent = res.error;
                    errDiv.style.display = 'block';
                }
            });
        }
    }

    function updateLayout() {
        const user = Auth.getCurrentUser();
        const clientNavbar = document.getElementById('client-navbar');
        const sidebarLayout = document.getElementById('sidebar-layout');
        const clientLayout = document.getElementById('client-layout');
        const authLayout = document.getElementById('auth-layout');
        const mobileTabs = document.getElementById('mobile-tabs');

        // Hide all templates first
        clientNavbar.style.display = 'none';
        sidebarLayout.style.display = 'none';
        clientLayout.style.display = 'none';
        authLayout.style.display = 'none';
        mobileTabs.style.display = 'none';

        if (!user) {
            authLayout.style.display = 'block';
            return;
        }

        if (user.role === 'client') {
            clientNavbar.style.display = 'flex';
            clientLayout.style.display = 'block';
            
            // Render mobile bottom tabs (responsive displays block in layout.css on small screens)
            mobileTabs.style.display = 'flex';

            // Set profile data in navbar
            const initials = user.full_name.split(' ').map(n => n[0]).join('');
            const avatar = document.getElementById('navbar-avatar');
            avatar.textContent = initials;
            document.getElementById('navbar-name').textContent = user.full_name;

            // Render notification bell
            document.getElementById('notification-bell-client').innerHTML = Notifications.renderBell();

            // Highlight navbar links
            const currentRoute = Router.getCurrentPath();
            document.querySelectorAll('#navbar-links .navbar-link').forEach(link => {
                if (link.getAttribute('data-route') === `/${currentRoute}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Highlight mobile tabs
            document.querySelectorAll('#mobile-tabs .mobile-tab').forEach(tab => {
                if (tab.getAttribute('data-route') === `/${currentRoute}`) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        } else if (user.role === 'stylist' || user.role === 'admin') {
            sidebarLayout.style.display = 'flex';
            
            // Set user data in sidebar
            document.getElementById('sidebar-user-name').textContent = user.full_name;

            // Display / hide admin-only sections
            const adminLinks = document.querySelectorAll('.admin-only');
            adminLinks.forEach(link => {
                if (user.role === 'admin') {
                    link.style.display = link.tagName === 'DIV' ? 'block' : 'flex';
                } else {
                    link.style.display = 'none';
                }
            });

            // Render notification bell
            document.getElementById('notification-bell-admin').innerHTML = Notifications.renderBell();

            // Highlight sidebar links
            const currentRoute = Router.getCurrentPath();
            document.querySelectorAll('#sidebar-nav .sidebar-link').forEach(link => {
                if (link.getAttribute('data-route') === `/${currentRoute}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '✨';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'info') icon = 'ℹ️';

        toast.innerHTML = `
            <span>${icon}</span>
            <div>${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 4000);
    }

    function toggleMobileMenu() {
        const links = document.getElementById('navbar-links');
        if (links) {
            links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
            if (links.style.display === 'flex') {
                links.style.position = 'absolute';
                links.style.top = '64px';
                links.style.left = '0';
                links.style.right = '0';
                links.style.flexDirection = 'column';
                links.style.backgroundColor = '#FFFFFF';
                links.style.borderBottom = '1px solid var(--border-light)';
                links.style.padding = '16px';
                links.style.gap = '8px';
            }
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && overlay) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }
    }

    function closeSidebar() {
        const sidebar = document.getElementById('admin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    function toggleNotificationPanel(event, type) {
        event.stopPropagation();
        const panel = document.getElementById('notification-panel');
        if (!panel) return;

        if (panel.style.display === 'block') {
            panel.style.display = 'none';
            return;
        }

        // Render notifications list
        panel.innerHTML = Notifications.renderPanel();
        panel.style.display = 'block';

        // Position panel near the clicked bell
        const bell = event.currentTarget;
        const rect = bell.getBoundingClientRect();
        
        if (type === 'client') {
            panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
            panel.style.left = `${rect.right - 360 + window.scrollX}px`;
            panel.style.position = 'absolute';
        } else {
            // inside sidebar content layout
            panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
            panel.style.left = `${rect.right - 360 + window.scrollX}px`;
            panel.style.position = 'absolute';
        }
    }

    function getContentContainer() {
        const user = Auth.getCurrentUser();
        if (!user) {
            return document.getElementById('auth-content');
        }
        if (user.role === 'client') {
            return document.getElementById('app-content');
        }
        return document.getElementById('admin-content');
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        init,
        updateLayout,
        showToast,
        toggleMobileMenu,
        toggleSidebar,
        closeSidebar,
        toggleNotificationPanel,
        getContentContainer
    };
})();
