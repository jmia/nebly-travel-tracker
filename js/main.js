$(document).ready( function () {
    // Global variables
    var map;

    getAllLocations().then( (data) => configureDataTables(data) );

    $(window).on('load', function() {
        loadMapScenario();
    });
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bingMap'), {});
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

    // Setup DataTables
    function configureDataTables(dataSet) {

        // TODO: Notes set to be in 'additional info' under the plus sign
        // TODO: Something prettier with the status column

        $('#mapTable').DataTable( {
            responsive: true,
            searching: false,
            pageLength: 5,
            lengthChange: false,
            data: dataSet,
            columns: [
                { data: 'location' },
                { data: 'locationType',
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);
                    } 
                },
                { data: 'notes' },
                { data: 'dateVisited' },
                { data: 'status',
                    render: function(data, type, row) {
                        return data.substr(0,1).toUpperCase()+data.substr(1);
                    }  
                }
            ],
            "createdRow": function( row, data, dataIndex, cells ) {
                if ( data["status"] == "visited" ) {
                  $(cells[4]).addClass( 'table-success' );
                }
                else if ( data["status"] == "not visited" ) {
                    $(cells[4]).addClass( 'table-warning' );
                  }
              }
        } );
    }

} );