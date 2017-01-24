/*if (typeof device != 'undefined')
 document.addEventListener('deviceready', onDeviceReady, false);
 else {
 $(document).on('ready', function() {
 var map = new GoogleMap();
 var mapOptions = { coords: {
 latitude: -117.42250,
 longitude: 33.92
 }};

 map.initialize(mapOptions);
 });
 }*/
var map;
var gaPlugin;
var reachability;
var currentPageID = "home";
var saved_coords = saved_coords || {};
var geo_options = {enableHighAccuracy: true};
document.addEventListener('deviceready', onDeviceReady, false);

isInWeb = !(document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1);
function returnHome() {
    currentPageID = "home";
    //window.history.back();
    $.mobile.navigate("#home");
}


/* START: system functions */
function onDeviceReady() {

    navigator.geolocation.getCurrentPosition(
        function (coords) {
            localStorage.setItem("saved_coords", JSON.stringify(coords));
        },
        function (error) {
            localStorage.setItem("geolocation_error", JSON.stringify(error));
        }
        , {enableHighAccuracy: true}
    );

    preloadData();
    // document.addEventListener("resume", floodGateNotification, false);
    document.addEventListener("resume", preloadData, false);

    $.mobile.allowCrossDomainPages = true;
    $.support.cors = true;

    reachability = new Reachability();
    if (reachability.IsNotConnected()) {
        navigator.notification.alert('No internet connection available', null, 'IE511', 'OK');
    }

    // START: Google Analytics (using mobile WEB version)
    gaPlugin = window.analytics;
    if (typeof gaPlugin == 'object') {
        gaPlugin.startTrackerWithId("UA-44649120-1");
    }
    // END: Google Analytics


    //auto-hide splash screen delay
    setTimeout(function () {
        navigator.splashscreen.hide();
        StatusBar.hide();
    }, 2000);

    /* START: status bar fix for iOS7+ */
    if (parseFloat(window.device.version) >= 7) {
        $('.appheader').css("padding", "20px 0px 5px 0px")
    } else {
        $('.appheader').css("padding", "5px 0px 5px 0px")
    }
    /* END: status bar fix for iOS7+ */


    // back button
    document.addEventListener('backbutton', returnHome, false);

    $(document).delegate('#traffic', 'pagehide', function () {

        map = null;
        coords = null;
        mgrCamera = null;
        mgrIncident = null;
        mgrCMS = null;
        blnIncidents = true;
        blnCamera = false;
        blnCMS = false;


    });

    $(document).delegate('#parkandride', 'pagehide', function () {
        pnr_map = null;
        pnr_coords = null;
        mgrParkandride = null;
    });
    // busrail.html
    $(document).delegate('#busrail', 'pageshow', function () {
        currentPageID = "busrail";

        // Back button logic
        //$('#busrail .ui-footer a[data-rel="back"]').on('click', busrailBack);
        //document.addEventListener('backbutton', busrailBack, false);

        var transitUrl = 'http://www.ie511.org/transitdata.aspx';
        var oldContentHtml; // variable for use with back button

        // Initialize 
        $.post(transitUrl, {init: 'county'}, function (data) {
            fillTransitData(data, 'county');
        });
        $.post(transitUrl, {init: 'city'}, function (data) {
            fillTransitData(data, 'city');
        });
        $.post(transitUrl, {init: 'agency'}, function (data) {
            fillTransitData(data, 'agency');
        });

        // Handle select change events
        $('#county').change(function () {
            var val = $(this).val();
            $.post(transitUrl, {searchmode: "county-city", query: val}, function (data) {
                fillTransitData(data, 'city');
            });
            $.post(transitUrl, {searchmode: "county-agency", query: val}, function (data) {
                fillTransitData(data, 'agency');
            });
        });
        $('#city').change(function () {
            var val = $(this).val();
            $.post(transitUrl, {searchmode: "city-agency", query: val}, function (data) {
                fillTransitData(data, 'agency');
            });
        });
        $('#agency').change(function () {
            var val = $(this).val();
            $.post(transitUrl, {searchmode: "agency", query: val}, function (data) {
                showAgency(data);
            });
        });

        // Fill data for #selector from transit data request
        function fillTransitData(data, selector) {
            var element = $('#' + selector);

            // Remove old items

            element.children('option').each(function (index, value) {
                if (index != 0) {
                    $(this).remove();
                }
            });

            var items = data.split('|');
            for (var i in items) {
                var item = items[i].trim();

                if (item == '') {
                    continue;
                }

                element.append($('<option></option>')
                    .attr('value', item)
                    .text(item));
            }
        }

        // Get the HTML for the selected agency and show the details on the page
        function showAgency(data) {
            var arrData = data.split("%%");
            var citiesServed = arrData[0].split("|");
            var agencyData = arrData[1].split("|");
            var returnText = "<h2>" + agencyData[0] + "</h2>";
            returnText += "<div class='busrailproviders_container'>";
            returnText += "<div class='blockboth'><p><b>Cities:&nbsp;</b><span class='small'>";
            for (o = 1; o < citiesServed.length; o++) {
                returnText += citiesServed[o];
                if ((o + 1) < citiesServed.length) {
                    returnText += ", ";
                }
            }
            returnText += "</span></p></div>";
            if (agencyData[1].length > 0) {
                returnText += "<div class='blockboth'><p><b>Phone:&nbsp;</b><span class='small'><a href='tel:" + agencyData[1] + "'>" + agencyData[1] + "</a></span><br /><br /></p><br /></div>";
            }


            returnText += "</div>";
            //window.location ="app_busrail_2.aspx?page=2&load="+encodeURIComponent(returnText);

            oldContentHtml = $('#busrailcontent').html();
            // Update content div
            $('#busrailcontent').html(returnText);
            //$.mobile.changePage('busrail.html#agency');

        }

    });

    // carpool
    $(document).delegate('#carpool', 'pageshow', function () {
        currentPageID = "carpool";

        // iscroll
        myScroll = new iScroll('map_canvas', {
            checkDOMChanges: true,
            bounce: false,
            momentum: true,
            bounceLock: true,
            zoom: true,
            snap: false,
            x: -850,
            y: -300
        });


        document.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, false);
    });

    $(document).ready(function () {
        doOnOrientationChange();
    });

}
function onWindowUnload() {
    //gaPlugin.exit(nativePluginResultHandler, nativePluginErrorHandler);
}
/* END: system functions */









