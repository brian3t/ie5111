var map = null;
var IMAGES = [ 'cameran', 'cms', 'incident_minor', 'incident_moderate', 'incident_major', 'incident_cleared', 'info', 'counter', 'construction', 'closure', 'cameras', 'camerae', 'cameraw' ];
var ICONS = [];
var map = null;
var map2 = null;
var mgrCameras = null;
var mgrIncidents = null;
var mgrCms = null;
var mgrLCS = null;

var arrChainControls = [];
var trafficDrawnOnce = false;
var imagetype =".png";
var initialMapLoad = true;

var blnIncidents = true;
var blnCamera = false;
var blnCMS = false;
var blnLCS = true;

var initialX 	= -117.42250;
var initialY 	= 33.92;
var initialZ 	= 10;

var previousLat = 0;
var previousLon = 0;
var previousZoom = 0;

var pendingRecenterMap = true;

var infowindow = new google.maps.InfoWindow(
    {
        size: new google.maps.Size(240,100)
    });






function initializeMap(mapId) {
    //initialize(33.92,-117.42250,10,false,false,false);
    var myLatlng = new google.maps.LatLng(initialY,initialX);
    //var myLatlng = new google.maps.LatLng(33.92,-117.42250);
    var myOptions = {
        zoom: initialZ,
        center: myLatlng,
        zoomControl: true,
        panControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.DEFAULT,
            position: google.maps.ControlPosition.TOP_LEFT
        },
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    map = new google.maps.Map(document.getElementById(mapId), myOptions);

    drawTravelTimes();
    mgrCameras = new MarkerManager(map);
    mgrIncidents = new MarkerManager(map);
    mgrCms = new MarkerManager(map);
    mgrLCS = new MarkerManager(map);



    setupMarkers();


    var randomKey = Math.floor(Math.random()*10000000);
    var imageMapType = new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {

            return ['http://maptile.ie511.org/tileset/tile_',
                zoom, '_', coord.x, '_', coord.y, '.png', '?seed=',randomKey].join('');
        },
        tileSize: new google.maps.Size(256, 256)
    });

    map.overlayMapTypes.push(imageMapType);



    google.maps.event.addListener(map, 'idle', function(event) {
        //document.getElementById("loading").style.display  = "none";
        //recenterMap();                             
        /* 
         if(initialMapLoad)
         {
         loadMarkerSets();
         initialMapLoad = false;
         }
         */
    });






    google.maps.event.addListener(map, 'dragstart', function(){
        //document.getElementById("loading").style.display  = "block";
    });


    google.maps.event.addListener(map, 'zoom_changed', function() {
        //document.getElementById("loading").style.display  = "block";
    });


    var intervalId;
    intervalId = setInterval("refreshMap()", 480000);  // 8 minutes

}





function getIcon(iconType) {
    var i = parseInt(iconType);
    var iconExtension = ".gif";
    var iconWidth = 20;
    var iconHeight = 20;
    var iconWidth2 = 10;
    var iconHeight2 = 20;
    var iconImageURL = "http://www.ie511.org/m4/images/marker_incident.png";
    var shadowPath = "http://www.ie511.org/m4/images/incidentshadow.png";
    if (!ICONS[i]) {
        if(i==3) { iconImageURL = "http://www.ie511.org/m4/images/marker_sigalert.png"; }
        else if(i==7) { iconImageURL = "http://www.ie511.org/m4/images/marker_roadclosed.png"; }
        else if(i==8) { iconImageURL = "http://www.ie511.org/m4/images/marker_construction.png"; }
        else if(i==11) { iconImageURL = "http://www.ie511.org/m4/images/marker_incident.png"; }
        else if(i==98) { iconImageURL = "http://www.ie511.org/m4/images/marker_cms.png"; }
        else if(i==99) { iconImageURL = "http://www.ie511.org/m4/images/marker_camera.png"; }
        else if(i==100) { iconImageURL = "http://www.ie511.org/m4/images/lcs.png"; }
        else if(i==101) { iconImageURL = "http://www.ie511.org/m4/images/lcs-full.png"; }
        else if(i==102) { iconImageURL = "http://www.ie511.org/m4/images/lcs-hsr.png"; }

        var iconImage = new google.maps.MarkerImage(iconImageURL,
            new google.maps.Size(iconWidth, iconHeight),
            new google.maps.Point(0,0),
            new google.maps.Point(iconWidth2, iconHeight2)
        );
        var iconShape = {
            coord: [1, 1, 1, 32, 32, 32, 32, 1],
            type: 'poly'
        };
        ICONS[i] = {
            icon : iconImage,
            shape : iconShape
        };
    }
    return ICONS[i];
}







