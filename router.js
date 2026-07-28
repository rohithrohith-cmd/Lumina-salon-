const Router = (() => {
    const routes = {};

    function register(path, handler, options = {}) {
        routes[path] = {
            handler,
            requireAuth: options.requireAuth !== false,
            roles: options.roles || [],
            title: options.title || ''
        };
    }

    function navigate(path) {
        window.location.hash = path;
    }

    function getCurrentPath() {
        const hash = window.location.hash;
        if (!hash) return '/home';
        // Extract the path before any query parameters
        const path = hash.split('?')[0].substr(1);
        return path || '/home';
    }

    function handleRoute() {
        const path = getCurrentPath();
        const route = routes[path];

        if (!route) {
            // Redirect to home if path not found
            console.warn(`Route not found: ${path}. Redirecting to /home`);
            navigate('/home');
            return;
        }

        // Authentication Guard
        if (route.requireAuth && !Auth.isAuthenticated()) {
            navigate('/login');
            return;
        }

        // Logged-in users should not see login/register
        if (!route.requireAuth && Auth.isAuthenticated()) {
            const user = Auth.getCurrentUser();
            if (user.role === 'client') {
                navigate('/home');
            } else {
                navigate('/dashboard');
            }
            return;
        }

        // Role Authorization Guard
        if (route.roles.length > 0 && !Auth.hasRole(...route.roles)) {
            const user = Auth.getCurrentUser();
            if (user) {
                if (user.role === 'client') {
                    navigate('/home');
                } else {
                    navigate('/dashboard');
                }
            } else {
                navigate('/login');
            }
            return;
        }

        // Update layouts and navigation
        App.updateLayout();

        // Update document title
        if (route.title) {
            document.title = `Lumina Style — ${route.title}`;
        } else {
            document.title = 'Lumina Style — Salon Booking';
        }

        // Execute route handler
        route.handler();

        // Close mobile drawers on navigation
        App.closeSidebar();
    }

    function start() {
        window.addEventListener('hashchange', handleRoute);
        // Trigger initial routing
        handleRoute();
    }

    return {
        register,
        navigate,
        getCurrentPath,
        handleRoute,
        start
    };
})();
