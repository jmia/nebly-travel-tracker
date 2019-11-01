$(document).ready( function () {
    // Global variables
    var map;
    
    // Setup jQuery DataTables
    $('#mapTable').DataTable();
    
    // Setup Bing Maps
    function loadMapScenario() {
        map = new Microsoft.Maps.Map(document.getElementById('bingMap'), {});
    }

    $(window).on('load', function() {
        loadMapScenario();
    });
    
} );