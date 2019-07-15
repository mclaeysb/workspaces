// Require
var csv2geojson = require('csv2geojson');
var $ = require('jquery');
var Mustache = require('Mustache');

// Load data
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: './data/workspaces.csv',
        dataType: "text",
        success: function(csvData) {makeGeoJSON(csvData);}
     });
});
function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {
        makeMap(data);
    });
};
// TODO: check if we can load this directly from Google sheets: https://developers.google.com/drive/api/v3/manage-downloads#downloading_google_documents

// Replace 'null' with null (addSource seems to handle null's badly)
function correctNull(object) {
  for (var key in object) {
    if (object[key] == "null") {
      object[key] = null;
    }
  }
  return object
}

// Specifying access tokens
mapboxgl.accessToken = "pk.eyJ1IjoibWNsYWV5c2IiLCJhIjoiY2loZ3dtanZlMDRyaHRyajdhOGZwZ3VqZSJ9.-VlodpvODHjL3GEVNyxDgQ";

// Define map
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mclaeysb/cjy1ii6xn0v3s1ct434all020',
    center: [4, 51], // starting position [lng, lat]
    zoom: 8 // starting zoom
});

// Disable map rotation using right click + drag
map.dragRotate.disable();

// Disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

// Make map
function makeMap(data){
    map.on('load', function () {

        map.addLayer({
            'id': 'workspaces',
            'type': 'symbol',
            'source': {
                'type': 'geojson',
                'data': data
            },
            'layout': {
                "icon-image": "marker-15"
            },
            'paint': {}
        });

        // Create a hover, but don't add it to the map yet.
        var hover = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 8,
        });
        // Create a popup, but don't add it to the map yet.
        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 8,
        });

        // Set filters
        map.setFilter('workspaces', ["==", ["get", "open"], "yes"]);

        // Add interactivity
        var locations = [
          {id: 'all', className: 'active', innerHTML: 'All', center: [2.972, 51.094], zoom: 6},
          {id: 'brussels', className: '', innerHTML: 'Brussels', center: [4.3517, 50.8468], zoom: 12},
          {id: 'ghent', className: '', innerHTML: 'Ghent', center: [3.7284, 51.0482], zoom: 13},
          {id: 'london', className: '', innerHTML: 'London', center: [-0.1029, 51.5192], zoom: 12}
        ]
        // Make locations
        locations.forEach(function(properties) {
          var link = document.createElement('a');
              link.href = '#';
              link.id = properties.id;
              link.className = properties.className;
              link.innerHTML = properties.innerHTML;

          link.onclick = function(e) {
              e.preventDefault();
              e.stopPropagation();

              var wasActive = this.className == 'active'

              for (var i = 0; i < locationpicker.children.length; i++) {
                locationpicker.children[i].className = '';
              }

              if(wasActive) {
                document.getElementById("all").className = 'active';
              } else {
                map.flyTo({
                    center: properties.center,
                    zoom: properties.zoom
                });
                this.className = 'active';
              }
            }
          locationpicker.appendChild(link);
        });

        map.on('mouseenter', 'workspaces', function (e) {
          // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
          map.getCanvas().style.cursor = 'pointer';

          var coordinates = e.features[0].geometry.coordinates.slice();
          var properties = correctNull(e.features[0].properties);

          // Open a hover at the location of the feature, with description HTML from its properties.
          // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the hover appears over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          // Open hover
          hover.setLngLat(coordinates)
            .setHTML(properties.name)
            .addTo(map);
        });

        map.on('mouseleave', 'workspaces', function () {
          // Change cursor back
          map.getCanvas().style.cursor = '';
          hover.remove();
        });

        map.on('click', function (e) {
          popup.remove();
          removeDashboard();
        });

        map.on('click', 'workspaces', function (e) {
          // Close hover
          hover.remove();
          
          var coordinates = e.features[0].geometry.coordinates.slice();
          var properties = correctNull(e.features[0].properties);

          // Open a popup at the location of the feature, with description HTML from its properties.
          // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          // Build HTML
          var content = document.createElement('div');
          content.className = 'dashboardcontent';
          content.innerHTML = Mustache.render(
            "<div class='name'>{{name}} {{total_score}}</div><br>" +
            "<div class='location'>{{type}} near {{location}}</div>" +
            //"<tr><td>Open {{opening_hours}}</td></tr>" +
            "<table class='infotable heading' style='float: left;'><tbody>" +
            "<tr><th>Accessibility</th><td>{{accessibility_score}}</td><td>{{accessibility}}</td></tr>" +
            "<tr><th>Vibe</th><td>{{vibe_score}}</td><td>{{vibe}}</td></tr>" +
            "<tr><th>Food</th><td>{{food_score}}</td><td>{{food}}</td></tr>" +
            "<tr><th>Furniture</th><td>{{furniture_score}}</td><td>{{furniture}}</td></tr>" +
            "<tr><th>Technical</th><td>{{technical_score}}</td><td>{{technical}}</td></tr>" +
            "<tbody></table>", properties);
//accessibility
//accessibility_score
//vibe
//vibe_score
//food
//food_score
//furniture
//furniture_score
//technical
//technical_score
          // Open dashboard
          showDashboard();
          dashboard.innerHTML = '';
          dashboard.appendChild(content);

        });

        // Add zoom controls
        map.addControl(new mapboxgl.NavigationControl({showCompass: false}), 'top-left');

        // Operational functions
        function removeDashboard(){
            dashboard.className = '';
        }
        function showDashboard(){
            dashboard.className = 'active';
        }
    });
};