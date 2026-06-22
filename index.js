//Imports: Bring in the tools we need from Node.ja
import fs from 'fs/promises';   //'fs' is File System. Using /promises lets us use async/await so the app doesnt freeze while reading files
import readline from 'readline'; //This lets us read what the user types into the terminal
const DATA_FILE = './bookings.json'; //Where we will save our data permanently
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
//Load data (handles missing/corrupt files without crashing)
async function loadData() {
    try {
        //Try to read the file 'utf-8' turns the computer bytes into readable text
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        bookings = JSON.parse(data); //Converts the JSON text back into a usable JavaScript array
        console.log('Data loaded successfully.');
    } catch (error) {
        //If the file doesnt exist yet, or the JSON is broken, we catch the error here so the app dosent crash
        console.log('No existing data found or file corrupt. Starting fresh.');
        bookings = []; //Start clean with empty arrayy
    }
}
//Save data to JSON
async function saveData(){
    //JSON.stringify converts our array into text. the 'null, 2' formats it nicely with indents so its readable
    await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2));
}
//Core APP functions (Placeholder functions for now)
async function addBooking(){
    console.log('\n----- Add Booking -----');
    console.log('(Booking logic coming next)');
}
async function viewBookings() {
    console.log('\n----- View Bookings -----');
    console.log('(View logic coming next)');
}
async function cancelBooking() {
    console.log('\n----- Cancel Booking -----');
    console.log('(Cancel logic coming next');
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