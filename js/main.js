$(document).ready( function () {
    // Global variables
    var map;

    $(document).on('click', '.delete-button', function () {
        var id = this.id.replace(/delete-id-/, '');
        if (confirm("Are you sure you want to delete this entry?")) {
            deleteLocation(id);
        }
    });

    function adjustMobileSettings(x) {
        if (x.matches) { // If media query matches
          $('#add-button-container').addClass('fixed-bottom p-3');
          $('#map-table-container').addClass('mb-5');
          map.setOptions({
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

    // Configure modal to work for edit & add
    $('#location-modal').on('show.bs.modal', function (event) {
        let button = $(event.relatedTarget); // Button that triggered the modal
        let action = button.data('action');

        if (action == 'edit') {
            let id = button.data('id');

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
                    $("input[name=status]").trigger('change');
                    
                    $('.modal-title').text('Update a Destination');
                    $('#submit-location-button').text('Update');
                });
            } catch (error) {
                console.error(error);
            }
        }

    });

    $('#location-modal').on('hidden.bs.modal', function (e) {
        clearForm();
      })

    // Load map when DOM finishes rendering
    $(window).on('load', function() {
        loadMapScenario();
        configureForm();
        configureDataTables();

        var x = window.matchMedia("(max-width: 576px)")
        adjustMobileSettings(x) // Call listener function at run time
        x.addListener(adjustMobileSettings) // Attach listener function on state changes
    });

    // Send form data to add new location to table
    function addNewLocation() {
        let formData = $( "#location-form" ).serializeObject();
        $.post('./php/backend.php',
        { action: 'addNewLocation',
            form: formData },
        
        function (data) {
            console.log(data);
        });
        $('#map-table').DataTable().ajax.reload();
    }

    function clearForm() {
        $('#entry-id').val('');
        $('#location-name').val('');
        $("input[name=status][value='not-visited']").prop("checked", true).trigger('change');
        $('#date-visited').val('');
        $('#notes').val('');
        $('.modal-title').text('Add a Destination');
        $('#submit-location-button').text('Add');
    }

    // Setup DataTables
    function configureDataTables() {

        $('#map-table').DataTable( {
            responsive: true,
            searching: false,
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
                {
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
                    className: 'none' },    // No priority, should push to child row
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
                            return '<i class="fas fa-check-square"></i>';
                        } else {
                            return '';
                        }
                    }  
                },
                { // uses ID for rendering edit & delete buttons
                    responsivePriority: 3,
                    render: function ( data, type, row ) {
                        var deleteButtonId = "delete-id-"+row.id;
                        var editButtonId = "edit-id-"+row.id;
                        return '<button id='+deleteButtonId+' class="btn btn-sm btn-danger delete-button"><i class="fas fa-trash"></i></button> '+
                        '<button id='+editButtonId+' data-toggle="modal" data-target="#location-modal" data-action="edit" data-id='+row.id+' class="btn btn-sm btn-primary edit-button"><i class="fas fa-edit"></i></button>';
                    }
                }
            ]
        } );

        // Redraw the map whenever new Ajax calls are made
        $('#map-table').on('xhr.dt', function (e, settings, json, xhr) {
            getLocationBoundaries(json);
        });

        $('#map-table tbody').on('click', 'td.details-control', function () {
            var tr = $(this).closest('tr');
            var row = table.row( tr );
     
            if ( row.child.isShown() ) {
                // This row is already open - close it
                row.child.hide();
                tr.removeClass('shown');
            }
            else {
                // Open this row
                row.child( format(row.data()) ).show();
                tr.addClass('shown');
            }
        } );
    }

    // Setup default state of add location form
    function configureForm() {

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

    function deleteLocation(id) {
        $.post('./php/backend.php',
        { action: 'deleteLocation',
            id: id },

        function (data) {
            console.log(data);
        });
        $('#map-table').DataTable().ajax.reload();
    }

    function editLocation(id) {
        let formData = $( "#location-form" ).serializeObject();
        $.post('./php/backend.php',
        { action: 'updateLocation',
            form: formData,
            id: id },
        
        function (data) {
            console.log(data);
        });
        $('#map-table').DataTable().ajax.reload();
    }
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {
            center: new Microsoft.Maps.Location(50.104638, -100.933507),
            zoom: 3,
        });
    }

    function getLocationBoundaries(locationData) {
        map.entities.clear();

        // Locations must be split to colour code the results
        var visitedLocations = [];
        var unvisitedLocations = [];

        // Extract unique location names by status
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