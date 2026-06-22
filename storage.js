import fs from 'fs/promises';   //'fs' is File System. Using /promises lets us use async/await so the app doesnt freeze while reading files
const DATA_FILE = './bookings.json'; //Where we will save our data permanently
//Styling (ANSI Colour Codes)
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
//Maintain a set of huts
export const huts = [
    {id: '1', name: 'Perry Saddle Hut', capacity: 40 },
    {id: '2', name: 'Saxon Hut', capacity: 40 },
    {id: '3', name: 'James Mackay Hut', capacity: 40},
    {id: '4', name: 'Heaphy Hut', capacity: 40}
];
//This array will hold our live bookings while the app is running
let bookings = [];
export function getBookings(){
    return bookings;
}
export function setBookings(newBookings){
    bookings = newBookings;
}
//Load data (handles missing/corrupt files without crashing)
export async function loadData() {
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
export async function saveData(){
    //JSON.stringify converts our array into text. the 'null, 2' formats it nicely with indents so its readable
    await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2));
}