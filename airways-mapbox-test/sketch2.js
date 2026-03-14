//global map variables
let startLngLat = null;
let endLngLat = null;

let clickStage = 0;
let startMarker = null;
let endMarker = null;
const info = document.getElementById('info');

// const bounds = map.getBounds();

// const west = bounds.getWest();
// const east = bounds.getEast();
// const south = bounds.getSouth();
// const north = bounds.getNorth();

// const lngStep = (east - west) / cols;
// const latStep = (north - south) / rows;

//global a* variables
var cols = 200;
var rows = 200;
var grid = new Array(cols);

var openSet = [];
var closedSet = [];
var start;
var end;
var path = [];
var noSolution = false;

var w,h;
// var col;
// var col1; //colour


//API TOKEN
mapboxgl.accessToken = 'pk.eyJ1IjoiZW1hbmR1IiwiYSI6ImNtbW5qM2Z3MjAzcnoycHF4dTBuOG8wc2wifQ.mBPcJ0360AIFTC45szdlcw';

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
    
        const grid = GridFromMap(map, cols, rows); // Use dynamic cols and rows values
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

    return true; // Ensure the listener indicates a response
});


function GridFromMap(map, cols, rows) {
    console.log('A*');

    const bounds = map.getBounds();

    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();

    const lngStep = (east - west) / cols;
    const latStep = (north - south) / rows;

    const grid = new Array(cols);

    for (let i = 0; i < cols; i++) {
        grid[i] = new Array(rows);

        for (let j = 0; j < rows; j++) {
            const lng = west + i * lngStep + lngStep / 2;
            const lat = south + j * latStep + latStep / 2;

            grid[i][j] = new Spot(i, j, lng, lat);

            // Add a circle to visualize the grid spot
            const el = document.createElement('div');
            el.style.width = '5px';
            el.style.height = '5px';
            el.style.backgroundColor = 'rgba(0, 0, 255, 0.5)';
            el.style.borderRadius = '50%';

            new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(map);
        }
    }

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j].addNeighbours(grid);
        }
    }

    return grid;
}

function drawPathOnMap(path) {
    const routeGeoJSON = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: path.map(spot => [spot.lng, spot.lat])
        }
    };

    if (map.getSource('astar-route')) {
        map.getSource('astar-route').setData(routeGeoJSON);
    } else {
        map.addSource('astar-route', {
            type: 'geojson',
            data: routeGeoJSON
        });

        map.addLayer({
            id: 'astar-route',
            type: 'line',
            source: 'astar-route',
            paint: {
                'line-color': '#0066ff',
                'line-width': 4
            }
        });
    }
}   

function runAStar(grid, startSpot, endSpot) {
    openSet = [];
    closedSet = [];
    path = [];
    noSolution = false;

    openSet.push(startSpot);

    while (openSet.length > 0) {
        let winner = 0;
        for (let i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[winner].f) {
                winner = i;
            }
        }

        let current = openSet[winner];

        if (current === endSpot) {
            let finalPath = [];
            let temp = current;
            finalPath.push(temp);

            while (temp.previous) {
                finalPath.push(temp.previous);
                temp = temp.previous;
            }

            return finalPath.reverse();
        }

        removeFromArray(openSet, current);
        closedSet.push(current);

        let neighbours = current.neighbours;
        for (let i = 0; i < neighbours.length; i++) {
            let neighbour = neighbours[i];

            if (!closedSet.includes(neighbour) && !neighbour.wall) {
                let moveCost = 1;
                if (neighbour.park) moveCost = 0.5;

                let tempG = current.g + moveCost;
                let newPath = false;

                if (openSet.includes(neighbour)) {
                    if (tempG < neighbour.g) {
                        neighbour.g = tempG;
                        newPath = true;
                    }
                } else {
                    neighbour.g = tempG;
                    newPath = true;
                    openSet.push(neighbour);
                }

                if (newPath) {
                    neighbour.h = heuristic(neighbour, endSpot);
                    neighbour.f = neighbour.g + neighbour.h;
                    neighbour.previous = current;
                }
            }
        }
    }

    console.log("no path!");
    return [];
}

//old function from coding train vid
function Spot(i,j,lng,lat){

        this.i = i;
        this.j = j;
        this.lng = lng;
        this.lat = lat;
    
        this.f = 0;
        this.g = 0;
        this.h = 0;
    
        this.neighbours = [];
        this.previous = undefined;
        this.wall = false;
        this.park = false;


        this.addNeighbours = function(grid) {
            let i = this.i;
            let j = this.j;
        
            if (i < grid.length - 1) this.neighbours.push(grid[i + 1][j]);
            if (i > 0) this.neighbours.push(grid[i - 1][j]);
            if (j < grid[0].length - 1) this.neighbours.push(grid[i][j + 1]);
            if (j > 0) this.neighbours.push(grid[i][j - 1]);
        }


}


function findClosestSpot(grid, lngLat) {
    let closest = null;
    let bestDist = Infinity;

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            let spot = grid[i][j];
            let d = dist(lngLat[0], lngLat[1], spot.lng, spot.lat);

            if (d < bestDist) {
                bestDist = d;
                closest = spot;
            }
        }
    }

    return closest;
}



function assignFakeParks(grid) {
    for (let i = 10; i < 20; i++) {
        for (let j = 10; j < 20; j++) {
            grid[i][j].park = true;
        }
    }
}



function removeFromArray(arr,elt){
    for (var i = arr.length-1; i>=0; i--){
        if (arr[i] === elt){
            arr.splice(i,1);
        }

    }
}

function heuristic (a,b){
    //this is known as euclidiian distance uses pythag theorem
    // var d = dist(a.i,a.j,b.i,b.j);

    // //absolute distance version
    var d = abs(a.i - b.i) + abs(a.j-b.j);
    
    return d;

}

// Define a custom dist function to replace p5.js dist
function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
