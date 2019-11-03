$(document).ready( function () {
    // Global variables
    var map;

    // Asynchronously grab database information to populate data table
    getAllLocations().then( (data) => configureDataTables(data) );

    // Add form submission functionality
    $('#add-location-form').submit(function () {
        addNewLocation();
        event.preventDefault();
    });

    // Load map after DOM is loaded
    $(window).on('load', function() {
        loadMapScenario();
    });
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bing-map'), {});
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
    function configureDataTables(dataSet) {

        // TODO: Notes set to be in 'additional info' under the plus sign
        // TODO: Something prettier with the status column

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