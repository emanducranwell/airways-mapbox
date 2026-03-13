let startLngLat = null;
let endLngLat = null;

let clickStage = 0;
let startMarker = null;
let endMarker = null;
const info = document.getElementById('info');

let map;
let cols;
let rows;

//API TOKEN
// mapboxgl.accessToken = 'pk.eyJ1IjoiZW1hbmR1IiwiYSI6ImNtbW5qM2Z3MjAzcnoycHF4dTBuOG8wc2wifQ.mBPcJ0360AIFTC45szdlcw';

//creating the mappp
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-0.1345, 51.544],
    zoom: 10
});

// the directions
const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/walking'
});

// directional app control
map.addControl(directions, 'top-left');


// On click set the points. One click = point A, 2nd click = point B, final click resets so you can click again lol.
map.on('click', (e) => {

    const lngLat = [e.lngLat.lng, e.lngLat.lat];

    if (clickStage === 0) {
        
        startLngLat = lngLat;

        directions.setOrigin(lngLat);

        if (startMarker) startMarker.remove();

        startMarker = new mapboxgl.Marker({color:'green'})
            .setLngLat(lngLat)
            .addTo(map);

        clickStage = 1;
        info.textContent = "Click map to set B";

    } else if (clickStage === 1) {

        endLngLat = lngLat;
    
        directions.setDestination(lngLat);
    
        if (endMarker) endMarker.remove();
    
        endMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat(lngLat)
            .addTo(map);
    
        const grid = GridFromMap(map, 40, 40);
        assignFakeParks(grid);
    
        const startSpot = findClosestSpot(grid, startLngLat);
        const endSpot = findClosestSpot(grid, endLngLat);
    
        const path = runAStar(grid, startSpot, endSpot);
        drawPathOnMap(path);
    
        clickStage = 2;
        info.textContent = "Route set. Click again to reset.";

    } else {

        directions.removeRoutes();

        if (startMarker) startMarker.remove();
        if (endMarker) endMarker.remove();

        startMarker = new mapboxgl.Marker({color:'green'})
            .setLngLat(lngLat)
            .addTo(map);

        directions.setOrigin(lngLat);

        endMarker = null;

        clickStage = 1;
        info.textContent = "Click map to set B";
    }

});


function GridFromMap(map, cols, rows) {
    // instructions go here
}
