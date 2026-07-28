const Utils = (() => {
    function generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    function generateTimeSlots(openTime, closeTime, durationMinutes) {
        const slots = [];
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);
        
        let current = new Date();
        current.setHours(openHour, openMin, 0, 0);
        
        const end = new Date();
        end.setHours(closeHour, closeMin, 0, 0);
        
        while (current < end) {
            const hours = String(current.getHours()).padStart(2, '0');
            const mins = String(current.getMinutes()).padStart(2, '0');
            slots.push(`${hours}:${mins}`);
            current.setMinutes(current.getMinutes() + durationMinutes);
        }
        
        return slots;
    }

    function getServicesForAppointment(booking) {
        if (!booking) return [];
        if (booking.service_ids && Array.isArray(booking.service_ids) && booking.service_ids.length > 0) {
            return booking.service_ids.map(id => Store.getById(Store.KEYS.SERVICES, id)).filter(Boolean);
        }
        if (booking.service_id) {
            const ids = String(booking.service_id).split(',');
            return ids.map(id => Store.getById(Store.KEYS.SERVICES, id)).filter(Boolean);
        }
        return [];
    }

    function getAppointmentServiceName(booking) {
        const svcs = getServicesForAppointment(booking);
        if (svcs.length > 0) {
            return svcs.map(s => s.name).join(', ');
        }
        return 'Salon Service';
    }

    function getAppointmentPrice(booking) {
        if (booking && typeof booking.total_price === 'number') {
            return booking.total_price;
        }
        const svcs = getServicesForAppointment(booking);
        if (svcs.length > 0) {
            return svcs.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
        }
        return 0;
    }

    function getAppointmentDuration(booking) {
        if (booking && typeof booking.total_duration === 'number') {
            return booking.total_duration;
        }
        const svcs = getServicesForAppointment(booking);
        if (svcs.length > 0) {
            return svcs.reduce((sum, s) => sum + (parseInt(s.duration_minutes) || 0), 0);
        }
        return 30;
    }

    function getAvailableSlots(stylistId, dateStr, durationMinutes) {
        // ALWAYS use uniform slots from 09:00 to 21:00 in 1-hour intervals (excluding lunch hour 13:00)
        const allSlots = generateTimeSlots('09:00', '21:00', 60).filter(slot => slot !== '13:00');

        // Fetch bookings for this stylist on this date
        const bookings = Store.query(Store.KEYS.APPOINTMENTS, app => {
            return app.stylist_id === stylistId && app.date === dateStr && app.status !== 'cancelled';
        });

        const blockedTimes = new Set();

        bookings.forEach(booking => {
            const bookingDuration = getAppointmentDuration(booking);
            
            const [bHour, bMin] = booking.time_slot.split(':').map(Number);
            const bStart = new Date();
            bStart.setHours(bHour, bMin, 0, 0);
            
            const bEnd = new Date(bStart.getTime() + bookingDuration * 60 * 1000);
            
            // Loop through generated slots and block them if they intersect
            allSlots.forEach(slot => {
                const [sHour, sMin] = slot.split(':').map(Number);
                const sStart = new Date();
                sStart.setHours(sHour, sMin, 0, 0);
                const sEnd = new Date(sStart.getTime() + 60 * 60 * 1000); // slot length is 60 mins
                
                if (sStart < bEnd && sEnd > bStart) {
                    blockedTimes.add(slot);
                }
            });
        });

        return allSlots.filter(slot => !blockedTimes.has(slot));
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const [hourStr, minStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12; // the hour '0' should be '12'
        return `${hour}:${minStr} ${ampm}`;
    }

    function formatPrice(num) {
        return '₹' + parseFloat(num).toFixed(2);
    }

    function getDayName(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }

    function getStatusClass(status) {
        switch (status) {
            case 'pending': return 'badge-pending';
            case 'confirmed': return 'badge-confirmed';
            case 'cancelled': return 'badge-cancelled';
            case 'completed': return 'badge-completed';
            default: return '';
        }
    }

    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
                default: return m;
            }
        });
    }

    return {
        generateId,
        generateTimeSlots,
        getAvailableSlots,
        getServicesForAppointment,
        getAppointmentServiceName,
        getAppointmentPrice,
        getAppointmentDuration,
        formatDate,
        formatTime,
        formatPrice,
        getDayName,
        getStatusClass,
        debounce,
        escapeHtml
    };
})();
