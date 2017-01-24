$(document).on('ready', function() {
    var map = new GoogleMap();

    var mapOptions = { coords: {
        latitude: 33.92,
        longitude: -117.42250
    }};

    map.initialize(mapOptions);
});
