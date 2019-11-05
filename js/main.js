$(document).ready( function () {
    // Global variables
    var map;

    // Bugs
    // TODO: Clear form on submit
    // TODO: Make add location async
    // TODO: PHP backend returns object with error message
    // TODO: Handle 404 or timeout errors etc on console log in network requests (// TODO: Does the result contain an error?)
    // TODO: Push new entity to polygons list
    // TODO: Access data from table for polygons call

    // Must Have
    // TODO: Delete & Edit functionality (Do delete first) front & back
    // TODO: Edit & delete buttons on table
    // TODO: Edit modal & delete confirmation
    // TODO: Responsiveness (stack columns on small screen size)
    // TODO: Remove countries? Change relevant tables in database & columns on datatables
    // TODO: Hide date visited form input if status is 'not visited'
    // TODO: Prevent resize of map on pagination
    // TODO: Quick add a visited location by clicking the map
    // TODO: Customize colours of map legend

    // Ought to have
    // TODO: Change colour of polygon based on status
    // TODO: Clear form button
    
    
    // Nice to have
    // TODO: Notes set to be in 'additional info' under the plus sign
    // TODO: Something prettier with the status column
    // TODO: Success message on form submit, error message
    // TODO: Cards on small screen size
    // TODO: Logo
    // TODO: Store polygon information in session storage for quick DB access?

    // Load map when DOM finishes rendering
    $(window).on('load', function() {
        loadMapScenario();
        configureForm();
        configureDataTables();
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
    function configureDataTables() {
        $('#map-table').DataTable( {
            responsive: true,
            pageLength: 5,
            lengthChange: false,    // Prevents user-defined page lengths
            ajax: {
                url: './php/backend.php',
                data: {
                    action: 'getAllLocations'
                },
                dataSrc: ''
            },
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
                },
                { defaultContent: "<button>Edit</button> <button>Delete</button>" }
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

        $('#map-table').on('xhr.dt', function (e, settings, json, xhr) {
            console.log(json);
            getLocationBoundaries(json);
        });
    }

    // Setup default state of add location form
    function configureForm() {

        // Add form submission functionality
        $('#add-location-form').submit(function () {
            addNewLocation();
            //document.location.reload();
            $('#add-location-modal').modal('hide');
            $('#map-table').DataTable().ajax.reload();
            event.preventDefault();
        });
        // Set dropdown list to deselected to force user to choose
        $("#location-type").prop("selectedIndex", -1);
    }
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {
            center: new Microsoft.Maps.Location(45.7019294,-94.5174798,4.9),
            zoom: 3
        });
    }

    // // Retrieve pre-populated data from server
    // async function getAllLocations() {
    //     let result; 
    //     try {
    //         result = await $.get('./php/backend.php',
    //                     { action: 'getAllLocations' });
    //         return jQuery.parseJSON(result);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    function getLocationBoundaries(dataSet) {

        // Split entries into states & countries for separate entity types
        var countries = [];
        var statesAndProvinces = [];

        for (var i = 0; i < dataSet.length; i++) {
            if (dataSet[i]["locationType"] == "country") {
                countries.push(dataSet[i]["location"]);
            } else {
                statesAndProvinces.push(dataSet[i]["location"]);
            }
        }

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