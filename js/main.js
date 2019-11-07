// As of now, missing requirements are:
// - Quick-add location by clicking. This feature turned out to be very messy to implement with mobile. It was abandoned.
// - Colour coding legend. I still want to build this, but it completely disrupts the minimalist layout and needs more work.
// - Responsive cards. Again, I still want to build this. Implementing this app with DataTables has taught me that while 
//      dynamically generating a table from an Ajax call is slick, it doesn't leave a lot of room for outside-the-box customization. 
// - Adding countries. Bing Maps API has reported that polygon data for broad entity types are unreliable. 
//      To keep the app looking smooth, these were factored out, and I kept states & provinces instead.

// This was a very tiny app that gave me loads of experience configuring plugins, debugging PHP, and learning about async functions.
// Looking forward to building this out a bit more if I can find the time.

// j.m.i-a.

$(document).ready( function () {
    // Global variables
    var map;

    // INITIAL CONFIG ===============================================

    // Load map, form, and datatable when DOM finishes rendering
    $(window).on('load', function() {
        loadMapScenario();
        configureForm();
        configureDataTables();

        // Run a check on device width when it changes to trigger some custom responsive jQuery
        var mediaMatch = window.matchMedia("(max-width: 576px)")
        adjustMobileSettings(mediaMatch)
        mediaMatch.addListener(adjustMobileSettings)
    });

    // Setup DataTables
    function configureDataTables() {

        $('#map-table').DataTable( {
            responsive: true,                           // Adds responsive breakpoints
            searching: false,
            order: [[ 1, 'asc' ], [ 3, 'asc' ]],        // Sorts by name, then date
            pageLength: 5,
            lengthChange: false,
            ajax: {                                     // Data source for table from back end
                url: './php/backend.php',
                data: {
                    action: 'getAllLocations'
                },
                dataSrc: ''
            },
            columns: [                                  // Define order, sorting, rendering
                {                                       // & responsive show/hide priority of all columns
                    responsivePriority: 1,
                    className: 'details-control',
                    orderable:      false,
                    data:           null,
                    defaultContent: ''
                },
                { 
                    data: 'location',
                    responsivePriority: 2,
                    className: 'all' },
                { 
                    data: 'notes',
                    className: 'none' },
                { 
                    data: 'dateVisited',
                    type: 'date',
                    responsivePriority: 5 
                },
                { 
                    data: 'status',
                    responsivePriority: 4,
                    render: function(data, type, row) {
                        if (row.status == "visited") {
                            return '<i class="fas fa-check-square"></i>';   // Shows checkbox if visited
                        } else {
                            return '';
                        }
                    }  
                },
                {
                    responsivePriority: 3,                                  // Creates static buttons for edit/delete
                    render: function ( data, type, row ) {                  // tied to location ID
                        var deleteButtonId = "delete-id-"+row.id;
                        var editButtonId = "edit-id-"+row.id;
                        return '<button id='+deleteButtonId+' class="btn btn-sm btn-danger delete-button"><i class="fas fa-trash"></i></button> '+
                        '<button id='+editButtonId+' data-toggle="modal" data-target="#location-modal" data-action="edit" data-id='+row.id+' class="btn btn-sm btn-primary edit-button"><i class="fas fa-edit"></i></button>';
                    }
                }
            ]
        } );

    }

    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {
            center: new Microsoft.Maps.Location(50.104638, -100.933507),    // Somewhere in Alberta to center the map on NA
            zoom: 3,
        });
    }

    // EVENT HANDLERS ===============================================

    // Pop delete alert
    $(document).on('click', '.delete-button', function () {
        var id = this.id.replace(/delete-id-/, '');
        if (confirm("Are you sure you want to delete this entry?")) {
            deleteLocation(id);
        }
    });

    // Configure modal to work for both edit & add
    $('#location-modal').on('show.bs.modal', function (event) {
        let button = $(event.relatedTarget); // Button that triggered the modal
        let action = button.data('action');

        if (action == 'edit') {
            let id = button.data('id');

            // Get a location from database and fill form with current values
            try {
                $.get('./php/backend.php',
                        { action: 'getLocationById',
                            id: id },
                function (data) {
                    data = jQuery.parseJSON(data);
                    data = data[0];
                    $('#entry-id').val(id);
                    $('#location-name').val(data['location']);
                    $('#date-visited').val(data['dateVisited']);
                    $('#notes').val(data['notes']);
                    if (data['status'] == 'not visited') {
                        $("input[name=status][value='not-visited']").prop("checked", true);
                    } else {
                        $("input[name=status][value='visited']").prop("checked", true);
                    }
                    // Manually fire the status event to disable the date field if applicable
                    $("input[name=status]").trigger('change');
                    
                    $('.modal-title').text('Update a Destination');
                    $('#submit-location-button').text('Update');
                });
            } catch (error) {
                console.error(error);
            }
        }

    });

    // Clear the form anytime the modal closes (submit or cancel)
    $('#location-modal').on('hidden.bs.modal', function (e) {
        clearForm();
    })

    // Redraw the map whenever the data table reloads (i.e. after each Ajax success)
    $('#map-table').on('xhr.dt', function (e, settings, json, xhr) {
        getLocationBoundaries(json);
    });

    // Setup default state of modal form
    function configureForm() {

        // Disable the date field if location is marked 'not visited'
        $('input[name=status]').on('change', function() {
            let status = $('input[name=status]:checked', '#location-form').val();
            if (status == 'not-visited') {
                $('#date-visited').prop('disabled', true).val('');
            } else {
                $('#date-visited').prop('disabled', false);
            }
        });

        // Add form submission functionality
        $('#location-form').on('submit', function(event) {
            // If an ID exists, it's an edit request
            let id = $('#entry-id').val();
            if (id != "") {
                editLocation(id);
            } else {
                addNewLocation();
            }
            $('#location-modal').modal('hide');
            event.preventDefault();
        });
    }

    // HELPER METHODS ===============================================

    // Add/remove some custom responsive classes
    function adjustMobileSettings(mediaMatch) {
        if (mediaMatch.matches) { // If media query matches (i.e. mobile device view)
          $('#add-button-container').addClass('fixed-bottom p-3');          // Make button sticky at bottom
          $('#map-table-container').addClass('mb-5');                       // Give room under table on mobile for pagination
          map.setOptions({                                                  // Prevent user panning map, zoom out slightly
              zoom: 2,
              disablePanning: true
          });
        } else {
            $('#add-button-container').removeClass('fixed-bottom');
            $('#map-table-container').removeClass('mb-5');
            map.setOptions({
                zoom: 3,
                disablePanning: false
            });
        }
      }

    // Reset the modal form to empty values
    function clearForm() {
        $('#entry-id').val('');
        $('#location-name').val('');
        $("input[name=status][value='not-visited']").prop("checked", true).trigger('change');
        $('#date-visited').val('');
        $('#notes').val('');
        $('.modal-title').text('Add a Destination');
        $('#submit-location-button').text('Add');
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

    // CRUD FUNCTIONALITY ===========================================

    // Create new location
    function addNewLocation() {
        let formData = $( "#location-form" ).serializeObject();
        $.post('./php/backend.php',
        { action: 'addNewLocation',
            form: formData },
        
        function (data) {
            $('#map-table').DataTable().ajax.reload();
        });
    }

    // Update location by ID
    function editLocation(id) {
        let formData = $( "#location-form" ).serializeObject();
        $.post('./php/backend.php',
        { action: 'updateLocation',
            form: formData,
            id: id },
        
        function (data) {
            $('#map-table').DataTable().ajax.reload();
        });
    }

    // Delete location by ID
    function deleteLocation(id) {
        $.post('./php/backend.php',
        { action: 'deleteLocation',
            id: id },

        function (data) {
            $('#map-table').DataTable().ajax.reload();
        });
    }

    // MAP API METHODS ==============================================
    
    // Get polygons to render states & provinces on the map
    function getLocationBoundaries(locationData) {
        map.entities.clear();

        // Locations must be split to colour code the results
        var visitedLocations = [];
        var unvisitedLocations = [];

        // Extract unique location names and divide by status
        for (var i = 0; i < locationData.length; i++) {

            if (locationData[i]["status"] == "not visited") {
                if (!(unvisitedLocations.includes(locationData[i]["location"]))) {
                    unvisitedLocations.push(locationData[i]["location"]);
                }
            } else {
                if (!(visitedLocations.includes(locationData[i]["location"]))) {
                    visitedLocations.push(locationData[i]["location"]);
                }
            }
        }

        //Create an array of locations to get the boundaries of
        var geoDataRequestOptions = {
            entityType: 'AdminDivision1',
            getAllPolygons: false
        };

        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialDataService', function () {
            
            // Set colour for not visited locations
            var polygonStyle = {
                fillColor: 'rgba(255,255,0,0.4)',
                strokeColor: '#aa6c39',
                strokeThickness: 2
            };
            //Use the GeoData API manager to get the boundary
            Microsoft.Maps.SpatialDataService.GeoDataAPIManager.getBoundary(unvisitedLocations, geoDataRequestOptions, map, function (data) {
                if (data.results && data.results.length > 0) {
                    map.entities.push(data.results[0].Polygons);
                }
            }, polygonStyle, function errCallback(callbackState, networkStatus, statusMessage) {
                console.log(callbackState);
                console.log(networkStatus);
                console.log(statusMessage);
            });

            // Set colour for visited locations
            // var polygonStyle = {
            //     fillColor: 'rgba(161,224,255,0.4)',
            //     strokeColor: '#a495b2',
            //     strokeThickness: 2
            // };
            //Use the GeoData API manager to get the boundary
            Microsoft.Maps.SpatialDataService.GeoDataAPIManager.getBoundary(visitedLocations, geoDataRequestOptions, map, function (data) {
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



} );