function createMarker(latlng, html, iconType, layer) {

    var tmpIcon = getIcon(iconType);


    var contentString = html;

    var marker = new google.maps.Marker({
        layer: layer,
        position: latlng,
        icon: tmpIcon.icon,
        shadow: tmpIcon.shadow,
        zIndex: Math.round(latlng.lat()*-100000)<<5
    });

    google.maps.event.addListener(marker, 'click', function() {
        infowindow.close();
        infowindow.setContent(contentString);
        infowindow.open(map,marker);
    });


    google.maps.event.addListener(map, 'click', function() {
        infowindow.close();
    });



    return marker;

}



function setupMarkers() {

    google.maps.event.addListener(mgrCameras, 'loaded', function(){
        addCameras();

        if(!blnCamera) { mgrCameras.toggle(); }
    });


    google.maps.event.addListener(mgrIncidents, 'loaded', function(){
        addIncidents();
        if(!blnIncidents) { mgrIncidents.toggle(); }
    });


    google.maps.event.addListener(mgrCms, 'loaded', function(){
        addCms();
        if(!blnCMS) { mgrCms.toggle(); }
    });

    google.maps.event.addListener(mgrLCS, 'loaded', function(){
        addLaneClosure();
        if(!blnLCS) { mgrLCS.toggle(); }
    });


}



// =====================================================
// camera controls
// =====================================================

var current_camera_id = 0;
function refreshCameraStill(cameraID,urlCamera) {
    //alert(cameraID+":"+urlCamera);
    var randomNum = Math.floor(Math.random()*10000000);
    var targetCamera = document.getElementById(cameraID);
    targetCamera.setAttribute("src", urlCamera + "?"+ randomNum.toString());
}

function addCameras() {
    var batch = [];
    randomNum = Math.floor(Math.random()*10000000);
    var xmlUrl = "/iteris/data/Cameras.xml?" + randomNum.toString();
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var markers = xmlDoc.documentElement.getElementsByTagName("Points");
        for (var i = 0; i < markers.length; i++) {
            var lat = parseFloat(markers[i].getElementsByTagName("LAT")[0].childNodes[0].nodeValue);
            var lng = parseFloat(markers[i].getElementsByTagName("LON")[0].childNodes[0].nodeValue);
            if(lat!=0 && lng != 0) {
                var point = new google.maps.LatLng(lat,lng);
                var title = markers[i].getElementsByTagName("TITLE")[0].childNodes[0].nodeValue;
                var location = markers[i].getElementsByTagName("LOCATION")[0].childNodes[0].nodeValue;
                var urlCamera = markers[i].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
                var static = markers[i].getElementsByTagName("STATIC")[0].childNodes[0].nodeValue;
                var url = "";

                if(static=="1") {
                    url = url + "<span class=\"iwtitle\">" + location + "</span><br />";
                    url = url + "<CENTER>";
                    url = url + "<img id='camera"+randomNum.toString()+"' src='"+urlCamera+"?"+ randomNum.toString()+"' alt='' border='0' width='240' />";
                    url = url + "</CENTER>";
                    var html = "<div  align=\"left\" class=\"incidentwindow\">" + url + "</div>";
                    var tempMarker = createMarker(point, html, 99, "cameras");
                    batch.push(tempMarker);
                }
            }
        }
        mgrCameras.addMarkers(batch, 8, 14, "cameras");
        mgrCameras.refresh();
    });
}



