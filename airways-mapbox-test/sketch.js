//global map variables
let startLngLat = null;
let endLngLat = null;

let clickStage = 0;
let startMarker = null;
let endMarker = null;
const info = document.getElementById('info');

//global a* variables
var cols = 50;
var rows = 50;
var grid = new Array(cols);

var openSet = [];
var closedSet = [];
var start;
var end;
var path = [];
var noSolution = false;
var showModal = true;

var w,h;
var col;
var col1; //colour
var mapImg;


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
    console.log('A*');



    //deifnidng with & height of colums so that it adjust to the width & height of the canvas!
    w = width/cols;
    h = height/rows;
    //making the 2d array (grid)

    for (var i = 0; i < cols; i++){
        grid[i] = new Array (rows);

    }

    for (var i = 0; i < cols; i++){
        for (var j = 0; j < rows; j++){
            grid[i][j] = new Spot(i,j);
        }   
    }

    for (var i = 0; i < cols; i++){
        for (var j = 0; j < rows; j++){
            grid[i][j].addNeighbours(grid);
        }   
    }



    //start and end of the grid
    start = grid[0][0];
    end = grid[cols-1][rows-1];
    //adding in that the start and end can never be a wall!
    start.wall = false;
    end.wall = false;

    //opening the set
    //start searching at 0,0 and then add numbers to the end of the array i'm assuming this logic works until the end of the array?
    openSet.push(start);

}

function drawPathOnMap(path) { 
    //... 
}

function runAStar(grid, startSpot, endSpot){
    //gonna add fucntion that will run astar here, in previous sketch was happening in draw
    //but this is no longer needed bcs onyl want it o happen when a point B is chosen!

    var current;

    

    if (openSet.length > 0) {

        var winner = 0;
        for (var i = 0; i < openSet.length; i++) {
            if (openSet[i].f < openSet[winner].f) {
                winner = i;
            }
        }

        current = openSet[winner];

        if (current === end) {
            console.log("DONE!");
            noLoop();
        }

        removeFromArray(openSet, current);
        closedSet.push(current);

        var neighbours = current.neighbours;
        for (var i = 0; i < neighbours.length; i++) {
            var neighbour = neighbours[i];

            if (!closedSet.includes(neighbour) && !neighbour.wall) {
                var moveCost = 1;

                if (neighbour.park) {
                     moveCost = 0.5;
                }

                var tempG = current.g + moveCost;
                var newPath = false;

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
                    neighbour.h = heuristic(neighbour, end);
                    neighbour.f = neighbour.g + neighbour.h;
                    neighbour.previous = current;
                }
            }
        }

    } else {
        console.log("no path!");
        noSolution = true;
        noLoop();
        return;
    }

    // background(220);

    for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
            grid[i][j].show(color(255));
        }
    }

    for (var i = 0; i < closedSet.length; i++) {
        closedSet[i].show(color(255, 0, 0));
    }

    for (var i = 0; i < openSet.length; i++) {
        openSet[i].show(color(255, 255, 0));
    }

    path = [];
    var temp = current;
    if (temp) {
        path.push(temp);
        while (temp.previous) {
            path.push(temp.previous);
            temp = temp.previous;
        }
    }

    for (var i = 0; i < path.length; i++) {
        path[i].show(color(0, 0, 255));
    }

    fill(0);
    textSize(12);
    textAlign(LEFT, TOP);

}

//old function from coding train vid
function Spot(i,j){

    this.i = startLngLat[0];
    this.j = startLngLat[1];

    this.f = 0;
    this.g = 0;
    this.h = 0;

    this.neighbours = [];
    this.previous = undefined;
    this.wall = false;
    this.park = false;

    if(random(1)< 0.1){
        this.wall = true;
    }
    if(random(1)> 0.1 && random(1)<=0.2){
        this.park = true;
    }

    //show function

    this.show = function(col) {
        // //drawing for original a* function not really needed for this
        // let c = col;
    
        // if (this.wall) {
        //     c = color(0);
        // } else if (this.park) {
        //     c = color(120, 200, 120);
        // }
    
        // fill(c);
        // strokeWeight(1);
        // rect(this.i * w, this.j * h, w, h);
    } //END spot function

    this.addNeighbours = function(grid){
        
        var i = this.i;
        var j = this.j;

     if(i < cols-1){
        this.neighbours.push(grid[i+1][j]);
     }
     if(i > 0){
        this.neighbours.push(grid[i-1][j]);
     }
     if(j < rows-1){
        this.neighbours.push(grid[i][j+1]);
     }
     if(j > 0){
        this.neighbours.push(grid[i][j-1]);
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
    var d = dist(a.i,a.j,b.i,b.j);

    // //absolute distance version
    // var d = abs(a.i - b.i) + abs(a.j-b.j);
    
    return d;

}
