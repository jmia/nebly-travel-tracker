<?php
try { 
$conn = new PDO("mysql:host=localhost;dbname=000750279", "000750279",   
 "***REMOVED***"); 
} catch (Exception $e) { 
die("ERROR: Couldn't connect. {$e->getMessage()}"); 
} 

// THIS IS A SECOND TEST

?>