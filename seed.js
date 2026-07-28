const Seed = (() => {
    function initialize() {
        if (Store.isInitialized()) return;
        
        // Users
        const users = [
            { id: 'user_1', full_name: 'Emma Thompson', email: 'emma@example.com', phone: '+919392981192', password: 'demo123', role: 'client', avatar_url: '', created_date: '2026-01-15' },
            { id: 'user_2', full_name: 'James Wilson', email: 'james@example.com', phone: '555-0102', password: 'demo123', role: 'client', avatar_url: '', created_date: '2026-02-20' },
            { id: 'user_3', full_name: 'Sarah Chen', email: 'sarah@example.com', phone: '555-0103', password: 'demo123', role: 'client', avatar_url: '', created_date: '2026-03-10' },
            { id: 'user_4', full_name: 'Sophia Laurent', email: 'sophia@luminastyle.com', phone: '555-0201', password: 'stylist123', role: 'stylist', avatar_url: '', created_date: '2025-06-01' },
            { id: 'user_5', full_name: 'Marcus Rivera', email: 'marcus@luminastyle.com', phone: '555-0202', password: 'stylist123', role: 'stylist', avatar_url: '', created_date: '2025-07-15' },
            { id: 'user_6', full_name: 'Admin User', email: 'admin@luminastyle.com', phone: '555-0301', password: 'admin123', role: 'admin', avatar_url: '', created_date: '2025-01-01' }
        ];
        
        // Services
        const services = [
            { id: 'svc_1', name: 'Classic Haircut', description: 'Precision cut tailored to your face shape and personal style. Includes consultation and styling.', price: 45, duration_minutes: 45, is_active: true },
            { id: 'svc_2', name: 'Color & Highlights', description: 'Full color service with premium products. Includes custom color mixing and toning.', price: 120, duration_minutes: 120, is_active: true },
            { id: 'svc_3', name: 'Balayage', description: 'Hand-painted highlights for a natural, sun-kissed look. Beautiful gradient from root to tip.', price: 180, duration_minutes: 150, is_active: true },
            { id: 'svc_4', name: 'Blowout & Style', description: 'Professional blowout with heat styling. Perfect for events or a confidence boost.', price: 55, duration_minutes: 45, is_active: true },
            { id: 'svc_5', name: 'Keratin Treatment', description: 'Smoothing keratin treatment for frizz-free, manageable hair lasting up to 3 months.', price: 250, duration_minutes: 180, is_active: true },
            { id: 'svc_6', name: 'Bridal Styling', description: 'Complete bridal hair styling with trial session. Includes accessories placement and touch-ups.', price: 300, duration_minutes: 120, is_active: true },
            { id: 'svc_7', name: 'Beard Trim & Shape', description: 'Expert beard grooming with hot towel treatment. Clean lines and perfect shape.', price: 25, duration_minutes: 30, is_active: true },
            { id: 'svc_8', name: 'Scalp Treatment', description: 'Therapeutic scalp treatment with essential oils and massage. Promotes healthy hair growth.', price: 65, duration_minutes: 60, is_active: true },
            { id: 'svc_9', name: 'Deep Conditioning', description: 'Intensive moisture treatment for damaged or dry hair. Restores shine and elasticity.', price: 40, duration_minutes: 30, is_active: true },
            { id: 'svc_10', name: 'Extensions Consultation', description: 'Full consultation and fitting for premium hair extensions. Natural-looking length and volume.', price: 350, duration_minutes: 90, is_active: true }
        ];
        
        // Stylists
        const stylists = [
            {
                id: 'stylist_1',
                user_id: 'user_4',
                bio: 'With over 10 years of experience in color artistry and precision cuts, Sophia brings Parisian elegance to every appointment. Specializing in balayage and bridal styling.',
                specialties: ['Balayage', 'Bridal', 'Color', 'Precision Cuts'],
                profile_image_url: '',
                weekly_availability: {
                    monday: { open: '09:00', close: '17:00', closed: false },
                    tuesday: { open: '09:00', close: '17:00', closed: false },
                    wednesday: { open: '10:00', close: '19:00', closed: false },
                    thursday: { open: '09:00', close: '17:00', closed: false },
                    friday: { open: '09:00', close: '18:00', closed: false },
                    saturday: { open: '10:00', close: '16:00', closed: false },
                    sunday: { open: '00:00', close: '00:00', closed: true }
                }
            },
            {
                id: 'stylist_2',
                user_id: 'user_5',
                bio: 'Marcus combines modern trends with classic techniques. Known for his creative styling and expert beard work, he has a loyal following of clients who trust his artistic vision.',
                specialties: ['Men\'s Cuts', 'Beard Styling', 'Creative Color', 'Extensions'],
                profile_image_url: '',
                weekly_availability: {
                    monday: { open: '10:00', close: '18:00', closed: false },
                    tuesday: { open: '10:00', close: '18:00', closed: false },
                    wednesday: { open: '00:00', close: '00:00', closed: true },
                    thursday: { open: '10:00', close: '18:00', closed: false },
                    friday: { open: '10:00', close: '19:00', closed: false },
                    saturday: { open: '09:00', close: '17:00', closed: false },
                    sunday: { open: '00:00', close: '00:00', closed: true }
                }
            }
        ];
        
        // Generate appointment dates relative to today (today is 2026-07-12)
        const appointments = [
            { id: 'apt_1', client_id: 'user_1', stylist_id: 'stylist_1', service_id: 'svc_1', date: '2026-07-12', time_slot: '10:00', status: 'confirmed', notes: '', created_date: '2026-07-08' },
            { id: 'apt_2', client_id: 'user_2', stylist_id: 'stylist_1', service_id: 'svc_2', date: '2026-07-12', time_slot: '14:00', status: 'pending', notes: 'First time client', created_date: '2026-07-09' },
            { id: 'apt_3', client_id: 'user_1', stylist_id: 'stylist_2', service_id: 'svc_7', date: '2026-07-14', time_slot: '11:00', status: 'pending', notes: '', created_date: '2026-07-10' },
            { id: 'apt_4', client_id: 'user_3', stylist_id: 'stylist_2', service_id: 'svc_4', date: '2026-07-12', time_slot: '15:00', status: 'confirmed', notes: 'Preferred curling iron', created_date: '2026-07-10' },
            { id: 'apt_5', client_id: 'user_1', stylist_id: 'stylist_1', service_id: 'svc_3', date: '2026-07-05', time_slot: '10:00', status: 'completed', notes: 'Great result!', created_date: '2026-06-30' },
            { id: 'apt_6', client_id: 'user_2', stylist_id: 'stylist_2', service_id: 'svc_1', date: '2026-07-03', time_slot: '11:00', status: 'completed', notes: '', created_date: '2026-06-28' },
            { id: 'apt_7', client_id: 'user_3', stylist_id: 'stylist_1', service_id: 'svc_5', date: '2026-07-15', time_slot: '09:00', status: 'pending', notes: 'Has had keratin before', created_date: '2026-07-11' }
        ];
        
        // Notifications
        const notifications = [
            { id: 'notif_1', user_id: 'user_1', message: 'Your appointment on Jul 12 at 10:00 AM has been confirmed by Sophia Laurent!', appointment_id: 'apt_1', is_read: false, created_date: '2026-07-09T10:00:00' },
            { id: 'notif_2', user_id: 'user_3', message: 'Your appointment on Jul 12 at 3:00 PM has been confirmed by Marcus Rivera!', appointment_id: 'apt_4', is_read: true, created_date: '2026-07-10T14:00:00' },
            { id: 'notif_3', user_id: 'user_1', message: 'Your balayage appointment on Jul 5 has been marked as completed. Hope you loved it!', appointment_id: 'apt_5', is_read: true, created_date: '2026-07-05T12:30:00' }
        ];
        
        // Seed to localStorage
        localStorage.setItem(Store.KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(Store.KEYS.SERVICES, JSON.stringify(services));
        localStorage.setItem(Store.KEYS.STYLISTS, JSON.stringify(stylists));
        localStorage.setItem(Store.KEYS.APPOINTMENTS, JSON.stringify(appointments));
        localStorage.setItem(Store.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        
        Store.markInitialized();
        console.log('🌱 Lumina Style seed data initialized');
    }

    // Migration: update demo phone numbers to real numbers
    function migrate() {
        try {
            const users = JSON.parse(localStorage.getItem(Store.KEYS.USERS) || '[]');
            const emma = users.find(u => u.id === 'user_1');
            if (emma && (emma.phone === '555-0101' || !emma.phone.startsWith('+'))) {
                emma.phone = '+919392981192';
                localStorage.setItem(Store.KEYS.USERS, JSON.stringify(users));
                console.log('📱 Migrated Emma phone to real WhatsApp number');
            }
        } catch (e) {
            console.error('Migration error:', e);
        }
    }
    
    return {
        initialize,
        migrate
    };
})();
