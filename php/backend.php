<?php
session_start();

// This script creates the global database connection object.
include 'connect.php';
$table_name = 'nebly_travel_tracker';

if($_REQUEST["action"] == "getAllLocations") {
    $result = array();
    $command = "SELECT * FROM $table_name";
    $stmt = $conn->prepare($command);
    $success = $stmt->execute();

    // location, location_type, date_visited, status, notes

    if($success) {
        while ($row = $stmt->fetch()) {
            $location = array(  "location"      => $row["location"], 
                                "locationType"  => $row["location_type"], 
                                "dateVisited"   => $row["date_visited"], 
                                "status"        => $row["status"], 
                                "notes"         => $row["notes"]);
            array_push($result, $location);
        }
        echo json_encode($result);
    } else {
        echo "ERROR";
    }
}

?>