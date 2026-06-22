//Imports: Bring in the tools we need from Node.ja
import fs from 'fs/promises';   //'fs' is File System. Using /promises lets us use async/await so the app doesnt freeze while reading files
import readline from 'readline'; //This lets us read what the user types into the terminal
const DATA_FILE = './bookings.json'; //Where we will save our data permanently
//Styling (ANSI Colour Codes)
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
//Maintain a set of huts
const huts = [
    {id: '1', name: 'Perry Saddle Hut', capacity: 40 },
    {id: '2', name: 'Saxon Hut', capacity: 40 },
    {id: '3', name: 'James Mackay Hut', capacity: 40},
    {id: '4', name: 'Heaphy Hut', capacity: 40}
];
//This array will hold our live bookings while the app is running
let bookings = [];
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
//Load data (handles missing/corrupt files without crashing)
async function loadData() {
    try {
        //Try to read the file 'utf-8' turns the computer bytes into readable text
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        bookings = JSON.parse(data); //Converts the JSON text back into a usable JavaScript array
        console.log(`${GREEN}Data loaded successfully.${RESET}`);
    } catch (error) {
        //If the file doesnt exist yet, or the JSON is broken, we catch the error here so the app dosent crash
        console.log(`${YELLOW}No existing data found or file corrupt. Starting fresh.${RESET}`);
        bookings = []; //Start clean with empty arrayy
    }
}
//Save data to JSON
async function saveData(){
    //JSON.stringify converts our array into text. the 'null, 2' formats it nicely with indents so its readable
    await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2));
}
//Capacity Logic
function isCapacityAvailable(hutId, arrivalDate, nights, partySize) {
    //Calculate all dates for the requested stay
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
    const date = await askQuestion('Enter Arrival Date (YYYY-MM-DD): ');
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
    //Check Capacity
    if (isCapacityAvailable(hutId, date, nights, partySize)) {
        const newBooking = {
            id: Date.now().toString(), //Generates a unique ID
            hutId,
            name,
            arrivalDate: date,
            nights,
            partySize
        };
        bookings.push(newBooking);
        await saveData();
        console.log('Booking succesfully added!');
    } else {
        console.log('Error: Hut does not have enough capacity for these dates.');
    }
}
async function viewBookings() {
    console.log('\n----- View Bookings -----');
    //Check if the array is empty to avoid errors
    if (bookings.length === 0) {
        console.log('No bookings currently in the system.');
        return;
    }
    //Loop through each booking and print it neatly
    bookings.forEach(b => {
        //Find the hut name so we dont just the ID number
        const hut = huts.find(h => h.id === b.hutId);
        const hutName = hut ? hut.name : "Unknown Hut";
        console.log(`- [${hutName}] | Tramper: ${b.name} | Date: ${b.arrivalDate} | Nights: ${b.nights} | Party: ${b.partySize}`);
    });
}
async function cancelBooking() {
    console.log('\n----- Cancel Booking -----');
    if (bookings.length === 0) {
        console.log('No bookings to cancel.');
        return;
    }
    console.log('Select a booking to cancel: ');
    bookings.forEach((b, index) => {
        const hut = huts.find(h => h.id === b.hutId);
        const hutName = hut ? hut.name : "Unknown Hut";
        console.log(`${index + 1}. [${hutName}] | Tramper: ${b.name} | Date: ${b.arrivalDate}`);
    });
    //Ask the user which one they want to remove
    const choice = await askQuestion('Enter number to cancel (or 0 to go back): ');
    const index = parseInt(choice) - 1;
    //Validation
    if (index >= 0 && index < bookings.length) {
        const removed = bookings.splice(index, 1); //Removes 1 item at the index
        await saveData();
        console.log(`Booking for ${removed[0].name} has been cancelled.`);
    } else if (choice === '0') {
        return;
    } else {
        console.log('Invalid selection.');
    }
}
//Main Menu Loop
async function main() {
    await loadData(); //First load saved data before showing menu
    let running = true; //Boolean keeps our while loop spinning
    while (running) {
        //Print the menu to the screen
        console.log('\n----- DOC Hut Booking Manager -----');
        console.log('1. Add a Booking');
        console.log('2. View Bookings');
        console.log('3. Cancel a Booking');
        console.log('4. Exit');
        //Pause and wait for the user to make a choice
        const choice = await askQuestion('Select an option (1-4): ');
        //Selection logic
        if (choice === '1') {
            await addBooking();
        } else if (choice === '2') {
            await viewBookings();
        } else if (choice === '3') {
            await cancelBooking();
        } else if (choice === '4') {
            //Exit sequence
            console.log('Saving and exiting. Goodbye!');
            await saveData();
            running = false; //Breaks the while loop
        } else {
            //Validation
            console.log('Invalid choice. Please enter 1, 2, 3, or 4.');
        }
    }
    //Close the readline interface so its not hanging around
    rl.close();
}
//Start the app
main();