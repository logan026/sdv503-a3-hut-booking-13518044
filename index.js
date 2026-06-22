//Imports: Bring in the tools we need from Node.js
import readline from 'readline'; //This lets us read what the user types into the terminal
import {huts, getBookings, setBookings, loadData, saveData} from './storage.js';
import {isCapacityAvailable, getRemainingCapacity} from './engine.js';
//Styling (ANSI Colour Codes)
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';


//Setup command line input
const rl = readline.createInterface({
    input: process.stdin, //What the user types
    output: process.stdout //What the screen shows
});
//Helper function to make asking questions easier
const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));
//Helper function to pause the program
async function pause() {
    await askQuestion(`\n${YELLOW}Press Enter to return to the Main Menu...${RESET}`);
}
//Core app functions
async function addBooking(){
    console.clear(); //Clears console to give a clean CLI experience
    console.log(`\n${CYAN}----- Add Booking -----${RESET}`);
    // Show available huts
    huts.forEach(h => console.log(`${h.id}. ${h.name} (Capacity: ${h.capacity})`));
    //Input loops (ensures valid input before moving on
    let hutId;
    while(true) {
        hutId = await askQuestion('\nSelect Hut ID (1-4): ');
        if (huts.find(h => h.id === hutId)) break; //Break loop if valid ID
        console.log(`${RED}Error: Invalid Hut ID. Try again.${RESET}`);
    }
    let name;
    while(true) {
        name = await askQuestion('Enter Tramper Name: ');
        if (name.trim()) break; // Break loop if not empty
        console.log(`${RED}Error: Name cannot be empty.${RESET}`);
    }
    let date;
    while(true) {
        date = await askQuestion('Enter Arrival Date (YYYY-MM-DD): ');
        //Check format using Regex
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            console.log(`${RED}Error: Date must be exactly in YYYY-MM-DD format.${RESET}`);
            continue;
        }
        //Check if its a real date and not in the past
        const inputDate = new Date(date);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayUTC = new Date(todayStr);
        if (isNaN(inputDate.getTime())){
            console.log(`${RED}Error: That calendar date does not exist.${RESET}`);
            continue;
        }
        if (inputDate < todayUTC) {
            console.log(`${RED}Error: You cannot book a date in the past.${RESET}`);
            continue;
        }
        break; //If it passes all check break the loop
    }
    let nights;
    while(true) {
        const nightsInput = await askQuestion('Enter Duration (Nights): ');
        nights = Number(nightsInput);
        if (isNaN(nights) || !Number.isInteger(nights)|| nights <= 0) {
            console.log(`${RED}Error: Please enter a whole number greater than zero.${RESET}`);
        } else break;
    }
    let partySize;
    while(true) {
        const partyInput = await askQuestion('Enter Party Size: ');
        partySize = Number(partyInput);
        if (isNaN(partySize) || !Number.isInteger(partySize) || partySize <= 0) {
            console.log(`${RED}Error: Please enter a whole number greater than zero.${RESET}`);
        } else break;
    }
    //Confirmation Prompt
    console.clear();
    console.log(`\n${CYAN}----- Confirm Booking -----${RESET}`);
    const selectedHut = huts.find(h => h.id === hutId);
    console.log(`Hut: ${selectedHut.name}`);
    console.log(`Tramper: ${name}`);
    console.log(`Arrival: ${date} for ${nights} nights`);
    console.log(`Party Size: ${partySize} people`);
    const confirm = await askQuestion('\nSave this booking? (y/n): ');
    if (confirm.toLowerCase().trim() === 'y') {
        //Run capacity check before saving
        if (isCapacityAvailable(hutId, date, nights, partySize)) {
            const newBooking = {
                id: Date.now().toString(), //Generates unique ID
                hutId,
                name: name.trim(),
                arrivalDate: date,
                nights,
                partySize
            };
            const currentBookings = getBookings();
            currentBookings.push(newBooking);
            setBookings(currentBookings);
            await saveData();
            console.log(`${GREEN}Booking successfully added!${RESET}`);
        } else {
            console.log(`${RED}Error: Hut does not have enough capacity for these dates.${RESET}`);
        }
    } else {
        console.log(`${YELLOW}Booking Cancelled.${RESET}`);
    }
    await pause();
}
//View bookings menu
async function viewBookings() {
    console.clear();
    console.log(`\n${CYAN}----- Recorded Bookings -----${RESET}`);
    huts.forEach(h => console.log(`${h.id}. ${h.name}`));
    let hutId;
    while(true){
        hutId = await askQuestion('\nSelect Hut ID (1-4): ');
        if (huts.find(h => h.id === hutId)) break;
        console.log(`${RED}Error: Invalid Hut ID.${RESET}`);
    }
    let date;
    while(true){
        date = await askQuestion('Enter Date to inspect (YYYY-MM-DD): ');
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)){
            console.log(`${RED}Error: Date must be in YYYY-MM-DD format.${RESET}`);
            continue;
        }
        if (isNaN(new Date(date).getTime())){
            console.log(`${RED}Error: Invalid date.${RESET}`);
            continue;
        }
        break;
    }
    console.clear();
    const hut = huts.find(h => h.id === hutId);
    console.log(`\n${CYAN}----- Bookings for ${hut.name} on ${date} -----${RESET}`);
    const checkDate = new Date(date);
    let found = false;
    getBookings().forEach(b => {
        if (b.hutId === hutId) {
            const bStart = new Date(b.arrivalDate);
            const bEnd = new Date(b.arrivalDate);
            bEnd.setDate(bStart.getDate() + parseInt(b.nights) - 1);
            if (checkDate >= bStart && checkDate <= bEnd) {
                console.log(`- Tramper: ${b.name} | Stay Duration: ${b.nights} nights | Party Size: ${b.partySize}`);
                found = true;
            }
        }
    });
    if (!found) {
        console.log('No active bookings occupy this hut on this date.');
    }
    const remCapacity = getRemainingCapacity(hutId, date);
    console.log(`\n${YELLOW}Remaining Bunk Capacity for this night: ${remCapacity} / ${hut.capacity}${RESET}`);
    await pause();
}
//Cancel Booking Menu
async function cancelBooking() {
    console.clear();
    let bookings = getBookings();
    console.log(`\n${CYAN}----- Cancel Booking -----${RESET}`);
    if (bookings.length === 0) {
        console.log('No bookings to cancel.');
        await pause();
        return;
    }
    console.log('Select a booking to cancel:\n');
    bookings.forEach((b, index) => {
        const hut = huts.find(h => h.id === b.hutId);
        const hutName = hut ? hut.name : "Unknown Hut";
        console.log(`${YELLOW}${index + 1}${RESET}. [${hutName}] | Tramper: ${b.name} | Date: ${b.arrivalDate}`);
    });
    //Ask the user which one they want to remove
    const choice = await askQuestion('\nEnter number to cancel (or 0 to go back): ');
    const index = parseInt(choice) - 1;
    //Validation
    if (index >= 0 && index < bookings.length) {
        const confirm = await askQuestion(`${RED}Are you sure you want to delete this booking? (y/n): ${RESET}`);
        if (confirm.toLowerCase().trim() === 'y'){
            const removed = bookings.splice(index, 1); //Removes 1 item at the index
            setBookings(bookings);
            await saveData();
            console.log(`${GREEN}Booking for ${removed[0].name} has been cancelled.${RESET}`);
        } else {
            console.log(`${YELLOW}Cancellation aborted.${RESET}`);
        }
    } else if (choice !== '0') {
        console.log(`${RED}Invalid selection.${RESET}`);
    }
    await pause();
}
async function showOccupancySummary(){
    console.clear();
    console.log(`\n${CYAN}----- DOC Occupancy Summary -----${RESET}`);
    const bookings = getBookings();
    huts.forEach(hut => {
        const hutBookings = bookings.filter(b => b.hutId === hut.id);
        const totalTrampers = hutBookings.reduce((sum, b) => sum + b.partySize, 0);
        console.log(`\n${GREEN}${hut.name}${RESET}:`);
        console.log(` - Total Saved Bookings: ${hutBookings.length}`);
        console.log(` - Total Trampers Processed: ${totalTrampers}`);
    });
    await pause();
}
//Main Menu Loop
async function main() {
    await loadData(); //First load saved data before showing menu
    let running = true; //Boolean keeps our while loop spinning
    while (running) {
        console.clear();
        //Print the menu to the screen
        console.log(`\n${CYAN}----- DOC Hut Booking Manager -----${RESET}`);
        console.log('1. Add a Booking');
        console.log('2. View Bookings');
        console.log('3. Cancel a Booking');
        console.log('4. View Occupancy Summary');
        console.log('5. Exit');
        //Pause and wait for the user to make a choice
        const choice = await askQuestion('\nSelect an option (1-5): ');
        //Selection logic
        if (choice === '1') {
            await addBooking();
        } else if (choice === '2') {
            await viewBookings();
        } else if (choice === '3') {
            await cancelBooking();
        } else if (choice === '4') {
            await showOccupancySummary();
        } else if (choice === '5') {
            //Exit sequence
            console.log(`\n${YELLOW}Saving data and exiting. Goodbye!${RESET}`);
            await saveData();
            running = false; //Breaks the while loop
            break;
        } else {
            //Validation
            console.log(`${RED}Invalid choice. Please enter 1, 2, 3, 4, or 5.${RESET}`);
            await pause();
        }
    }
    //Close the readline interface so its not hanging around
    rl.close();
}
//Start the app
main();