/* START: required generic handlers */
function successHandler() {
    trackPage('index.html');
    //alert('success hit');

}
function errorHandler() {
    //alert('error hit');
}
function nativePluginResultHandler(result) {
    //alert('nativePluginResultHandler - '+result);
    //console.log('nativePluginResultHandler: '+result);
}
function nativePluginErrorHandler(error) {
    //alert('nativePluginErrorHandler - '+error);
    //console.log('nativePluginErrorHandler: '+error);
}
/* END: required generic handlers */




/* START: google analytics functions */
function trackMenu(_track) {
    gaPlugin.trackEvent("Menu", "Click", "Menu: " + _track, 1);
}
function trackButton(_track) {
    gaPlugin.trackEvent("Button", "Click", "Button: " + _track, 1);
}
function trackPage(_track) {
    gaPlugin.trackView("ie511.org/mobileapp/" + _track);
}
/* END: google analytics functions */


function alertDismissed() {
    // do something
}

function triggerAlert(message) {

    title = "Floodgate Message";
    buttonName = "Close";

    if (isInWeb) {
        alert(message);
    } else {
        navigator.notification.alert(
            message,            // message
            alertDismissed,     // callback
            'IE511'              // title
        );
    }
}

function floodGateNotification() {

    if ($.mobile.activePage.attr('id') != "traffic") {
        return;
    }
    //prevent floodgate notification from PaveMent Project Page
    var u  = new Url;
    if (u.query.hasOwnProperty('mode') && u.query.mode == 'i10')
    {
        return;
    }

    randomNum = Math.floor(Math.random() * 10000000);
    var xmlUrl = "http://www.ie511.org/iteris/data/Floodgates2.xml?" + randomNum.toString();
    //var xmlUrl = "http://www.ie511.org/iteris/data/Floodgates_sample.xml?" + randomNum.toString();

    $.ajax({
        url: xmlUrl,
        //headers: {'Access-Control-Request-Method':'POST'},
        //beforeSend: function(xhr){xhr.setRequestHeader('Access-Control-Allow-Origin:*');},
        type: 'GET',
        success: function (data) {
            var total_msg = '';
            var floodgates = $(data).find('floodgate');

            for (var i = 0; i < floodgates.length; i++) {
                var floodgate = $(floodgates[i]);
                var msg = floodgate.find("message").text();

                total_msg += msg + '\n';

            }

            if ($.trim(total_msg) != '') triggerAlert(total_msg);


        },
        error: function (xhr, status, error) {
            triggerAlert('error');
        }
    });


}

