<?php

include_once 'server/JsonHandler.inc.php';
include_once 'server/Widget.inc.php';

$mandatoryWeb	= array();
$mandatoryLocal	= array('lib/jquery-1.7.2.min.js',
						'lib/jquery-ui-1.8.2.custom.min.js',
						'lib/ajax-solr/core/Core.js',
						'lib/ajax-solr/core/AbstractManager.js',
						'lib/ajax-solr/core/Parameter.js',
						'lib/ajax-solr/core/ParameterStore.js',
						'lib/ajax-solr/core/AbstractWidget.js',
						'lib/ajax-solr/core/AbstractFacetWidget.js',
						'lib/ajax-solr/core/AbstractTextWidget.js',
						'lib/ajax-solr/managers/Manager.jqueryQueue.js',
						'lib/ajax-solr/helpers/ajaxsolr.support.js',
						'lib/ajax-solr/helpers/jquery/ajaxsolr.theme.js',
						'lib/ajax-solr/helpers/ajaxsolr.theme.js',
						'lib/biojs/main/javascript/Biojs.js'
);

$cssWeb		=array();
$cssLocal	=array(	'css/jquery-ui.css',
					'css/ui.theme.css');
$addedFilesMD5	=array();


$MDCpath="MDC_files/";
if ($_GET['id'] != ''){
	$filename=$MDCpath.$_GET['id'].".json";
	if (!file_exists($filename)){
		$MDCpath="MDC_files/".$_GET['id']."/";
		$filename=$MDCpath.$_GET['id'].".json";
	}
	if (!file_exists($filename)){
		echo "ERROR: There is not a json file associated with the id ".$_GET['id'];
		return;
	}
	$theData = getFile($filename);
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

if ($_GET['test'] != '' && $_GET['test'] == 'true'){
	array_push($json->widgets, JsonHandler::decode('{	"widget": "QUnitWidget", "parameters": { "id": "qunit"}, "templateTarget":"center"}'));
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
		foreach ($mandatoryLocal as $path){
						
			echo "\n//".$path."\n".getFile($path,true);
		}
		
		//Adding utility functions 
		echo "//Utility functions\n".getFile("core/util.js",true);
		
		
		//Adding the template
		$path="templates/".$json->template->name."/markup.html";
		if (file_exists($path) ){
			$htmlT=str_replace("\n","",getFile($path,true));
			
			//replacing the tags of the template
			foreach ($json->template->tags as $key => $value)
				$htmlT=str_replace("{".$key."}",$value,$htmlT);

			echo "\nvar htmlTemplate = '".$htmlT."';\n"; //the HTML content as a JS variable
			echo "\nvar target = '".$_GET['target']."';\n"; // the target div as a JS variable
			
			echo getFile("core/templateLoader.js",true);
		}
		
		//Adding the dependencies included in the MDC json
		if (isset($json->js) && $json->js!=null)
			foreach ($json->js as $dependency)
				if (strlen(trim($dependency))>0 && file_exists($MDCpath.$dependency))
					echo getFile($MDCpath.$dependency);
			
		//Adding the widgets JSs
		$widgetsScriptsAdded =array();
		foreach ($json->widgets as $widgetObj){
			try{
				echo "\n//-WIDGET: ".$widgetObj->widget;
				$widget= new Widget($widgetObj);
				echo "\n//-1: ".$widgetObj->widget;
				if (!in_array($widgetObj->widget,$widgetsScriptsAdded)){
					echo "\n//Dependencies for WIDGET: ".$widget->id."\n".$widget->getDependenciesText()."\n";
					echo "\n//WIDGET: ".$widget->id."\n".$widget->getJavaScriptText()."\n";
					array_push($widgetsScriptsAdded,$widgetObj->widget);
				}
				echo "\n//-2: ".$widgetObj->widget;
				echo "\n//Injecting HTML for WIDGET: ".$widget->id."\n".$widget->getHTMLinjector()."\n";
				//TODO: add Markup to the page
			} catch(Exception $e) {
				echo "\n//Error loading the widget: ".$widgetObj->widget."\n";
			}
		}
		
		
		//creating a variable with the json to be read inside the JS
		echo "var json = ".json_encode($json->widgets).";\n";
		echo "var params = ".json_encode($json->ajaxsolr_parameters).";\n\n";
		echo "var server = ".json_encode($json->server).";\n";
		if ($json->servlet) echo "var servlet = ".json_encode($json->servlet).";\n";
		echo "var events = ".json_encode($json->events).";\n";
		
		echo "//pre-loader script".$json->preloader;
		if (isset($json->preloader) && $json->preloader!=null && strlen(trim($json->preloader))>0 && file_exists($MDCpath.$json->preloader))
			echo getFile($MDCpath.$json->preloader,true);
			
		//Adding the AJAX SOLR manager and configuring all the widgets 
		echo "//Manager loader\n".getFile("core/loader.js",true);

		if (isset($json->postloader) && $json->postloader!=null && strlen(trim($json->postloader))>0 && file_exists($MDCpath.$json->postloader))
			echo "//postloader script\n".getFile($MDCpath.$json->postloader);
		//		echo "//Event Manager\n".getFile("core/eventManager.js");
		
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

function getFile($path,$forcetoAdd=false){
	global $addedFilesMD5;
	if (file_exists($path)){
		$fh = fopen($path, 'r');
		$content = "\n".fread($fh, filesize($path))."\n";
		$md5 =md5($content);
		if (!$forcetoAdd && in_array($md5,$addedFilesMD5))
			return "// The content of [".$path."] has been already added to the script";
		$addedFilesMD5[] =$md5;
		fclose($fh);
		return $content;
	}
	return false;
}
?>