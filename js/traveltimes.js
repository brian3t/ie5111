

// =====================================================
// travel times
// =====================================================
function drawTravelTimes()
{
    var randomNum = Math.floor(Math.random()*10000000);
    var xmlUrl = BASE_URL + "iteris/data/Polytraveltimes.xml?" + randomNum.toString();

    downloadUrl(xmlUrl, function(doc) 
    {

        var xmlDoc = xmlParse(doc);
        var markers = xmlDoc.documentElement.getElementsByTagName("Points");

        for (var i = 0; i < markers.length; i++) 
        {
            var URL = markers[i].getElementsByTagName("URL")[0].childNodes[0].nodeValue;
            var POLYENCODE = markers[i].getElementsByTagName("POLYENCODE")[0].childNodes[0].nodeValue;
            var LEVELS = markers[i].getElementsByTagName("LEVELS")[0].childNodes[0].nodeValue;
            var decodedPath = google.maps.geometry.encoding.decodePath(POLYENCODE);
            var decodedLevels = decodeLevels(LEVELS);
            polylineClick(decodedPath, decodedLevels, URL);

        }
    });

}




function polylineClick(decodedPath, decodedLevels, url) {

    var polyline = new google.maps.Polyline({
        path: decodedPath,
        levels: decodedLevels,
        strokeColor: "#000000",
        strokeOpacity: 0.0,
        strokeWeight: 10,
        map: map
     });

    google.maps.event.addListener(polyline,"click",function(event) {

        if (infowindow) infowindow.close();
        //if (infoBox) infoBox.close();
         
        var point = polyline.getPath().getAt(0);
        infowindow.setContent("<iframe src="+ url +" width=\"250\" height=\"250\" frameBorder=\"0\"></iframe>" );

        if (event) {
            point = event.latLng;
        }
        infowindow.setPosition(point);
        infowindow.open(map);

        google.maps.event.addListener(map, 'click', function() {
            if (infowindow) infowindow.close();
            //if (infoBox) infoBox.close();
        });

    });   

    polyline.setMap(map);    
}





function decodeLevels(encodedLevelsString) {
     var decodedLevels = [];
 
     for (var i = 0; i < encodedLevelsString.length; ++i) {
         var level = encodedLevelsString.charCodeAt(i) - 63;
         decodedLevels.push(level);
     }
     return decodedLevels;
}
 