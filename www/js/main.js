"use strict";

/*
 * __main.js__
 * Main source file of _Pumped City_
 * Author: Erik Nygren
 *
 * Contains snippets from the openstreetmap wiki contributors
 * Found at: https://wiki.openstreetmap.org/wiki/OpenLayers_Marker_Example
 */


//// Global constants
////////////////////////////////////////////////////////////////
const API_PATH = '/api/v1';
const MAX_RESULTS = 5;
const DEFAULT_ZOOM = 14;
const DEFAULT_LAT = 57.708659;
const DEFAULT_LON = 11.972188;

const geoLoc = navigator.geolocation;



let map, markers;



//// Global function definitions
////////////////////////////////////////////////////////////////


/// Shared
////////////////////

/**
 * Listoperator limiting number of parkings to be listed based uppon distance
 *
 * @param   {Parking[]} parkings An array of parkings to be printed

 * @returns {Parking[]}
 */
const filterMapParkings = parkings=>
    parkings
    // Sort by distance
        .sort(( {Distance: d1}, {Distance: d2} )=>d1-d2)
    // Pick first n results acording to upper bound
        .slice(0,MAX_RESULTS);



/// OpenLayers
////////////////////

const makeCoordinate = (lat, lon) =>
    new OpenLayers.LonLat( lon, lat )
          .transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
          );

const addParkingMarker = parkings=>
    filterMapParkings(parkings)
    // Put markers at the parkings
        .forEach(({Lat:lat, Long:lon})=>
            markers.addMarker(new OpenLayers.Marker( makeCoordinate(lat, lon) ))
          );



/// Geolocation
////////////////////
const getLocation = retries=>
    new Promise((resolve, reject)=>{
        const poll = ()=>geoLoc.getCurrentPosition(resolve, err=>{
            // If user doesn't allow don't ask again.
            if(err.code == err.PERMISSION_DENIED) reject(err);
            // Stop retrying?
            else if(retries-- < 0) reject(err);
            // Retry otherwise
            else setInterval(poll, 1000);
        });

        // Start trying
        poll();
    });



/// API requests
////////////////////
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
    filterMapParkings(parkings)
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


    /// API requests
    ////////////////////


    // Specify some functions with our table

    /** Curried print function @see {@link printParkingsToTable} */
    const printParkings = printParkingsToTable.bind({}, RESULT_TABLE);
    /** Curried clear function @see {@link clearTable} */
    const clearParkings = clearTable.bind({}, RESULT_TABLE);

    /** Given a result clears and updates the result table
      Is @see {@link clearParkings} prepended to @see {@link printParkings} */
    const clearAndPrint = parkings=>{
        clearParkings();
        printParkings(parkings);
        addParkingMarker(parkings);
    };



    // Replace the default form submit with a scripted fetch.
    PARK_QUERY.addEventListener('submit', e=>{
        e.preventDefault();

        //TODO: Is ensuring script and pure HTML are always the same by using
        //      form action a good thing?
        searchParkig(PARK_QUERY.action, PARK_QUERY.latitude.value
                     , PARK_QUERY.longitude.value, PARK_QUERY.radius.value)
            .then(clearAndPrint, showParkReqErr);
    });

    /// OpenLayers
    ////////////////////

    // `map`and `markers` are already defined globally
    map = new OpenLayers.Map("map");
    map.addLayer(new OpenLayers.Layer.OSM());
    markers = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers);

    /// Geolocation
    ////////////////////
    if(geoLoc) {
        getLocation(3)
            .then(({coords:{latitude: lat, longitude: lon}})=>{
                // Set the values and dissable input
                PARK_QUERY.latitude .value = lat;
                PARK_QUERY.longitude.value = lon;

                PARK_QUERY.latitude .disabled = true;
                PARK_QUERY.longitude.disabled = true;

                // We also want to center the map around our coordinates
                map.setCenter(makeCoordinate(lat, lon), DEFAULT_ZOOM);
              })
            // Fallback is default, nothing much to do on error
            .catch(()=>{
                // If we can't get our own coordinates, zoom to default
                map.setCenter(makeCoordinate(DEFAULT_LAT, DEFAULT_LON)
                              , DEFAULT_ZOOM);
            });
    }

});
