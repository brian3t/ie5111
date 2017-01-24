// =====================================================
// chain controls
// =====================================================
function hideChainControls() {
    for(i=0; i<arrChainControls.length; i++) {
        arrChainControls[i].setMap(null);
    }
}
function showChainControls() {
    for(i=0; i<arrChainControls.length; i++) {
        arrChainControls[i].setMap(map);
    }
}

function addChainControls() {
    if (typeof BASE_URL == "undefined"){
        console.log("Missing BASE_URL");
        return;
    }
    randomNum = Math.floor(Math.random()*10000000);     
    var xmlUrl = BASE_URL + "xmlproxy.php?" + randomNum.toString();
    // ie: http://www.ie511.org/ba-simple-proxy.php?url=http://www.dot.ca.gov/dist8/tmc/chainkml/chain.xml&mode=native?123123123
    downloadUrl(xmlUrl, function(doc) {
        var xmlDoc = xmlParse(doc);
        var markers = xmlDoc.documentElement.getElementsByTagName("Section");
        for (var i = 0; i < markers.length; i++) {
            if(i < 17) { 
                //start fix

                var controlLevel = markers[i].getElementsByTagName("Control_Level")[0].childNodes[0].nodeValue;
                if(controlLevel =="R-1" || controlLevel =="r1" || controlLevel =="R-2" || controlLevel =="r2" || 
                 controlLevel =="R-3" || controlLevel =="r3" || controlLevel =="rc" || controlLevel =="pe") {
                    var kmlFile = markers[i].getElementsByTagName("Kml_Filename")[0].childNodes[0].nodeValue;
                var kmlURL = "http://www.ie511.org/iteris/chainkml/"+controlLevel+"/"+kmlFile;
                var chainKMLLayer = new google.maps.KmlLayer(kmlURL, {
                   suppressInfoWindows: true,
                   preserveViewport: true,
                   map: map
               } );                
                google.maps.event.addListener(chainKMLLayer, 'click', function(kmlEvent)
                {
                  openChainControlWindow(kmlEvent);
              }); 
                chainKMLLayer.setMap(map);
                arrChainControls.push(chainKMLLayer);
            }
                } //end fix
            }
        });
}


function openChainControlWindow(kmlEvent) {
    
    var tmpIcon = getIcon(99);
    var contentString = "<div class='incidentwindow'>"+kmlEvent.featureData.description+"</div>";
    contentString = contentString.replace("face=\"tahoma\"", "");
    var ccmarker = new google.maps.Marker({
        layer: 'chaincontrols',
        position: new google.maps.LatLng(kmlEvent.latLng.lat(),kmlEvent.latLng.lng()),
        icon: tmpIcon.icon,
        shadow: tmpIcon.shadow,
        zIndex: Math.round(kmlEvent.latLng.lat()*-100000)<<5
    });

    console.log(kmlEvent.latLng.lat());
    console.log(kmlEvent.latLng.lng());
    console.log(ccmarker);
    infowindow.close();
    infowindow.setContent(contentString);
    infowindow.open(map);
    infowindow.setPosition(new google.maps.LatLng(kmlEvent.latLng.lat(),kmlEvent.latLng.lng()));


    google.maps.event.addListener(map, 'click', function() {
        if (infowindow) infowindow.close();
  });

}

