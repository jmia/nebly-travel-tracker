$(document).ready( function () {
    // Global variables
    var map;

    // Asynchronously grab database information to populate data table
    getAllLocations()
        .then( (data) => configureDataTables(data) )
        .then( (data) => getLocationBoundaries(data) );
    configureForm();

    // Load map when DOM finishes rendering
    $(window).on('load', function() {
        loadMapScenario();
    });

    // Send form data to add new location to table
    function addNewLocation() {
        var formData = $( "#add-location-form" ).serializeObject();
        console.log(formData);
        $.post('./php/backend.php',
        { action: 'addNewLocation',
            form: formData },
        
        function (data) {
            console.log(data);

        });
    }

    // Setup DataTables
    async function configureDataTables(dataSet) {

        // TODO: Notes set to be in 'additional info' under the plus sign
        // TODO: Something prettier with the status column

        console.log(dataSet);

        $('#map-table').DataTable( {
            responsive: true,
            pageLength: 5,
            lengthChange: false,    // Prevents user-defined page lengths
            data: dataSet,
            columns: [
                { data: 'location' },
                { data: 'locationType',
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);   // Capitalizes first word
                    } 
                },
                { data: 'notes' },
                { data: 'dateVisited' },
                { data: 'status',
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);   // Capitalizes first word
                    }  
                }
            ],
            "createdRow": function( row, data, dataIndex, cells ) {             // Dynamic highlighting
                if ( data["status"] == "visited" ) {
                  $(cells[4]).addClass( 'table-success' );
                }
                else if ( data["status"] == "not visited" ) {
                    $(cells[4]).addClass( 'table-warning' );
                  }
              }
        } );

        return dataSet;
    }

    // Setup default state of add location form
    function configureForm() {

        // TODO: Hide date visited form input if status is 'not visited'
        // TODO: Success message on page refresh, localStorage?

        // Add form submission functionality
        $('#add-location-form').submit(function () {
            addNewLocation();
            //$('#map-table').DataTable().ajax.reload();    // using this causes data to appear in url & null data param
            document.location.reload();
            $('#add-location-modal').modal('hide');
            event.preventDefault();
        });
        // Set dropdown list to deselected to force user to choose
        $("#location-type").prop("selectedIndex", -1);
    }
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {
            zoom: 3
        });
    }

    // Retrieve pre-populated data from server
    async function getAllLocations() {
        let result; 
        try {
            result = await $.get('./php/backend.php',
                        { action: 'getAllLocations' });
            return jQuery.parseJSON(result);
        } catch (error) {
            console.error(error);
        }
    }

    function getLocationBoundaries(dataSet) {

        // TODO: Remove countries? Change relevant tables in database
        // TODO: Change colour of polygon based on status

        var countries = [];
        var statesAndProvinces = [];

        for (var i = 0; i < dataSet.length; i++) {
            if (dataSet[i]["locationType"] == "country") {
                countries.push(dataSet[i]["location"]);
            } else {
                statesAndProvinces.push(dataSet[i]["location"]);
            }
        }

        console.log(countries);
        console.log(statesAndProvinces);

        //Create an array of locations to get the boundaries of
        var geoDataRequestOptions = {
            entityType: 'CountryRegion',
            getAllPolygons: false
        };
        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService', function () {
            //Use the GeoData API manager to get the boundary
            Microsoft.Maps.SpatialDataService.GeoDataAPIManager.getBoundary(countries, geoDataRequestOptions, map, function (data) {
                if (data.results && data.results.length > 0) {
                    map.entities.push(data.results[0].Polygons);
                }
            }, null, function errCallback(callbackState, networkStatus, statusMessage) {
                console.log(callbackState);
                console.log(networkStatus);
                console.log(statusMessage);
            });
        });

        //Create an array of locations to get the boundaries of
        var geoDataRequestOptions = {
            entityType: 'AdminDivision1',
            getAllPolygons: true
        };
        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService', function () {
            //Use the GeoData API manager to get the boundary
            Microsoft.Maps.SpatialDataService.GeoDataAPIManager.getBoundary(statesAndProvinces, geoDataRequestOptions, map, function (data) {
                if (data.results && data.results.length > 0) {
                    map.entities.push(data.results[0].Polygons);
                }
            }, null, function errCallback(callbackState, networkStatus, statusMessage) {
                console.log(callbackState);
                console.log(networkStatus);
                console.log(statusMessage);
            });
        });
    }

    /*!
    * jQuery serializeObject - v0.2 - 1/20/2010
    * http://benalman.com/projects/jquery-misc-plugins/
    * 
    * Copyright (c) 2010 "Cowboy" Ben Alman
    * Dual licensed under the MIT and GPL licenses.
    * http://benalman.com/about/license/
    */

    // Whereas .serializeArray() serializes a form into an array, .serializeObject()
    // serializes a form into an (arguably more useful) object.
    (function($,undefined){
        '$:nomunge'; // Used by YUI compressor.
    
        $.fn.serializeObject = function(){
        var obj = {};
    
        $.each( this.serializeArray(), function(i,o){
            var n = o.name,
            v = o.value;
    
            obj[n] = obj[n] === undefined ? v
                : $.isArray( obj[n] ) ? obj[n].concat( v )
                : [ obj[n], v ];
        });
    
        return obj;
        };
    
    })(jQuery);

} );