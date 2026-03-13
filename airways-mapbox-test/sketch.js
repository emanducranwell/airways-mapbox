mapboxgl.accessToken = 'YOUR_NEW_TOKEN_HERE';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-79.4512, 43.6568],
    zoom: 13
});

const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/walking'
});

map.addControl(directions, 'top-left');

let clickStage = 0;
let startMarker = null;
let endMarker = null;

const info = document.getElementById('info');

map.on('click', (e) => {

    const lngLat = [e.lngLat.lng, e.lngLat.lat];

    if (clickStage === 0) {

        directions.setOrigin(lngLat);

        if (startMarker) startMarker.remove();

        startMarker = new mapboxgl.Marker({color:'green'})
            .setLngLat(lngLat)
            .addTo(map);

        clickStage = 1;
        info.textContent = "Click map to set B";

    } else if (clickStage === 1) {

        directions.setDestination(lngLat);

        if (endMarker) endMarker.remove();

        endMarker = new mapboxgl.Marker({color:'red'})
            .setLngLat(lngLat)
            .addTo(map);

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
