import {huts, getBookings} from './storage.js';
//Capacity Logic
export function isCapacityAvailable(hutId, arrivalDate, nights, partySize) {
    //Calculate all dates for the requested stay
    const bookings = getBookings();
    const requestedDates = [];
    const start = new Date(arrivalDate);
    //Calculate all dates for the requested stay
    for (let i = 0; i < nights; i++) {
        const d = new Date(start);
            d.setDate(start.getDate() + i);
            requestedDates.push(d.toISOString().split('T')[0]); //Format YYYY-MM-DD
    }
    //Check each night against existing bookings
    for (const date of requestedDates) {
        let currentOccupancy = 0;
        //Sum up all parties currently booked for this specific hut on this date
        for (const b of bookings) {
            if (b.hutId === hutId) {
                //Check if existing booking overlaps with this specific date
                const bStart = new Date(b.arrivalDate);
                const bEnd = new Date(b.arrivalDate);
                bEnd.setDate(bStart.getDate() + parseInt(b.nights) - 1);
                const checkDate = new Date(date);
                if (checkDate >= bStart && checkDate <= bEnd) {
                    currentOccupancy += parseInt(b.partySize);
                }
            }
        }
        //Find the hut capacity and check if this night goes over the limit
        const hut = huts.find(h => h.id === hutId);
        if (currentOccupancy + parseInt(partySize) > hut.capacity) {
            return false; //Found a night where hut is full
        }
    }
    return true; //All nights are safe
}
//Compute remaining capacity for a specific hut and date
export function getRemainingCapacity(hutId, dateStr){
    const bookings = getBookings();
    const hut = huts.find(h => h.id === hutId);
    if (!hut) return 0;
    let currentOccupancy = 0;
    const checkDate = new Date(dateStr);
    for (const b of bookings){
        if (b.hutId === hutId){
            const bStart = new Date(b.arrivalDate);
            const bEnd = new Date(b.arrivalDate);
            bEnd.setDate(bStart.getDate() + parseInt(b.nights) - 1);
            if (checkDate >= bStart && checkDate <= bEnd) {
                currentOccupancy += parseInt(b.partySize);
            }
        }
    }
    return hut.capacity - currentOccupancy;
}