function floodGateNotificationFromDiv() {

    if ($.mobile.activePage instanceof Object && $.mobile.activePage.attr('id') != "traffic") {
        return;
    }

    randomNum = Math.floor(Math.random() * 10000000);
    var url = "http://ie511.org/traffic/road-conditions/i-15-devore-cajon-pass-construction-updates";

    $.ajax({
        url: url,
        //headers: {'Access-Control-Request-Method':'POST'},
        //beforeSend: function(xhr){xhr.setRequestHeader('Access-Control-Allow-Origin:*');},
        type: 'GET',
        success: function (data) {
            var total_msg = '';
            data = $.parseHTML(data);
            var floodgates = $(data).find('div#a-area-83-headline').next().find('div.a-slot-content>p');
            var temp = [];
            $(floodgates).each(function (i, v) {
                temp[i] = $(v).text().trim();
            });
            floodgates = temp;
            for (var i = 0; i < floodgates.length; i++) {

                var msg = floodgates[i];

                total_msg += msg + '\n';

            }

            if ($.trim(total_msg) != '') triggerAlert(total_msg);


        },
        error: function (xhr, status, error) {
            triggerAlert('error');
        }
    });


}

function pavementNotificationFromDiv() {

    if ($.mobile.activePage instanceof Object && $.mobile.activePage.attr('id') != "traffic") {
        return;
    }

    randomNum = Math.floor(Math.random() * 10000000);
    var url = "http://www.ie511.org/traffic/road-conditions/i-10-pavement-replacement-project";

    $.ajax({
        url: url,
        //headers: {'Access-Control-Request-Method':'POST'},
        //beforeSend: function(xhr){xhr.setRequestHeader('Access-Control-Allow-Origin:*');},
        type: 'GET',
        success: function (data) {
            var total_msg = '';
            data = $.parseHTML(data);
            var floodgates = $(data).find('#a-slot-content-81-body-3');
            var temp = [];
            $(floodgates.children()).each(function (i, v) {
                temp[i] = $(v).text().trim();
            });
            floodgates = temp;
            for (var i = 0; i < floodgates.length; i++) {
                var msg = floodgates[i];
                total_msg += msg.trim().replace(/\t/g,"") + '\n';
            }

            if ($.trim(total_msg) != '') triggerAlert(total_msg);

        },
        error: function (xhr, status, error) {
            triggerAlert('error');
        }
    });


}


function preloadData() {
    floodGateNotification(); // give floodgate notifications on resume and initial load
    preloadIncident(); // preloads incident data
    preloadCamera(); // preloads camera data
    preloadCMS(); // preloads cms data
    preloadParkandRide(); // preloads park and ride data
    busandridedata(); // preloads bus and ride select menu options
}

