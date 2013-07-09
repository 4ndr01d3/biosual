<? 

	// return text var_dump for the html request 
	header("Access-Control-Allow-Origin: *");
	header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
	header("Access-Control-Allow-Headers: *");
//	header("Access-Control-Allow-Headers: x-requested-with"); 
	header("Access-Control-Allow-Headers:accept, origin, content-type");
	echo "VAR DUMP:<p />"; 
	var_dump($_POST); 
	foreach($_FILES as $file) { 
		$n = $file['name']; 
		$s = $file['size']; 
		if (!$n) continue; 
		echo "File: $n ($s bytes)"; 
	} 
?>