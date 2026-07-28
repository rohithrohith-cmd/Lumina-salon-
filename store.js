const Store = (() => {
    const KEYS = {
        USERS: 'luminastyle_users',
        SERVICES: 'luminastyle_services',
        STYLISTS: 'luminastyle_stylists',
        APPOINTMENTS: 'luminastyle_appointments',
        NOTIFICATIONS: 'luminastyle_notifications',
        SESSION: 'luminastyle_session',
        INITIALIZED: 'luminastyle_initialized'
    };

    function getAll(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return [];
        }
    }

    function saveAll(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Error writing to localStorage', e);
        }
    }

    function getById(key, id) {
        const items = getAll(key);
        return items.find(item => item.id === id);
    }

    function create(key, item) {
        const items = getAll(key);
        const newItem = {
            ...item,
            id: item.id || Utils.generateId(),
            created_date: item.created_date || new Date().toISOString()
        };
        items.push(newItem);
        saveAll(key, items);
        return newItem;
    }

    function update(key, id, updates) {
        const items = getAll(key);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return null;
        
        items[idx] = {
            ...items[idx],
            ...updates
        };
        saveAll(key, items);
        return items[idx];
    }

    function remove(key, id) {
        let items = getAll(key);
        items = items.filter(item => item.id !== id);
        saveAll(key, items);
    }

    function query(key, filterFn) {
        const items = getAll(key);
        return items.filter(filterFn);
    }

    function getSession() {
        try {
            const session = localStorage.getItem(KEYS.SESSION);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            console.error('Error getting session', e);
            return null;
        }
    }

    function setSession(user) {
        try {
            localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
        } catch (e) {
            console.error('Error setting session', e);
        }
    }

    function clearSession() {
        localStorage.removeItem(KEYS.SESSION);
    }

    function isInitialized() {
        return localStorage.getItem(KEYS.INITIALIZED) === 'true';
    }

    function markInitialized() {
        localStorage.setItem(KEYS.INITIALIZED, 'true');
    }

    function clear() {
        Object.values(KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    return {
        KEYS,
        getAll,
        getById,
        create,
        update,
        remove,
        query,
        getSession,
        setSession,
        clearSession,
        isInitialized,
        markInitialized,
        clear
    };
})();
