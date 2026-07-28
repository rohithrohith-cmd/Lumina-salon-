const Auth = (() => {
    function login(email, password) {
        const users = Store.getAll(Store.KEYS.USERS);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            // Remove password from session object
            const sessionUser = { ...user };
            delete sessionUser.password;
            Store.setSession(sessionUser);
            return { success: true, user: sessionUser };
        }
        
        return { success: false, error: 'Invalid email or password.' };
    }

    function register(userData) {
        const users = Store.getAll(Store.KEYS.USERS);
        const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
        
        if (exists) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        const role = userData.role || 'client';
        const user = Store.create(Store.KEYS.USERS, {
            full_name: userData.full_name,
            email: userData.email.toLowerCase(),
            phone: userData.phone,
            password: userData.password, // demo purpose
            role: role,
            avatar_url: ''
        });

        // If registered user is a stylist, we also need to create a Stylists entry
        if (role === 'stylist') {
            Store.create(Store.KEYS.STYLISTS, {
                user_id: user.id,
                bio: 'Professional stylist.',
                specialties: [],
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
        }

        const sessionUser = { ...user };
        delete sessionUser.password;
        Store.setSession(sessionUser);
        return { success: true, user: sessionUser };
    }

    function logout() {
        Store.clearSession();
        App.updateLayout();
        Router.navigate('/login');
    }

    function getCurrentUser() {
        return Store.getSession();
    }

    function isAuthenticated() {
        return !!getCurrentUser();
    }

    function hasRole(...roles) {
        const user = getCurrentUser();
        if (!user) return false;
        return roles.includes(user.role);
    }

    function requireAuth() {
        if (!isAuthenticated()) {
            Router.navigate('/login');
            return false;
        }
        return true;
    }

    return {
        login,
        register,
        logout,
        getCurrentUser,
        isAuthenticated,
        hasRole,
        requireAuth
    };
})();
