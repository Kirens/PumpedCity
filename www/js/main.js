"use strict";

//// Global constants
////////////////////////////////////////////////////////////////
const API_PATH = '/api/v1';
const MAX_RESULTS = 5;



//// Global function definitions
////////////////////////////////////////////////////////////////
/**
 * Prompts the user of an error
 *
 * @param {Error} err An error from therequest
 */
const showParkReqErr = err=>{
    // Temporary solution as this will result in mixed languae
    let msg = err.msg || "Ett okänt fel har uppstått"

    alert(msg);
};

/**
 * Promise to return the result of an API search request for
 * nearby bicycle parkings
 *
 * @async
 * @function searchParkig

 * @param {string} location Where to send the API request
 * @param {string} lat      The latitude to base the search from
 * @param {string} lon      The lonngitude to base the search from
 * @param {string} rad      The size of the search

 * @return {Promise<string>} Parkings within given search
 */
const searchParkig = (location, lat, lon, rad)=>
    new Promise((resolve, reject)=>{
        let xhr = new XMLHttpRequest,
            // Query string based on API
            query = '?latitude='  + lat
                   + '&longitude='+ lon
                   + '&radius='   + rad;

        xhr.addEventListener('readystatechange', ()=>{
            // Await result
            if(xhr.readyState != xhr.DONE) return;

            // Everything turned out well
            if(xhr.status == 200) {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch(err) {
                    //TODO: diffrentiate the two possible errors in this fn
                    reject(err)
                }
            } else {
            // We need to return an error
                //TODO: return errors that are easyer to understand
                reject(xhr);
            }
        });

        // Send request
        xhr.open('GET', location + query);
        xhr.send();
    });

/**
 * Appends select group of the closest results in a given table
 *
 * @param {HTMLTableElement} tbody    A tabel body that the results append to
 * @param {Parking[]}        parkings An array of parkings to be printed
 */
const printParkingsToTable = (tbody, parkings)=>
    parkings
    // Sort by distance
        .sort(( {Distance: d1}, {Distance: d2} )=>d2-d1)
    // Pick first n results acording to upper bound
        .slice(0,MAX_RESULTS)
    // Put each in the table
        .forEach(({Distance:d, Spaces:s, Address:a})=>{
            //TODO: do this in a less hardcoded manner
            let row = document.createElement('tr');

            // The following array decides in what order the elements are
            // placed. In the HTML it is Distance, Spaces, Address at
            // the moment
            [d, s, a]
            // Create a cell in row for teh elements
                .forEach(value=>{
                    let cell = document.createElement('td');
                    cell.textContent = value;
                    row.appendChild(cell);
                  });

            tbody.appendChild(row);
        });

/**
 * Removes all rows of a table body
 *
 * @param {HTMLTableSectionElement} tbody The body to clear
 */
const clearTable = tBody=>{ while(tBody.rows.length) tBody.deleteRow(0) };




//// Execute at page load
////////////////////////////////////////////////////////////////

addEventListener('load', ()=>{

    /** A refrence to the HTML form with request data */
    const PARK_QUERY = document.getElementById('parkings');
    /** A refrence to the HTML form with request data */
    const RESULT_TABLE = document.getElementById('results').tBodies[0];


    // Specify some functions with our table

    /** Curried print function @see {@link printParkingsToTable} */
    const printParkings = printParkingsToTable.bind({}, RESULT_TABLE);
    /** Curried clear function @see {@link clearTable} */
    const clearParkings = clearTable.bind({}, RESULT_TABLE);

    /** Given a result clears and updates the result table
      Is @see {@link clearParkings} prepended to @see {@link printParkings} */
    const clearAndPrint = parkns=>{ clearParkings(); printParkings(parkns) };



    // Replace the default form submit with a scripted fetch.
    PARK_QUERY.addEventListener('submit', e=>{
        e.preventDefault();

        //TODO: Is ensuring script and pure HTML are always the same by using
        //      form action a good thing?
        searchParkig(PARK_QUERY.action, PARK_QUERY.latitude.value
                     , PARK_QUERY.longitude.value, PARK_QUERY.radius.value)
            .then(clearAndPrint, showParkReqErr);
    });



});
