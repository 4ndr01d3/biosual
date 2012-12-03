<?php

include_once 'server/JsonHandler.inc.php';
include_once 'server/Widget.inc.php';

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
						'lib/ajax-solr/helpers/ajaxsolr.theme.js');

$cssWeb		=array();
$cssLocal	=array(	'css/jquery-ui.css',
					'css/ui.theme.css');
$atvarsity=true;

if ($_GET['id'] != ''){
	$theData = getFile("MDC_files/".$_GET['id'].".json");
	try {
	    $json = JsonHandler::decode($theData);
	} catch(Exception $e) {
		echo "ERROR: JSON cant be decoded.";
		echo "Caught " . $e->getMessage();
		return;
	}	
}else {
	echo "ERROR: parameter id is mandatory";
	return;
}


switch ($_GET['type']){
	case "json":
		Header("content-type: application/json");
		echo $theData;
		break;
		
	case "js":
		Header("content-type: application/x-javascript");
		
		//Adding all the mandatory dependencies that are Web based
		foreach ($mandatoryWeb as $url) 
			echo "\n//".$url."\n".getUrl($url)."\n";

		//Adding all the mandatory dependencies that are local files
		foreach ($mandatoryLocal as $path)
			echo "\n//".$path."\n".getFile($path);

		//Adding the template
		$path="templates/".$json->template->name."/markup.html";
		if (file_exists($path) ){
			$htmlT=str_replace("\n","",getFile($path));
			
			//replacing the tags of the template
			foreach ($json->template->tags as $key => $value)
				$htmlT=str_replace("{".$key."}",$value,$htmlT);

			echo "\nvar htmlTemplate = '".$htmlT."';\n"; //the HTML content as a JS variable
			echo "\nvar target = '".$_GET['target']."';\n"; // the target div as a JS variable
			
			echo getFile("core/templateLoader.js");
		}
		
		//Adding the dependencies included in the MDC json
		foreach ($json->js as $dependency)
			echo getFile($dependency);
			
		//Adding the widgets JSs
		$widgetsScriptsAdded =array();
		foreach ($json->widgets as $widgetObj){
			try{
//				echo "\n//WIDGET: ".$widgetObj->widget;
				$widget= new Widget($widgetObj);
				echo "\n//Dependencies for WIDGET: ".$widget->id."\n".$widget->getDependenciesText()."\n";
				echo "\n//Injecting HTML for WIDGET: ".$widget->id."\n".$widget->getHTMLinjector()."\n";
				echo "\n//WIDGET: ".$widget->id."\n".$widget->getJavaScriptText()."\n";
				//TODO: add Markup to the page
			} catch(Exception $e) {
				//TODO: convert all the widgets to the new format
				$path="widgets/".$widgetObj->widget.".js";
//				echo "\n//WIDGET: ".$path;
				
				if (file_exists($path) && !in_array($path,$widgetsScriptsAdded)){
					echo "\n//WIDGET:".$widgetObj->widget."\n".getFile($path);
					array_push($widgetsScriptsAdded,$path);
				}
			}
		}
		
		//creating a variable with the json to be read inside the JS
		echo "var json = ".json_encode($json->widgets).";\n\n";
		
		
		//Adding the AJAX SOLR manager and configuring all the widgets 
		echo "//Manager loader\n".getFile("core/loader.js");
		
		break;
		
	case "css":
		Header("content-type: text/css");
		//Adding Web dependencies
		foreach ($cssWeb as $url) 
			echo "\n".getUrl($url)."\n";

			//Adding Local dependecies
		foreach ($cssLocal as $path)
			echo getFile($path);
			
		//Adding the template
		$path="templates/".$json->template->name."/style.css";
		if (file_exists($path) )
			echo getFile($path);
		
		$widgetsScriptsAdded =array();
		foreach ($json->widgets as $widgetObj){
			try{
				$widget= new Widget($widgetObj);
				echo "\n/*Dependencies for WIDGET: ".$widget->id."*/\n".$widget->getDependenciesCSS()."\n";
				echo "\n/*WIDGET: ".$widget->id."*/\n".$widget->getCssText()."\n";
			} catch(Exception $e) {
			}
		}
			
		foreach ($json->css as $dependency){
			echo getFile($dependency);
		}

		break;
		
	default:
		echo "ERROR: type non-valid (".$_GET['type'].")";
}
function getUrl($url) {
    $ch = curl_init(); 
    $timeout = 5; // set to zero for no timeout 
    curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout); 
    curl_setopt ($ch, CURLOPT_URL, $url); 
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1); 
//    if($atvarsity){
	    curl_setopt($ch, CURLOPT_PROXY, "http://127.0.0.1"); //your proxy url
	    curl_setopt($ch, CURLOPT_PROXYPORT, "3128"); // your proxy port number
//    } 
    $file_contents = curl_exec($ch); 
    curl_close($ch); 
    return $file_contents;
}

function getFile($path){
	if (file_exists($path)){
		$fh = fopen($path, 'r');
		$content = "\n".fread($fh, filesize($path))."\n";
		fclose($fh);
		return $content;
	}
	return false;
}
?>