function addIncidents() {
    var batch = [];
    randomNum = Math.floor(Math.random()*10000000);
    var xmlUrl = "/iteris/data/Incidents.xml?" + randomNum.toString();
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var markers = xmlDoc.documentElement.getElementsByTagName("Points");
        for (var i = 0; i < markers.length; i++) {
            var lat = parseFloat(markers[i].getElementsByTagName("LAT")[0].childNodes[0].nodeValue);
            var lng = parseFloat(markers[i].getElementsByTagName("LON")[0].childNodes[0].nodeValue);
            if(lat!=0 && lng != 0) {
                var point = new google.maps.LatLng(lat,lng);
                var title = markers[i].getElementsByTagName("TITLE")[0].childNodes[0].nodeValue;
                var location = markers[i].getElementsByTagName("LOCATION")[0].childNodes[0].nodeValue;
                var startTime = markers[i].getElementsByTagName("START")[0].childNodes[0].nodeValue;
                var endTime = markers[i].getElementsByTagName("END")[0].childNodes[0].nodeValue;
                var IncType = markers[i].getElementsByTagName("TYPE")[0].childNodes[0].nodeValue;
                var html = "<div class=\"incidentwindow\"><span class=\"iwtitle\">" + title + "</span><br />" + location + "<br />Start Time: " + startTime + "<br />Last Updated: " + endTime +"</div>";
                var tempMarker = createMarker(point, html, IncType, "incidents");
                batch.push(tempMarker);
            }
        }
        mgrIncidents.addMarkers(batch, 7, 19, "incidents");
        addChainControls();
        mgrIncidents.refresh();
    });
}






function addCms() {
    var batch = [];
    randomNum = Math.floor(Math.random()*10000000);
    var xmlUrl = "/iteris/data/Cms.xml?" + randomNum.toString();
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var markers = xmlDoc.documentElement.getElementsByTagName("Points");
        for (var i = 0; i < markers.length; i++) {
            var lat = parseFloat(markers[i].getElementsByTagName("LAT")[0].childNodes[0].nodeValue);
            var lng = parseFloat(markers[i].getElementsByTagName("LON")[0].childNodes[0].nodeValue);
            if(lat!=0 && lng != 0) {
                var point = new google.maps.LatLng(lat,lng);
                var title = markers[i].getElementsByTagName("MESSAGE")[0].childNodes[0].nodeValue;
                var location = markers[i].getElementsByTagName("LOCATION")[0].childNodes[0].nodeValue;
                title = $.trim(title);
                var intIndexOfMatch = title.indexOf( " " );
                while (intIndexOfMatch != -1){
                    title = title.replace( " ", "&nbsp;" )
                    intIndexOfMatch = title.indexOf( " " );
                }
                var intIndexOfMatch = title.indexOf( "newline" );
                while (intIndexOfMatch != -1){
                    title = title.replace( "newline", "<br />" )
                    intIndexOfMatch = title.indexOf( "newline" );
                }
                var html = "<div align=\"left\" class=\"incidentwindow\"><div class=\"cmsinfo\">" + title + "</div><br />CMS located " + location + "</div>";
                var tempMarker = createMarker(point, html, 98, "cameras");
                batch.push(tempMarker);
            }
        }
        mgrCms.addMarkers(batch, 7, 19, "cms");
        mgrCms.refresh();

    });

}
















function toggleCameras() {
    if(blnCamera)
    {
        blnCamera = false;
        //document.getElementById('legendform').chkCameras.checked = false;
        mgrCameras.hide();
    }
    else
    {
        blnCamera = true;
        //document.getElementById('legendform').chkCameras.checked = true;
        mgrCameras.show();
    }
    mgrCameras.refresh();

}




