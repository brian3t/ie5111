var pnr_map;
var pnr_coords;
var mgrParkandride = null;

if (typeof basePath === 'undefined') {
    var basePath = '';
}


function ParkAndRideMap() {
    this.initialize = function (position) {
        var coords = {};
        if (typeof position != 'undefined') {
            coords = position.coords;
        } else {
            if (INITIAL_LATITUDE !== null && INITIAL_LATITUDE) {
                coords.latitude = INITIAL_LATITUDE;
            }
            if (INITIAL_LONGITUDE !== null && INITIAL_LONGITUDE) {
                coords.longitude = INITIAL_LONGITUDE;
            }
        }
        map = showMap(coords);
    };

    var showMap = function (coords) {
        // Variables
        var IMAGES = ['cameran', 'cms', 'incident_minor', 'incident_moderate', 'incident_major', 'incident_cleared', 'info', 'counter', 'construction', 'closure', 'cameras', 'camerae', 'cameraw'];
        var ICONS = [];
        // Setup map
        var mapOptions = {
            zoom: 10,
            zoomControl: true,
            panControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.DEFAULT,
                position: google.maps.ControlPosition.LEFT_TOP
            },
            mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        // Set initial coordinates
        if (coords) {
            mapOptions.center = {lat:coords.latitude, lng:coords.longitude};
        }
        map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        // Setup markers
        mgrParkandride = new MarkerManager(map);
        setupMarkers();

        var randomKey = Math.floor(Math.random() * 10000000);


        function setupMarkers() {
            addParkandride();
        }


        /* function addParkandride()
         {
         randomNum = Math.floor(Math.random()*10000000);
         var xmlUrl = "http://www.ie511.org/park_and_ride_data_ios.aspx?" + randomNum.toString();
         google.maps.event.addListener(mgrParkandride, 'loaded', function() {
         var req = $.ajax({
         url:  xmlUrl,
         type: 'GET',
         success: function(data) {
         var markers = $(data).find('POINTS');
         var batch = [];
         for (var i=0; i < markers.length; i++) {
         var marker = $(markers[i]);
         var lat = parseFloat(marker.find("LAT").text());
         var lng = parseFloat(marker.find("LON").text());
         if (lat != 0 && lng != 0) {
         var point = new google.maps.LatLng(lat,lng);
         var title = marker.find("TITLE").text();
         var city = marker.find("CITY").text();
         var description = marker.find("DESCRIPTION").text();
         var IncType = "1";
         var html = document.createElement('div');
         html.setAttribute('class', 'pnrwindow');
         html.innerHTML = "<span class=\"iwtitle\">" + title + "</span><br />";
         html.innerHTML += "City: " + city + "<br />";
         html.innerHTML += description + "<br />";
         var marker = createMarker(point, html, IncType, "parkandride");
         batch.push(marker);
         }
         }
         mgrParkandride.addMarkers(batch, 7, 19, "parkandride");
         mgrParkandride.refresh();
         },
         error: function(xhr, status, error) {
         triggerAlert('error');
         }
         });
         });
         }
         */

        function addParkandride() {
            randomNum = Math.floor(Math.random() * 10000000);
            var xmlUrl = "http://cloud.ie511.org/park-and-ride-data?type=xml";
            google.maps.event.addListener(mgrParkandride, 'loaded', function () {
                var data = window.localStorage.getItem('park_and_ride_data');
                data = JSON.parse(data);
                var markers = data.points;
                var batch = [];
                for (var i = 0; i < markers.length; i++) {
                    var marker = markers[i];
                    var lat = parseFloat(marker.latitude);
                    var lng = parseFloat(marker.longitude);
                    if (lat != 0 && lng != 0) {
                        var point = new google.maps.LatLng(lat, lng);
                        var title = marker.name;
                        var city = marker.city;
                        var description = marker.description;
                        var IncType = "1";
                        var html = document.createElement('div');
                        description = description.replace(/(\r\n|\r|\n)/g, '<br />');
                        description = description.replace(/<br ?\/?><br ?\/?><br ?\/?>/g, '<br />');
                        description = description.replace(']]>', '<br />');
                        html.setAttribute('class', 'pnrwindow');
                        html.innerHTML = "<span class=\"iwtitle\">" + title + "</span><br />";
                        html.innerHTML += "City: " + city + "<br />";
                        html.innerHTML += description + "<br />";
                        var marker = createMarker(point, html, IncType, "parkandride");
                        batch.push(marker);
                    }
                }
                mgrParkandride.addMarkers(batch, 7, 19, "parkandride");
                mgrParkandride.refresh();

            });
        }


        var infowindow = new google.maps.InfoWindow({
            size: new google.maps.Size(240, 100)
        });


        function createMarker(latlng, html, iconType, layer) {
            var tmpIcon = getIcon(iconType);
            var contentString = html;
            var marker = new google.maps.Marker({
                layer: layer,
                position: latlng,
                icon: tmpIcon.icon,
                shadow: tmpIcon.shadow,
                zIndex: Math.round(latlng.lat() * -100000) << 5
            });
            google.maps.event.addListener(marker, 'click', function () {
                infowindow.close();
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
            });
            google.maps.event.addListener(map, 'click', function () {
                infowindow.close();
            });
            return marker;
        }


        function getIcon(iconType) {
            var i = parseInt(iconType);
            var iconExtension = ".gif";
            var iconWidth = 20;
            var iconHeight = 20;
            var iconWidth2 = 10;
            var iconHeight2 = 20;
            var iconImageURL = basePath + "images/markerpnr.png";
            var shadowPath = basePath + "images/markerpnr.png";
            if (!ICONS[i]) {
                /*
                 if(i==3) { iconImageURL = basePath + "images/markersigalert.png"; }
                 else if(i==7) { iconImageURL = basePath + "images/incident7.gif"; }
                 else if(i==8) { iconImageURL = basePath + "images/incident8.gif"; }
                 else if(i==11) { iconImageURL = basePath + "images/markerincident.png"; }
                 else if(i==98) { iconImageURL = basePath + "images/markercms.png"; }
                 else if(i==99) { iconImageURL = basePath + "images/markercamera.png"; }
                 */
                var iconImage = new google.maps.MarkerImage(iconImageURL,
                    new google.maps.Size(iconWidth, iconHeight),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(iconWidth2, iconHeight2)
                );
                var iconShape = {
                    coord: [1, 1, 1, 32, 32, 32, 32, 1],
                    type: 'poly'
                };
                ICONS[i] = {
                    icon: iconImage,
                    shape: iconShape
                };
            }
            return ICONS[i];
        }


        return map;
    }
}