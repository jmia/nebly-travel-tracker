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

if($_REQUEST["action"] == "addNewLocation") {
    $form = $_REQUEST["form"];
    
    $locationName = $form["location-name"];
    $type = $form["location-type"];
    $date = $form["date-visited"];
    $status = $form["status"] == "not-visited" ? "not visited" : "visited";     // Remove the hyphen from not-visited
    $notes = $form["notes"];

    $insertCommand = "INSERT INTO $table_name (`location`, `location_type`, `date_visited`, `status`, `notes`) VALUES (?,?,?,?,?)";
    $insertStmt = $conn->prepare($insertCommand);
    $params = [$locationName, $type, $date, $status, $notes];
    $insertSuccess = $insertStmt->execute($params);

    if ($insertSuccess) {
        echo 1;
    } else {
        echo 0;
    }

}

?>