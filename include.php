<?php

$mandatoryWeb	= array('http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js',
						'http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.min.js');
$mandatoryLocal	= array('lib/ajax-solr/core/Core.js',
						'lib/ajax-solr/core/AbstractManager.js',
						'lib/ajax-solr/core/Parameter.js',
						'lib/ajax-solr/core/ParameterStore.js',
						'lib/ajax-solr/core/AbstractWidget.js',
						'lib/ajax-solr/core/AbstractFacetWidget.js',
						'lib/ajax-solr/core/AbstractTextWidget.js',
						'lib/ajax-solr/managers/Manager.jquery.js',
						'lib/ajax-solr/helpers/ajaxsolr.support.js',
						'lib/ajax-solr/helpers/jquery/ajaxsolr.theme.js',
						'lib/ajax-solr/helpers/ajaxsolr.theme.js',
						'lib/ajax-solr/widgets/jquery/PagerWidget.js',

						'lib/autocomplete/jquery.autocomplete.js',
						'lib/jquery.livequery.js');

$cssWeb		=array();
$cssLocal	=array(	'css/jquery-ui.css',
					'css/ui.theme.css',
					'lib/autocomplete/jquery.autocomplete.css'
);

if ($_GET['id'] != ''){
	//TODO: replace for a config JSON Handler
	$myFile = "MDC_files/".$_GET['id'].".json";
	$fh = fopen($myFile, 'r');
	$theData = fread($fh, filesize($myFile));
	$json = json_decode($theData);
	fclose($fh);
}else {
	echo "ERROR: parameter id is mandatory";
	return;
}
function getUrl($url)
{
    $ch = curl_init(); 
    $timeout = 5; // set to zero for no timeout 
    curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout); 
    curl_setopt ($ch, CURLOPT_URL, $url); 
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1); 
    curl_setopt($ch, CURLOPT_PROXY, "http://127.0.0.1"); //your proxy url
    curl_setopt($ch, CURLOPT_PROXYPORT, "3128"); // your proxy port number 
//    curl_setopt($ch, CURLOPT_PROXYUSERPWD, "SLZGUS001:Str33tSp1r1tCT"); //username:pass 
    $file_contents = curl_exec($ch); 
    curl_close($ch); 
    return $file_contents;
}

switch ($_GET['type']){
	case "json":
		Header("content-type: application/json");
		echo $theData;
		break;
	case "js":
		Header("content-type: application/x-javascript");
		foreach ($mandatoryWeb as $url) {
			echo getUrl($url);
			echo "\n\n";
		}
		foreach ($mandatoryLocal as $path){
			$fh = fopen($path, 'r');
			echo fread($fh, filesize($path));
			echo "\n";
		}
		$widgetsScriptsAdded =array();
		
		foreach ($json as $widgetObj){
			$path="widgets/".$widgetObj->widget.".js";
			if (file_exists($path) && !in_array($path,$widgetsScriptsAdded)){
				$fh = fopen($path, 'r');
				echo fread($fh, filesize($path));
				echo "\n\n";
				array_push($widgetsScriptsAdded,$path);
			}
		}
		
		echo "var json = ".$theData.";\n\n";
		
		//TODO: this file reuters.theme.js is just for the reuters example the widgets should have a metadata file describing dependencies
		$fh = fopen("tests/reuters/reuters.theme.js", 'r');
		echo fread($fh, filesize("tests/reuters/reuters.theme.js"));
		echo "\n\n";
		
		$fh = fopen("core/loader.js", 'r');
		echo fread($fh, filesize("core/loader.js"));
		echo "\n\n";
		
		break;
	default:
		echo "ERROR: type non-valid (".$_GET['type'].")";
	case "css":
		Header("content-type: text/css");
		foreach ($cssWeb as $url) {
			echo getUrl($url);
			echo "\n\n";
		}
		foreach ($cssLocal as $path){
			$fh = fopen($path, 'r');
			echo fread($fh, filesize($path));
			echo "\n";
		}
		//TODO: this file reuters.theme.js is just for the reuters example the widgets should have a metadata file describing dependencies
		$fh = fopen("tests/reuters/reuters.css", 'r');
		echo fread($fh, filesize("tests/reuters/reuters.css"));
		echo "\n\n";
		break;
}

?>