// Require
var csv2geojson = require('csv2geojson');
var $ = require('jquery');
var Mustache = require('mustache');
var queryString = require('query-string');

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

// Get URL Query parameters
const parsed = queryString.parse(location.search);

// Set default filter based on parameters (very unsafe, I know, but the data is exposed anyway)
if (parsed.private == 'yes') {
  var defaultFilter = ["==", ["get", "show"], "yes"];
} else {
  var defaultFilter = ["all", ["==", ["get", "show"], "yes"], ["==", ["get", "private"], "no"]];
} 

// Specifying access tokens
mapboxgl.accessToken = "pk.eyJ1IjoibWNsYWV5c2IiLCJhIjoiY2loZ3dtanZlMDRyaHRyajdhOGZwZ3VqZSJ9.-VlodpvODHjL3GEVNyxDgQ";

// Define map
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mclaeysb/cjy1ii6xn0v3s1ct434all020',
    center: [4.3577, 50.84247], // starting position [lng, lat], belgium [4.1261, 50.9444], zoom 9
    zoom: 12 // starting zoom
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
                "icon-image": "marker-15",
                "icon-allow-overlap": true,
                "icon-anchor": 'bottom'
            },
            'paint': {}
        });

        // Create a hover, but don't add it to the map yet.
        var hover = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 20,
        });
        // Create a popup, but don't add it to the map yet.
        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: 8,
        });

        // Set filters
        map.setFilter('workspaces', defaultFilter);

        // Add interactivity
        var locations = [
          {id: 'all', className: 'active', innerHTML: 'All', center: [2.972, 51.094], zoom: 6},
          {id: 'brussels', className: '', innerHTML: 'Brussels', center: [4.3577, 50.84247], zoom: 12},
          {id: 'ghent', className: '', innerHTML: 'Ghent', center: [3.7284, 51.0482], zoom: 13},
          // {id: 'amsterdam', className: '', innerHTML: 'Amsterdam', center: [4.906871353826577, 52.371165007629386], zoom: 12},
          // {id: 'london', className: '', innerHTML: 'London', center: [-0.1029, 51.5192], zoom: 12}
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

              map.flyTo({
                  center: properties.center,
                  zoom: properties.zoom
              });
              this.className = 'active';
            }
          locationpicker.appendChild(link);
        });

        var scores = [
          {id: 'all', className: 'active', innerHTML: 'All', number: 0},
          {id: '1', className: '', innerHTML: '★', number: 1},
          {id: '2', className: '', innerHTML: '★★', number: 2},
          {id: '3', className: '', innerHTML: '★★★', number: 3},
          {id: '4', className: '', innerHTML: '★★★★', number: 4},
          {id: '5', className: '', innerHTML: '★★★★★', number: 5}
        ]
        // Make scores
        scores.forEach(function(properties) {
          var link = document.createElement('a');
              link.href = '#';
              link.id = properties.id;
              link.className = properties.className;
              link.innerHTML = properties.innerHTML;
              link.number = properties.number;

          link.onclick = function(e) {
              e.preventDefault();
              e.stopPropagation();

              var wasActive = this.className == 'active'

              for (var i = 0; i < scorepicker.children.length; i++) {
                scorepicker.children[i].className = '';
              }

              map.setFilter('workspaces', ["all", [">=", ["length", ["get", "totalscore"]], this.number], defaultFilter]);
              this.className = 'active';
            }
          scorepicker.appendChild(link);
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
            "<div class='name'>{{name}} {{totalscore}}</div>" +
            "<div class='type'>A {{type}} near {{location}}. {{#url}}<a href='{{url}}' class='url'>Website ➪</a>{{/url}}</div>" +
            //"<tr><td>Open {{opening_hours}}</td></tr>" +
            "<table class='infotable heading' style='float: left;'><tbody>" +
            "<tr><th class='tooltip'>Accessibility<span class='tooltiptext'>Is the entrance or usage free? Can you bring belongings inside?</span></th><td class='table_score'>{{accessibility_score}}</td><td class='table_explanation'>{{accessibility}}</td></tr>" +
            "<tr><th class='tooltip'>Vibe<span class='tooltiptext'>How calm is it? Can you work without being distrubed? Would you trust leaving your desk and belongings to go for a short walk?</span></th><td class='table_score'>{{vibe_score}}</td><td class='table_explanation'>{{vibe}}</td></tr>" +
            "<tr><th class='tooltip'>Food<span class='tooltiptext'>Are there some kind of food, drinks or snacks available?</span></th><td class='table_score'>{{food_score}}</td><td class='table_explanation'>{{food}}</td></tr>" +
            "<tr><th class='tooltip'>Furniture<span class='tooltiptext'>Are the tables and chairs comfortable? Abundant? Is there enough (natural) light?</span></th><td class='table_score'>{{furniture_score}}</td><td class='table_explanation'>{{furniture}}</td></tr>" +
            "<tr><th class='tooltip'>Technical<span class='tooltiptext'>Are there ample plugs? Is there a free, fast and stable wifi?</span></th><td class='table_score'>{{technical_score}}</td><td class='table_explanation'>{{technical}}</td></tr>" +
            "<tbody></table>" +
            "<div class='more'>{{#protip}}Protip here: {{protip}}<br>{{/protip}} {{#opening_hours}}Opening hours: {{opening_hours}}{{/opening_hours}}</div>"
            , properties);
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