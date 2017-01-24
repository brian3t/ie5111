function GoogleMap(){
    var coords;

    this.initialize = function(options){
        this.coords = options.coords;

        var map = showMap(this.coords);
    }

    var showMap = function(coords) {
    console.log('show map');
        // Setup map
        var mapOptions = {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: new google.maps.LatLng(coords.latitude, coords.longitude)
        }

        var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

        return map;
    }
}