function toggleIncidents() {
    if(blnIncidents)
    {
        blnIncidents = false;
        //document.getElementById('legendform').chkIncidents.checked = false;
        mgrIncidents.hide();
    }
    else
    {
        blnIncidents = true;
        //document.getElementById('legendform').chkIncidents.checked = true;
        mgrIncidents.show();
    }
    mgrIncidents.refresh();

}



function toggleCms() {
    if(blnCMS)
    {
        blnCMS = false;
        //document.getElementById('legendform').chkCms.checked = false;
        mgrCms.hide();
    }
    else
    {
        blnCMS = true;
        //document.getElementById('legendform').chkCms.checked = true;
        mgrCms.show();
    }
    mgrCms.refresh();
}



function toggleLCS() {
    if(blnLCS)
    {
        blnLCS = false;
        //document.getElementById('legendform').chkCms.checked = false;
        mgrLCS.hide();
    }
    else
    {
        blnLCS = true;
        //document.getElementById('legendform').chkCms.checked = true;
        mgrLCS.show();
    }
    mgrLCS.refresh();
}


/* ui functions */
function toggleOptions() {
    $('.floaty').toggle();
    return false;
}
function toggleLegend() {
    $('.floaty_legend').toggle();
    return false;
}


















function refreshMap() {
    //for desktop only
    mgrCameras.clearMarkers();
    mgrIncidents.clearMarkers();
    mgrCms.clearMarkers();

    addCameras();
    addIncidents();
    addCms();

    trafficDrawnOnce = false;

}



function trim(str) {
    return str.replace(/^\s+|\s+$/g,"");
}


function reloadtraffic() {

    var TMPcurrentZoom = map.getZoom();
    var TMPcenterLatLng = map.getCenter();

    var resetURL = "reset:initialize("+TMPcenterLatLng.lat().toString()+","+TMPcenterLatLng.lng().toString()+","+TMPcurrentZoom.toString()+","+blnIncidents+","+blnCamera+","+blnCMS+");"
    window.location = resetURL;

}



function addLaneClosure() {
    randomNum = Math.floor(Math.random()*10000000);

    //download data from caltrans feed
    var xmlUrl = "/data/lcs.kml?" + randomNum.toString();
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var batch = [];

        $(xmlDoc).find("Placemark").each(function() {
            var iconUrl;
            var name = $(this).find("name").text().bold();
            var description = $(this).find("description").text();
            var coords = $(this).find("coordinates").text().split(",");
            var lat = parseFloat(coords[1]);
            var lng = parseFloat(coords[0]);
            var point = new google.maps.LatLng(lat,lng);
            var styleUrl = $(this).find("styleUrl").text();
            var iconType = 100;
            if (styleUrl) {
                if(styleUrl == "#lcs-full") { iconType = 101; }
                else if (styleUrl == "#lcs-hsr") { iconType = 102; }
            }
            var tempMarker = createMarker(point, [name, description].join(" <br/> "), iconType, "lcs");
            batch.push(tempMarker);
        });
        mgrLCS.addMarkers(batch, 7, 19, "lcs");
        mgrLCS.refresh();

    });

    // download manual incident data
    xmlUrl = "/data/lcs_additional.kml?" + randomNum.toString();
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var batch = [];

        $(xmlDoc).find("Placemark").each(function() {
            var iconUrl;
            var name = $(this).find("name").text().bold();
            var description = $(this).find("description").text();
            var coords = $(this).find("coordinates").text().split(",");
            var lat = parseFloat(coords[1]);
            var lng = parseFloat(coords[0]);
            var point = new google.maps.LatLng(lat,lng);
            var styleUrl = $(this).find("styleUrl").text();
            var iconType = 100;
            if (styleUrl) {
                if(styleUrl == "#lcs-full") { iconType = 101; }
                else if (styleUrl == "#lcs-hsr") { iconType = 102; }
            }
            var tempMarker = createMarker(point, [name, description].join(" <br/> "), iconType, "lcs");
            batch.push(tempMarker);
        });
        mgrLCS.addMarkers(batch, 7, 19, "lcs");
        mgrLCS.refresh();

    });


    mgrLCS.refresh();
}