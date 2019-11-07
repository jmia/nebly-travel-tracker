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

    if($success) {
        while ($row = $stmt->fetch()) {
            $location = array(  "location"      => $row["location"], 
                                "dateVisited"   => $row["date_visited"], 
                                "status"        => $row["status"], 
                                "notes"         => $row["notes"],
                                "id"            => $row["id"]);
            array_push($result, $location);
        }
        echo json_encode($result);
    } else {
        echo "ERROR";
    }
}

if($_REQUEST["action"] == "getLocationById") {
    $id = $_REQUEST["id"];

    $result = array();
    $command = "SELECT * FROM $table_name WHERE `id` = ?";
    $stmt = $conn->prepare($command);
    $params = [$id];
    $success = $stmt->execute($params);

    if ($success) {
        while ($row = $stmt->fetch()) {
            $location = array(  "location"      => $row["location"], 
                                "dateVisited"   => $row["date_visited"], 
                                "status"        => $row["status"], 
                                "notes"         => $row["notes"],
                                "id"            => $row["id"]);
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

    if (isset($form["date-visited"])) {
        if ($form["date-visited"] != "") {
            $date = $form["date-visited"];
        } else {
            $date = NULL;
        }
    } else {
        $date = NULL;
    }

    $status = $form["status"] == "not-visited" ? "not visited" : "visited";     // Remove the hyphen from not-visited
    $notes = $form["notes"];

    $command = "INSERT INTO $table_name (`location`, `date_visited`, `status`, `notes`) VALUES (?,?,?,?)";
    $stmt = $conn->prepare($command);
    $params = [$locationName, $date, $status, $notes];
    $success = $stmt->execute($params);

    if ($success) {
        echo "ADD SUCCESS";
    } else {
        echo "ERROR";
    }

}

if($_REQUEST["action"] == "updateLocation") {
    $form = $_REQUEST["form"];
    $id = $_REQUEST["id"];
    
    $locationName = $form["location-name"];
    
    if (isset($form["date-visited"])) {
        if ($form["date-visited"] != "") {
            $date = $form["date-visited"];
        }
    } else {
        $date = NULL;
    }
    
    $status = $form["status"] == "not-visited" ? "not visited" : "visited";     // Remove the hyphen from not-visited
    $notes = $form["notes"];

    $command = "UPDATE $table_name SET `location`=?, `date_visited`=?, `status`=?, `notes`=? WHERE `id`=?";
    $stmt = $conn->prepare($command);
    $params = [$locationName, $date, $status, $notes, $id];
    $success = $stmt->execute($params);

    if ($success) {
        echo "EDIT SUCCESS";
    } else {
        echo "ERROR";
    }
}

if($_REQUEST["action"] == "deleteLocation") {
    $id = $_REQUEST["id"];

    $command = "DELETE FROM $table_name WHERE `id` = ?";
    $stmt = $conn->prepare($command);
    $params = [$id];
    $success = $stmt->execute($params);

    if ($success) {
        echo "REMOVE SUCCESS";
    } else {
        echo "ERROR";
    }
}



?>