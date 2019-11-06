$(document).ready( function () {
    // Global variables
    var map, stuffINeed;

    $(document).on('click', '.delete-button', function () {
        var id = this.id.replace(/delete-id-/, '');
        if (confirm("Are you sure you want to delete this entry?")) {
            deleteLocation(id);
        }
    });

    // Configure modal to work for edit & add
    $('#location-modal').on('show.bs.modal', function (event) {
        let button = $(event.relatedTarget); // Button that triggered the modal
        let action = button.data('action');
        console.log(action);

        if (action == 'edit') {
            let id = button.data('id');

            // Why doesn't this get any data?
            getLocationById(id).then( (data) => function(data) {
                $('#entry-id').val(id);
                $('#location-name').val(data['location']);
                //$('#location-type').val(location['locationType']);
                // TODO: status
                $('#date-visited').val(data['dateVisited']);
                $('#notes').val(data['notes']);

                $('#submit-location-button').text('Update');
            });
        }

        });

    // Load map when DOM finishes rendering
    $(window).on('load', function() {
        loadMapScenario();
        configureForm();
        configureDataTables();
    });

    // Send form data to add new location to table
    function addNewLocation() {
        console.log("add called");
        let formData = $( "#location-form" ).serializeObject();
        console.log(formData);
        $.post('./php/backend.php',
        { action: 'addNewLocation',
            form: formData },
        
        function (data) {
            console.log(data);
        });
        $('#map-table').DataTable().ajax.reload();
    }

    function clearForm() {

    }

    // Setup DataTables
    function configureDataTables() {

        // TODO: Deprecate locationType
        // TODO: Change status to badges instead of cell highlight
        // TODO: Change 'delete' text to fontawesome icons

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
                { data: 'location',
                    className: 'all' },
                { data: 'locationType',
                    responsivePriority: 5,
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);   // Capitalizes first word
                    } 
                },
                { data: 'notes',
                    className: 'none' },    // No priority, should push to child row
                { data: 'dateVisited',
                    type: 'date',
                    responsivePriority: 3 
                },
                { data: 'status',
                    responsivePriority: 4,
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);   // Capitalizes first word
                    }  
                },
                { // uses ID for rendering edit & delete buttons
                    responsivePriority: 2,
                    render: function ( data, type, row ) {
                        var deleteButtonId = "delete-id-"+row.id;
                        var editButtonId = "edit-id-"+row.id;
                        return '<button id='+deleteButtonId+' class="btn btn-danger delete-button">Delete</button>'+
                        '<button id='+editButtonId+' data-toggle="modal" data-target="#location-modal" data-action="edit" data-id='+row.id+' class="btn btn-primary">Edit</button>';
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

        // Redraw the map whenever new Ajax calls are made
        $('#map-table').on('xhr.dt', function (e, settings, json, xhr) {
            getLocationBoundaries(json);
        });
    }

    // Setup default state of add location form
    function configureForm() {

        // Add form submission functionality
        $('#location-form').on('submit', function(event) {
            if ($('#entry-id').val() != "") {
                // Edit location
            } else {
                addNewLocation();
            }
            // Clear form (particularly ID)
            $('#location-modal').modal('hide');
            event.preventDefault();
        });

        // Set dropdown list to deselected to force user to choose
        $("#location-type").prop("selectedIndex", -1);
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

    }

    async function getLocationById(id) {
        let result; 
        try {
            result = await $.get('./php/backend.php',
                        { action: 'getLocationById',
                            id: id });
            console.log(result);
            return jQuery.parseJSON(result);
        } catch (error) {
            console.error(error);
        }
    }
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {
            center: new Microsoft.Maps.Location(45.7019294,-94.5174798,4.9),
            zoom: 3
        });
    }

    function getLocationBoundaries(dataSet) {
        map.entities.clear();

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