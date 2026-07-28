const BookingView = (() => {
    // Current state of booking flow
    let state = {
        step: 1,
        selectedServices: [], // array of selected service objects
        selectedStylist: null,
        selectedDate: null, // string 'YYYY-MM-DD'
        selectedSlot: null,
        notes: ''
    };

    function getTotalDuration() {
        return state.selectedServices.reduce((sum, s) => sum + (parseInt(s.duration_minutes) || 0), 0);
    }

    function getTotalPrice() {
        return state.selectedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    }

    function getServicesNameString() {
        return state.selectedServices.map(s => s.name).join(', ');
    }

    // Constant today date
    const TODAY = new Date();
    TODAY.setHours(0, 0, 0, 0);

    // Calendar state
    let currentYear = TODAY.getFullYear();
    let currentMonth = TODAY.getMonth();

    function render() {
        const container = App.getContentContainer();
        if (!container) return;

        // Parse query params on initial load of step 1
        if (state.step === 1 && state.selectedServices.length === 0 && !state.selectedStylist) {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const queryStr = hash.split('?')[1];
                const params = new URLSearchParams(queryStr);
                
                const servicesParam = params.get('services') || params.get('service');
                const stylistId = params.get('stylist');
                
                if (servicesParam) {
                    const ids = servicesParam.split(',');
                    const foundSvcs = ids.map(id => Store.getById(Store.KEYS.SERVICES, id)).filter(s => s && s.is_active);
                    if (foundSvcs.length > 0) {
                        state.selectedServices = foundSvcs;
                        state.step = 2; // skip to stylist selection
                    }
                }
                
                if (stylistId) {
                    const stylist = Store.getById(Store.KEYS.STYLISTS, stylistId);
                    if (stylist) {
                        state.selectedStylist = stylist;
                        if (state.selectedServices.length > 0) {
                            state.step = 3; // skip to date selection if both service & stylist selected
                        } else {
                            state.step = 1; // start from service selection but preselect stylist
                        }
                    }
                }
            }
        }

        // Generate progress bar HTML
        const progressBarHtml = `
            <div class="booking-steps">
                <div class="booking-step ${state.step === 1 ? 'active' : ''} ${state.step > 1 ? 'completed' : ''}">
                    <div class="booking-step-number">1</div>
                    <span>Service</span>
                </div>
                <div class="booking-step-connector ${state.step > 1 ? 'completed' : ''}"></div>
                
                <div class="booking-step ${state.step === 2 ? 'active' : ''} ${state.step > 2 ? 'completed' : ''}">
                    <div class="booking-step-number">2</div>
                    <span>Stylist</span>
                </div>
                <div class="booking-step-connector ${state.step > 2 ? 'completed' : ''}"></div>
                
                <div class="booking-step ${state.step === 3 ? 'active' : ''} ${state.step > 3 ? 'completed' : ''}">
                    <div class="booking-step-number">3</div>
                    <span>Date</span>
                </div>
                <div class="booking-step-connector ${state.step > 3 ? 'completed' : ''}"></div>
                
                <div class="booking-step ${state.step === 4 ? 'active' : ''} ${state.step > 4 ? 'completed' : ''}">
                    <div class="booking-step-number">4</div>
                    <span>Time</span>
                </div>
                <div class="booking-step-connector ${state.step > 4 ? 'completed' : ''}"></div>
                
                <div class="booking-step ${state.step === 5 ? 'active' : ''}">
                    <div class="booking-step-number">5</div>
                    <span>Confirm</span>
                </div>
            </div>
        `;

        let stepHtml = '';
        switch (state.step) {
            case 1:
                stepHtml = renderStep1();
                break;
            case 2:
                stepHtml = renderStep2();
                break;
            case 3:
                stepHtml = renderStep3();
                break;
            case 4:
                stepHtml = renderStep4();
                break;
            case 5:
                stepHtml = renderStep5();
                break;
            case 6:
                stepHtml = renderStep6();
                break;
            default:
                stepHtml = '';
        }

        container.innerHTML = `
            <div class="booking-page">
                <div class="page-header text-center">
                    <h1 class="page-title">Book an Appointment</h1>
                    <p class="page-subtitle">Schedule your next style session in a few easy steps</p>
                </div>

                ${state.step <= 5 ? progressBarHtml : ''}
                
                <div class="booking-content" id="booking-flow-container">
                    ${stepHtml}
                </div>
            </div>
        `;

        bindEvents();
    }

    // Step 1: Select Services
    function renderStep1() {
        const services = Store.query(Store.KEYS.SERVICES, s => s.is_active);
        let listHtml = '';
        
        services.forEach(svc => {
            const isSel = state.selectedServices.some(s => s.id === svc.id);
            listHtml += `
                <div class="selection-item ${isSel ? 'selected' : ''}" data-service-id="${svc.id}" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <input type="checkbox" ${isSel ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent-primary); pointer-events: none;">
                        <div>
                            <h3 style="font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-1);">${Utils.escapeHtml(svc.name)}</h3>
                            <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: 0;">${Utils.escapeHtml(svc.description)}</p>
                            <span style="font-size: var(--font-xs); color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;">
                                <span>🕐</span> ${svc.duration_minutes} mins
                            </span>
                        </div>
                    </div>
                    <span class="price" style="font-weight: var(--weight-bold); color: var(--accent-primary); font-size: var(--font-lg);">${Utils.formatPrice(svc.price)}</span>
                </div>
            `;
        });

        const selectedCount = state.selectedServices.length;
        const totalDur = getTotalDuration();
        const totalPrice = getTotalPrice();

        return `
            <div class="flex-between mb-4">
                <div>
                    <h2 style="font-family: var(--font-body); font-size: var(--font-xl); font-weight: var(--weight-bold); margin-bottom: 4px;">Select Services</h2>
                    <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: 0;">Choose one or more treatments for your session</p>
                </div>
                ${selectedCount > 0 ? `
                    <div style="font-size: var(--font-xs); background-color: var(--accent-primary-light); color: var(--accent-primary); border: 1px solid var(--accent-primary); padding: 6px 14px; border-radius: var(--radius-pill); font-weight: var(--weight-bold);">
                        ✨ ${selectedCount} ${selectedCount === 1 ? 'Service' : 'Services'} Selected
                    </div>
                ` : ''}
            </div>
            <div class="selection-list mb-6">
                ${listHtml}
            </div>
            <div class="flex-between mt-6" style="background-color: var(--bg-secondary); padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); border: 1px solid var(--border-light);">
                <div>
                    <span style="font-size: var(--font-sm); color: var(--text-secondary);">Total Summary:</span>
                    <div style="display: flex; gap: 16px; align-items: center; margin-top: 2px;">
                        <span style="font-size: var(--font-sm); font-weight: var(--weight-semibold);">🕐 ${totalDur} mins total</span>
                        <span style="font-size: var(--font-md); font-weight: var(--weight-bold); color: var(--accent-primary);">${Utils.formatPrice(totalPrice)}</span>
                    </div>
                </div>
                <button class="btn btn-primary" id="btn-step1-next" ${selectedCount === 0 ? 'disabled' : ''}>Next Step ➡️</button>
            </div>
        `;
    }

    // Step 2: Select Stylist
    function renderStep2() {
        const stylists = Store.getAll(Store.KEYS.STYLISTS);
        let listHtml = '';
        
        // Anyone option
        const anyoneSel = !state.selectedStylist;
        
        stylists.forEach(sty => {
            const user = Store.getById(Store.KEYS.USERS, sty.user_id);
            if (!user) return;

            const isSel = state.selectedStylist && state.selectedStylist.id === sty.id;
            const initials = user.full_name.split(' ').map(n => n[0]).join('');

            listHtml += `
                <div class="selection-item ${isSel ? 'selected' : ''}" data-stylist-id="${sty.id}">
                    <div style="display: flex; gap: var(--space-3); align-items: center;">
                        <div class="avatar avatar-lg avatar-placeholder">${initials}</div>
                        <div>
                            <h3 style="font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-1);">${Utils.escapeHtml(user.full_name)}</h3>
                            <p style="font-size: var(--font-xs); color: var(--text-secondary); margin-bottom: 0;">
                                ${sty.specialties.slice(0, 3).map(s => Utils.escapeHtml(s)).join(' • ')}
                            </p>
                        </div>
                    </div>
                    <span>✨</span>
                </div>
            `;
        });

        return `
            <h2 class="mb-4" style="font-family: var(--font-body); font-size: var(--font-xl); font-weight: var(--weight-bold);">Choose a Stylist</h2>
            <div class="selection-list">
                <div class="selection-item ${anyoneSel ? 'selected' : ''}" data-stylist-id="anyone">
                    <div style="display: flex; gap: var(--space-3); align-items: center;">
                        <div class="avatar avatar-lg avatar-placeholder" style="background-color: var(--border);">✨</div>
                        <div>
                            <h3 style="font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-1);">Any Available Stylist</h3>
                            <p style="font-size: var(--font-xs); color: var(--text-secondary); margin-bottom: 0;">We'll match you with the first stylist available</p>
                        </div>
                    </div>
                    <span>👋</span>
                </div>
                ${listHtml}
            </div>
            <div class="flex-between mt-6">
                <button class="btn btn-secondary" id="btn-step2-back">⬅️ Back</button>
                <button class="btn btn-primary" id="btn-step2-next">Next Step ➡️</button>
            </div>
        `;
    }

    // Step 3: Select Date (Custom Calendar)
    function renderStep3() {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        return `
            <h2 class="mb-4" style="font-family: var(--font-body); font-size: var(--font-xl); font-weight: var(--weight-bold);">Select Date</h2>
            
            <div class="calendar" style="margin-bottom: var(--space-4);">
                <div class="calendar-header">
                    <h3 class="calendar-title" id="cal-month-year">${monthNames[currentMonth]} ${currentYear}</h3>
                    <div class="calendar-nav">
                        <button id="cal-prev-btn">◀️</button>
                        <button id="cal-next-btn">▶️</button>
                    </div>
                </div>
                <div class="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div class="calendar-days" id="calendar-grid">
                    <!-- Dynamic days -->
                </div>
            </div>

            <div class="flex-between mt-6">
                <button class="btn btn-secondary" id="btn-step3-back">⬅️ Back</button>
                <button class="btn btn-primary" id="btn-step3-next" ${!state.selectedDate ? 'disabled' : ''}>Next Step ➡️</button>
            </div>
        `;
    }

    function renderCalendarGrid() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startDayIndex = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
        
        // Get total days in month
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get total days in previous month
        const prevTotalDays = new Date(currentYear, currentMonth, 0).getDate();

        let daysHtml = '';

        // Previous month days
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayNum = prevTotalDays - i;
            daysHtml += `<div class="calendar-day other-month disabled">${dayNum}</div>`;
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const checkDate = new Date(dateStr + 'T00:00:00');
            
            let isDisabled = false;

            // Rule 1: Cannot book past dates (relative to TODAY = 2026-07-12)
            if (checkDate < TODAY) {
                isDisabled = true;
            }

            // Rule 2: Check stylist availability for this day of week
            if (state.selectedStylist && !isDisabled) {
                const dayName = Utils.getDayName(dateStr);
                const dayAvail = state.selectedStylist.weekly_availability[dayName];
                if (!dayAvail || dayAvail.closed) {
                    isDisabled = true;
                }
            } else if (!state.selectedStylist && !isDisabled) {
                // If "Anyone" selected, verify AT LEAST one stylist is open
                const dayName = Utils.getDayName(dateStr);
                const stylists = Store.getAll(Store.KEYS.STYLISTS);
                const isSomeoneOpen = stylists.some(sty => sty.weekly_availability[dayName] && !sty.weekly_availability[dayName].closed);
                if (!isSomeoneOpen) {
                    isDisabled = true;
                }
            }

            // Highlight selected
            const isSelected = state.selectedDate === dateStr;
            // Highlight today
            const isToday = TODAY.getFullYear() === currentYear && TODAY.getMonth() === currentMonth && TODAY.getDate() === day;

            daysHtml += `
                <div class="calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}">
                    ${day}
                </div>
            `;
        }

        // Next month days to fill grid row
        const totalGridCells = 42; // 6 rows * 7 days
        const currentTotalCells = startDayIndex + totalDays;
        const nextMonthCells = totalGridCells - currentTotalCells;
        
        for (let i = 1; i <= (nextMonthCells % 7); i++) {
            daysHtml += `<div class="calendar-day other-month disabled">${i}</div>`;
        }

        grid.innerHTML = daysHtml;

        // Bind clicks on calendar days
        grid.querySelectorAll('.calendar-day:not(.disabled):not(.other-month)').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const dateVal = e.currentTarget.getAttribute('data-date');
                state.selectedDate = dateVal;
                
                // Re-render grid to update highlight
                renderCalendarGrid();
                
                // Enable next button
                const nextBtn = document.getElementById('btn-step3-next');
                if (nextBtn) nextBtn.disabled = false;
            });
        });
    }

    // Step 4: Select Time Slot
    function renderStep4() {
        // Find slots
        let availableSlots = [];
        
        if (state.selectedStylist) {
            availableSlots = Utils.getAvailableSlots(
                state.selectedStylist.id, 
                state.selectedDate, 
                getTotalDuration()
            );
        } else {
            // "Anyone" selected. Merge slots from all stylists who are open on this date.
            const stylists = Store.getAll(Store.KEYS.STYLISTS);
            const slotMap = new Map(); // time_slot -> array of stylist_ids who are free
            
            stylists.forEach(sty => {
                const slots = Utils.getAvailableSlots(
                    sty.id, 
                    state.selectedDate, 
                    getTotalDuration()
                );
                slots.forEach(slot => {
                    if (!slotMap.has(slot)) {
                        slotMap.set(slot, []);
                    }
                    slotMap.get(slot).push(sty.id);
                });
            });

            // Sort unique slot times
            availableSlots = Array.from(slotMap.keys()).sort();
            // Cache current step choices: we'll match a stylist at confirmation time.
            state.anyoneSlotMap = slotMap;
        }

        let slotsHtml = '';
        if (availableSlots.length === 0) {
            slotsHtml = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🕐</div>
                    <h3 class="empty-state-title">No Available Slots</h3>
                    <p class="empty-state-text">There are no available appointment times for the selected date. Please go back and pick another date.</p>
                </div>
            `;
        } else {
            availableSlots.forEach(slot => {
                const isSel = state.selectedSlot === slot;
                slotsHtml += `
                    <div class="slot ${isSel ? 'selected' : ''}" data-slot="${slot}">
                        ${Utils.formatTime(slot)}
                    </div>
                `;
            });
        }

        const dateFormatted = Utils.formatDate(state.selectedDate);

        return `
            <h2 class="mb-2" style="font-family: var(--font-body); font-size: var(--font-xl); font-weight: var(--weight-bold);">Available Times</h2>
            <p style="font-size: var(--font-md); color: var(--text-secondary); margin-bottom: var(--space-4);">Select a time slot for <strong>${dateFormatted}</strong></p>
            
            <div class="slots-grid">
                ${slotsHtml}
            </div>
            
            <div class="flex-between mt-6">
                <button class="btn btn-secondary" id="btn-step4-back">⬅️ Back</button>
                <button class="btn btn-primary" id="btn-step4-next" ${!state.selectedSlot ? 'disabled' : ''}>Next Step ➡️</button>
            </div>
        `;
    }

    // Step 5: Review & Confirm
    function renderStep5() {
        const user = Auth.getCurrentUser();
        const clientName = user ? user.full_name : '';
        const dateFormatted = Utils.formatDate(state.selectedDate);
        const timeFormatted = Utils.formatTime(state.selectedSlot);

        let stylistName = 'Any Available Stylist';
        if (state.selectedStylist) {
            const userSty = Store.getById(Store.KEYS.USERS, state.selectedStylist.user_id);
            stylistName = userSty ? userSty.full_name : '';
        }

        // Default state values if not set
        if (!state.paymentMethod) state.paymentMethod = 'salon';

        const totalPrice = getTotalPrice();
        const totalDuration = getTotalDuration();
        const servicesList = getServicesNameString();

        const upiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=luminastyles@upi%26pn=Lumina%20Styles%26am=${totalPrice}%26cu=INR`;

        return `
            <h2 class="mb-4" style="font-family: var(--font-body); font-size: var(--font-xl); font-weight: var(--weight-bold);">Review & Confirm Booking</h2>
            
            <div class="booking-summary">
                <div class="booking-summary-row">
                    <span>Services (${state.selectedServices.length}):</span>
                    <span>${Utils.escapeHtml(servicesList)} (${totalDuration} mins)</span>
                </div>
                <div class="booking-summary-row">
                    <span>Stylist:</span>
                    <span>${Utils.escapeHtml(stylistName)}</span>
                </div>
                <div class="booking-summary-row">
                    <span>Date:</span>
                    <span>${dateFormatted}</span>
                </div>
                <div class="booking-summary-row">
                    <span>Time:</span>
                    <span>${timeFormatted}</span>
                </div>
                <div class="booking-summary-row booking-summary-total">
                    <span>Total Amount:</span>
                    <span>${Utils.formatPrice(totalPrice)}</span>
                </div>
            </div>

            <!-- Payment Method Selector -->
            <div style="margin-top: var(--space-6);">
                <h3 style="font-family: var(--font-body); font-size: var(--font-lg); font-weight: var(--weight-bold); margin-bottom: var(--space-3);">Choose Payment Option</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4);">
                    <div class="selection-item ${state.paymentMethod === 'salon' ? 'selected' : ''}" id="pay-salon-card" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; width: 100%; font-weight: var(--weight-bold);">
                            <span>💵 Pay at Salon</span>
                            <input type="radio" name="pay-method" value="salon" ${state.paymentMethod === 'salon' ? 'checked' : ''} style="accent-color: var(--accent-primary);">
                        </div>
                        <span style="font-size: var(--font-xs); color: var(--text-secondary);">Pay after service using cash, card, or UPI.</span>
                    </div>

                    <div class="selection-item ${state.paymentMethod === 'online' ? 'selected' : ''}" id="pay-online-card" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 16px;">
                        <div style="display: flex; justify-content: space-between; width: 100%; font-weight: var(--weight-bold);">
                            <span>💳 Pay Online (UPI)</span>
                            <input type="radio" name="pay-method" value="online" ${state.paymentMethod === 'online' ? 'checked' : ''} style="accent-color: var(--accent-primary);">
                        </div>
                        <span style="font-size: var(--font-xs); color: var(--text-secondary);">Pay securely now by scanning our UPI QR Code.</span>
                    </div>
                </div>
            </div>

            <div class="form-group mt-5">
                <label class="form-label" for="booking-notes">Special Instructions (Optional)</label>
                <textarea class="form-textarea" id="booking-notes" placeholder="Tell us about your hair type or any special styling requests...">${Utils.escapeHtml(state.notes)}</textarea>
            </div>

            <div class="flex-between mt-6">
                <button class="btn btn-secondary" id="btn-step5-back">⬅️ Back</button>
                <button class="btn btn-primary" id="btn-step5-confirm">Confirm Booking ${state.paymentMethod === 'online' ? 'and Pay' : ''} ✅</button>
            </div>

            <!-- Processing Overlay Modal -->
            <div class="modal-overlay" id="payment-processing-overlay" style="display: none; flex-direction: column; gap: var(--space-4); text-align: center; color: var(--white); z-index: 2000;">
                <div style="background-color: var(--white); border-radius: var(--radius-xl); padding: var(--space-6); max-width: 400px; width: 90%; color: var(--text-primary); box-shadow: var(--shadow-xl); display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
                    
                    <!-- View 1: UPI Details and QR (Initial view) -->
                    <div id="payment-qr-view" style="display: flex; flex-direction: column; align-items: center; width: 100%; gap: var(--space-3);">
                        <h3 style="font-family: var(--font-body); font-weight: var(--weight-bold); font-size: var(--font-lg); margin-bottom: 0;">UPI Payment Portal</h3>
                        <p style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: 4px;">Scan the QR code to pay <strong>${Utils.formatPrice(totalPrice)}</strong></p>
                        
                        <img src="${upiUrl}" alt="UPI QR Code" style="border: 4px solid var(--white); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); width: 180px; height: 180px;">
                        
                        <div style="font-size: var(--font-xs); background-color: var(--bg-secondary); padding: 6px 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); font-weight: var(--weight-semibold); margin-bottom: var(--space-1);">
                            UPI ID: <span style="color: var(--accent-primary);">luminastyles@upi</span>
                        </div>
                        
                        <div style="display: flex; gap: 12px; width: 100%; margin-top: var(--space-2);">
                            <button class="btn btn-secondary btn-block" onclick="window.cancelPayment()" style="border-radius: var(--radius-md); padding: 10px; font-size: var(--font-sm); width: 50%;">✕ Cancel</button>
                            <button class="btn btn-primary btn-block" onclick="window.confirmPaymentReceived()" style="border-radius: var(--radius-md); padding: 10px; font-size: var(--font-sm); width: 50%;">I Have Paid ✅</button>
                        </div>
                    </div>

                    <!-- View 2: Spinner (Processing view) -->
                    <div id="payment-loading-view" style="display: none; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-4); width: 100%;">
                        <div id="payment-spinner" style="width: 48px; height: 48px; border: 4px solid var(--border-light); border-top: 4px solid var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <div id="payment-success-icon" style="display: none; font-size: 3.5rem; color: var(--accent-secondary);">✅</div>
                        <h3 id="payment-status-text" style="font-family: var(--font-body); font-weight: var(--weight-bold); font-size: var(--font-lg); margin-bottom: 0;">Processing UPI Payment...</h3>
                        <p id="payment-status-subtext" style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: 0;">Please wait while we verify your transaction.</p>
                    </div>

                </div>
            </div>

            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    // Step 6: Confirmation Screen
    function renderStep6() {
        const dateFormatted = Utils.formatDate(state.selectedDate);
        const timeFormatted = Utils.formatTime(state.selectedSlot);

        let stylistName = 'Any Available Stylist';
        if (state.selectedStylist) {
            const userSty = Store.getById(Store.KEYS.USERS, state.selectedStylist.user_id);
            stylistName = userSty ? userSty.full_name : '';
        }

        const totalPrice = getTotalPrice();
        const priceText = Utils.formatPrice(totalPrice);
        let paymentInfo = '';
        if (state.paymentMethod === 'online') {
            paymentInfo = `
                <div style="background-color: var(--accent-secondary-light); border: 1px solid var(--accent-secondary); color: var(--accent-secondary); font-size: var(--font-sm); padding: 8px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; font-weight: var(--weight-semibold);">
                    <span>📱</span> Paid ${priceText} via UPI QR Code
                </div>
            `;
        } else {
            paymentInfo = `
                <div style="background-color: var(--status-pending-bg); border: 1px solid var(--status-pending); color: var(--status-pending); font-size: var(--font-sm); padding: 8px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; font-weight: var(--weight-semibold);">
                    <span>💵</span> Pay ${priceText} at Salon (After service)
                </div>
            `;
        }

        return `
            <div class="booking-confirmation">
                <div class="booking-confirmation-icon">🎉</div>
                <h2 class="booking-confirmation-title">Booking Confirmed!</h2>
                <p style="font-size: var(--font-md); color: var(--text-secondary); max-width: 500px; margin: 0 auto; line-height: 1.6;">
                    Thank you! Your appointment with <strong>${Utils.escapeHtml(stylistName)}</strong> for <strong>${Utils.escapeHtml(getServicesNameString())}</strong> on <strong>${dateFormatted} at ${timeFormatted}</strong> has been successfully booked.
                </p>
                
                <div style="margin-bottom: var(--space-6);">
                    ${paymentInfo}
                </div>
                
                <div class="hero-actions" style="margin-top: var(--space-6);">
                    <button class="btn btn-primary" onclick="Router.navigate('/my-bookings')">View My Bookings</button>
                    <button class="btn btn-secondary" onclick="BookingView.resetBookingFlow()">Book Another</button>
                </div>
            </div>
        `;
    }

    function bindEvents() {
        // Step 1: Select Service binds (toggle items)
        document.querySelectorAll('.selection-list [data-service-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const svcId = e.currentTarget.getAttribute('data-service-id');
                const svc = Store.getById(Store.KEYS.SERVICES, svcId);
                if (!svc) return;

                const existsIdx = state.selectedServices.findIndex(s => s.id === svcId);
                if (existsIdx >= 0) {
                    state.selectedServices.splice(existsIdx, 1);
                } else {
                    state.selectedServices.push(svc);
                }
                render();
            });
        });

        const next1 = document.getElementById('btn-step1-next');
        if (next1) {
            next1.addEventListener('click', () => {
                state.step = 2;
                render();
            });
        }

        // Step 2: Select Stylist binds
        document.querySelectorAll('.selection-list [data-stylist-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const styId = e.currentTarget.getAttribute('data-stylist-id');
                if (styId === 'anyone') {
                    state.selectedStylist = null;
                } else {
                    state.selectedStylist = Store.getById(Store.KEYS.STYLISTS, styId);
                }
                render();
            });
        });

        const back2 = document.getElementById('btn-step2-back');
        if (back2) {
            back2.addEventListener('click', () => {
                state.step = 1;
                render();
            });
        }
        const next2 = document.getElementById('btn-step2-next');
        if (next2) {
            next2.addEventListener('click', () => {
                state.step = 3;
                render();
            });
        }

        // Step 3: Calendar navigation binds
        const prevCal = document.getElementById('cal-prev-btn');
        if (prevCal) {
            prevCal.addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendarGrid();
                document.getElementById('cal-month-year').textContent = `${getMonthName(currentMonth)} ${currentYear}`;
            });
        }
        const nextCal = document.getElementById('cal-next-btn');
        if (nextCal) {
            nextCal.addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendarGrid();
                document.getElementById('cal-month-year').textContent = `${getMonthName(currentMonth)} ${currentYear}`;
            });
        }

        if (state.step === 3) {
            renderCalendarGrid();
        }

        const back3 = document.getElementById('btn-step3-back');
        if (back3) {
            back3.addEventListener('click', () => {
                state.step = 2;
                render();
            });
        }
        const next3 = document.getElementById('btn-step3-next');
        if (next3) {
            next3.addEventListener('click', () => {
                state.step = 4;
                render();
            });
        }

        // Step 4: Time slot binds
        document.querySelectorAll('.slots-grid .slot:not(.booked)').forEach(slot => {
            slot.addEventListener('click', (e) => {
                state.selectedSlot = e.currentTarget.getAttribute('data-slot');
                document.querySelectorAll('.slots-grid .slot').forEach(s => s.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                const nextBtn = document.getElementById('btn-step4-next');
                if (nextBtn) nextBtn.disabled = false;
            });
        });

        const back4 = document.getElementById('btn-step4-back');
        if (back4) {
            back4.addEventListener('click', () => {
                state.step = 3;
                render();
            });
        }
        const next4 = document.getElementById('btn-step4-next');
        if (next4) {
            next4.addEventListener('click', () => {
                state.step = 5;
                render();
            });
        }

        // Step 5: Review binds & payment selectors
        const paySalonCard = document.getElementById('pay-salon-card');
        if (paySalonCard) {
            paySalonCard.addEventListener('click', () => {
                state.paymentMethod = 'salon';
                render();
            });
        }

        const payOnlineCard = document.getElementById('pay-online-card');
        if (payOnlineCard) {
            payOnlineCard.addEventListener('click', () => {
                state.paymentMethod = 'online';
                render();
            });
        }

        const back5 = document.getElementById('btn-step5-back');
        if (back5) {
            back5.addEventListener('click', () => {
                state.step = 4;
                render();
            });
        }
        
        const confirm5 = document.getElementById('btn-step5-confirm');
        if (confirm5) {
            confirm5.addEventListener('click', () => {
                const notesArea = document.getElementById('booking-notes');
                if (notesArea) {
                    state.notes = notesArea.value;
                }

                // If online payment selected, open payment overlay modal
                if (state.paymentMethod === 'online') {
                    const overlay = document.getElementById('payment-processing-overlay');
                    const qrView = document.getElementById('payment-qr-view');
                    const loadingView = document.getElementById('payment-loading-view');
                    const spinner = document.getElementById('payment-spinner');
                    const checkmark = document.getElementById('payment-success-icon');
                    const text = document.getElementById('payment-status-text');
                    const subtext = document.getElementById('payment-status-subtext');

                    if (qrView) qrView.style.display = 'flex';
                    if (loadingView) loadingView.style.display = 'none';
                    if (spinner) spinner.style.display = 'block';
                    if (checkmark) checkmark.style.display = 'none';
                    if (text) text.textContent = 'Processing UPI Payment...';
                    if (subtext) subtext.textContent = 'Please wait while we verify your transaction.';

                    if (overlay) overlay.style.display = 'flex';

                } else {
                    // Pay at salon completes instantly
                    submitBooking(false);
                }
            });
        }

        // Expose handlers on window so they can be called from inline onclick handlers in Step 5 modal
        window.cancelPayment = () => {
            const overlay = document.getElementById('payment-processing-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        window.confirmPaymentReceived = () => {
            const qrView = document.getElementById('payment-qr-view');
            const loadingView = document.getElementById('payment-loading-view');
            
            if (qrView) qrView.style.display = 'none';
            if (loadingView) loadingView.style.display = 'flex';

            setTimeout(() => {
                // Success transition
                const spinner = document.getElementById('payment-spinner');
                const checkmark = document.getElementById('payment-success-icon');
                const text = document.getElementById('payment-status-text');
                const subtext = document.getElementById('payment-status-subtext');

                if (spinner) spinner.style.display = 'none';
                if (checkmark) checkmark.style.display = 'block';
                if (text) text.textContent = 'UPI Payment Received!';
                if (subtext) subtext.textContent = 'Transaction verified. Creating booking...';

                setTimeout(() => {
                    const overlay = document.getElementById('payment-processing-overlay');
                    if (overlay) overlay.style.display = 'none';
                    submitBooking(true);
                }, 1500);

            }, 2500);
        };
    }

    function submitBooking(isPaid = false) {
        const client = Auth.getCurrentUser();
        if (!client) return;

        let stylistId = '';
        
        if (state.selectedStylist) {
            stylistId = state.selectedStylist.id;
        } else {
            // "Anyone" selected: choose first available stylist who is free in slotMap
            const stylistsFree = state.anyoneSlotMap.get(state.selectedSlot) || [];
            if (stylistsFree.length > 0) {
                stylistId = stylistsFree[0]; // just pick the first one
            } else {
                App.showToast('Error booking appointment. Time slot no longer available.', 'error');
                state.step = 4; // send back
                render();
                return;
            }
        }

        // Create appointment with payment details
        const app = Store.create(Store.KEYS.APPOINTMENTS, {
            client_id: client.id,
            stylist_id: stylistId,
            service_id: state.selectedServices.map(s => s.id).join(','),
            service_ids: state.selectedServices.map(s => s.id),
            total_price: getTotalPrice(),
            total_duration: getTotalDuration(),
            date: state.selectedDate,
            time_slot: state.selectedSlot,
            status: 'pending',
            notes: state.notes,
            payment_method: state.paymentMethod,
            payment_status: isPaid ? 'paid' : 'unpaid',
            payment_type: state.paymentMethod === 'online' ? 'upi' : 'salon'
        });

        // Trigger notification to stylist/admin about new pending booking
        const stylist = Store.getById(Store.KEYS.STYLISTS, stylistId);
        if (stylist) {
            const serviceName = getServicesNameString();
            const dateFormatted = Utils.formatDate(state.selectedDate);
            const timeFormatted = Utils.formatTime(state.selectedSlot);
            Notifications.create(
                stylist.user_id, 
                `New appointment booking request by ${client.full_name} for ${serviceName} on ${dateFormatted} at ${timeFormatted}.`, 
                app.id
            );
        }

        // Send real-time WhatsApp booking confirmation if client phone is set
        if (client.phone) {
            sendTwilioWhatsApp(client.phone, state.selectedDate, state.selectedSlot);
        } else {
            App.showToast('WhatsApp skipped: Client has no phone number on their profile.', 'info');
        }

        App.showToast('Appointment booked successfully! Pending confirmation.', 'success');
        
        // Go to confirmation step
        state.step = 6;
        render();
    }

    function sendTwilioWhatsApp(toPhone, dateVal, timeVal) {
        const accountSid = localStorage.getItem('twilio_account_sid') || 'AC3f334c365db2ffff2ee9609665823822';
        const authToken = localStorage.getItem('twilio_auth_token');
        
        if (!authToken) {
            console.log('⚠️ Twilio Auth Token is not set. Skipping real WhatsApp API call.');
            App.showToast('WhatsApp skipped: Twilio Auth Token not configured in Admin Dashboard.', 'info');
            return;
        }

        App.showToast(`Sending WhatsApp message to ${toPhone}...`, 'info');

        // Format Date: YYYY-MM-DD -> "July 18, 2026"
        let formattedDate = dateVal;
        if (dateVal.includes('-')) {
            const d = new Date(dateVal + 'T00:00:00');
            const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            formattedDate = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        }

        // Format Time: HH:MM -> "3:00 PM"
        let formattedTime = timeVal;
        if (timeVal.includes(':')) {
            const parts = timeVal.split(':');
            let hours = parseInt(parts[0]);
            const mins = parts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            formattedTime = `${hours}:${mins} ${ampm}`;
        }

        const contentVariables = JSON.stringify({
            "1": formattedDate,
            "2": formattedTime
        });

        let cleanedPhone = toPhone.replace(/[\s-]/g, '');
        if (cleanedPhone.length === 10 && /^\d+$/.test(cleanedPhone)) {
            cleanedPhone = '+91' + cleanedPhone;
        } else if (!cleanedPhone.startsWith('+')) {
            cleanedPhone = '+' + cleanedPhone;
        }

        fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountSid: accountSid,
                authToken: authToken,
                to: 'whatsapp:' + cleanedPhone,
                from: 'whatsapp:+14155238886',
                contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
                contentVariables: contentVariables
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            console.log('✉️ Twilio WhatsApp message queued:', data.sid);
            App.showToast('✅ WhatsApp booking confirmation sent to ' + cleanedPhone + '!', 'success');
        })
        .catch(error => {
            console.error('❌ Twilio WhatsApp error:', error);
            const msg = error.message || error.error || (typeof error === 'object' ? JSON.stringify(error) : error);
            App.showToast(`WhatsApp Failed: ${msg}`, 'error');
        });
    }

    function resetBookingFlow() {
        state = {
            step: 1,
            selectedServices: [],
            selectedStylist: null,
            selectedDate: null,
            selectedSlot: null,
            notes: ''
        };
        // Reset calendar month/year to today
        currentYear = TODAY.getFullYear();
        currentMonth = TODAY.getMonth();
        
        Router.navigate('/booking');
        render();
    }

    function getMonthName(monthIdx) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return monthNames[monthIdx];
    }

    return {
        render,
        resetBookingFlow
    };
})();