function busandridedata() {

    var citiesUrl = 'http://cloud.ie511.org/bus-rail-providers/cities';
    var agencyUrl = 'http://cloud.ie511.org/bus-rail-providers/agencies';


    $.post(citiesUrl, {county: 'null'}, function (data) {
        window.localStorage.setItem('cities_data', JSON.stringify(data));
    });

    $.post(agencyUrl, {city: 'null', county: 'null'}, function (data) {
        window.localStorage.setItem('agency_data', JSON.stringify(data));
    });


}

function preloadIncident() {
    randomNum = Math.floor(Math.random() * 10000000);
    var xmlUrl = "http://www.ie511.org/iteris/data/Incidents.xml?" + randomNum.toString();
    $.ajax({
        url: xmlUrl,
        type: 'GET',
        success: function (data) {

            var xmlText = new XMLSerializer().serializeToString(data);

            window.localStorage.setItem('incident_data', xmlText);

        },
        error: function (xhr, status, error) {
            triggerAlert('Error loading incidents data');
        }
    });
}

function preloadCamera() {
    randomNum = Math.floor(Math.random() * 10000000);
    var xmlUrl = "http://www.ie511.org/iteris/data/Cameras.xml?" + randomNum.toString();
    $.ajax({
        url: xmlUrl,
        type: 'GET',
        success: function (data) {

            var xmlText = new XMLSerializer().serializeToString(data);

            window.localStorage.setItem('camera_data', xmlText);


        },
        error: function (xhr, status, error) {
            triggerAlert('Error loading cameras data');
        }
    });
}
function preloadCMS() {
    randomNum = Math.floor(Math.random() * 10000000);
    var xmlUrl = "http://www.ie511.org/iteris/data/Cms.xml?" + randomNum.toString();
    $.ajax({
        url: xmlUrl,
        type: 'GET',
        success: function (data) {

            var xmlText = new XMLSerializer().serializeToString(data);

            window.localStorage.setItem('cms_data', xmlText);

        },
        error: function (xhr, status, error) {
            triggerAlert('Error loading CMS data');
        }
    });
}

function preloadParkandRide() {
    randomNum = Math.floor(Math.random() * 10000000);
    //var xmlUrl = "http://www.ie511.org/park_and_ride_data_ios.aspx?" + randomNum.toString();
    var xmlUrl = "http://cloud.ie511.org/park-and-ride-data";
    $.ajax({
        url: xmlUrl,
        type: 'GET',
        success: function (data) {

            //var xmlText = new XMLSerializer().serializeToString(data);

            window.localStorage.setItem('park_and_ride_data', JSON.stringify(data));

        },
        error: function (xhr, status, error) {
            triggerAlert('error');
        }
    });
}

function init_sr91() {
    //trackMenu('home - traffic');
    console.log('SR91 received map_init_done');
    var center = new google.maps.LatLng(33.865282558610005, -117.60180030822755);//https://www.google.com/maps/dir/5995+Dandridge+Ln,+San+Diego,+CA+92115/CA-91,+California/@33.851895, -117.926906
    // using global variable:
    map.panTo(center);
    if (map.getZoom() < 12) {
        map.setZoom(12);
    }
    $('#traffic > div.appheader >h1').html("91 Alert");

}

function init_i10() {
    //trackMenu('home - traffic');
    console.log('I10 received map_init_done');//
    var center = new google.maps.LatLng(34.035426, -117.132282);
    // using global variable:
    map.panTo(center);
    if (map.getZoom() < 12) {
        map.setZoom(13);
    }
    $('#traffic > div.appheader >h1').html("I-10 Pavement Project");

    pavementNotificationFromDiv();
    document.addEventListener("resume", pavementNotificationFromDiv, false);


}

function doOnOrientationChange() {
    var $main_menu = $('#main_menu');

    switch (screen.orientation) {
        case 'landscape':
        case 'landscape-primary':
        case 'landscape-secondary':
            $main_menu.removeClass('landscape');
            break;
        default:
            $main_menu.addClass('landscape');
    }
}

window.addEventListener('orientationchange', doOnOrientationChange);

