<?php
include_once 'JsonHandler.inc.php';

class Widget {
	function __construct($widget) {
		$this->id=$widget->widget;
		
		$this->templateTarget= $widget->templateTarget;
		$this->tags			= $widget->tags;
		
		
		$theData = getFile("widgets/".$this->id."/widget.json",true);
		if ($theData==false) throw new RuntimeException("JSON FILE couldn't be opened.");
		
		try {
			$json = JsonHandler::decode($theData);
		    $this->name 		= $json->name;
		    $this->description 	= $json->description;
		    $this->js			= $json->js;
		    $this->dependencies	= $json->dependencies;
		    $this->dependenciesCSS	= $json->dependenciesCSS;
		    $this->html			= $json->html;
		    $this->css			= $json->css;
		} catch(Exception $e) {
			throw new RuntimeException("JSON FILE corrupted. ".$e);
		}	
		
	}
	
	function getJavaScriptText(){
		$path="widgets/".$this->id."/".$this->js;
		echo "//PATH: ".$path;
		if (file_exists($path)){
			return getFile($path);
		}
		throw new RuntimeException("Javascript file(".$path.") couldnt be opened");
	}
	function getCssText(){
		if ($this->css==null) return "";
		$path="widgets/".$this->id."/".$this->css;
		if (file_exists($path)){
			return getFile($path);
		}
		throw new RuntimeException("CSS file(".$path.") couldnt be opened");
	}
	
	function getDependenciesText(){
		$text="\n";
		if ($this->dependencies!=null) foreach ($this->dependencies as $dependency){
			$path="widgets/".$this->id."/".$dependency;
			if (file_exists($path)){
				$text=$text."\n".getFile($path);
			}else
				throw new RuntimeException("Javascript file(".$path.") couldnt be opened");
		}
		return $text;
	}
	function getDependenciesCSS(){
		$text="\n";
		if ($this->dependenciesCSS!=null) foreach ($this->dependenciesCSS as $dependency){
			$path="widgets/".$this->id."/".$dependency;
			if (file_exists($path)){
				$text=$text."\n".getFile($path);
			}else
				throw new RuntimeException("Javascript file(".$path.") couldnt be opened");
		}
		return $text;
	}
	function getHTMLinjector(){
		$path="widgets/".$this->id."/".$this->html;
		if ($this->html==null || $this->html =="")
			return "//Not HTML file includedc in the JSON config file.";
		
		if (file_exists($path)){
			$html=str_replace("\n","",getFile($path,true));
			$html=str_replace("'","\"",$html);
			
			//replacing the tags 
			if ($this->tags!=null) foreach ($this->tags as $key => $value)
				$html=str_replace("{".$key."}",$value,$html);
			
			//$htmlT="var htmlTemplate = '".$htmlT."';\n";
			//$htmlT .= "var target='".$this->templateTarget."';\n";
			$htmlT = "(function ($) { \n";
			$htmlT .="	$(function () { \n";
			$htmlT .="		$('.".$this->templateTarget."').append('".$html."'); \n";
			$htmlT .="	}); \n";
			$htmlT .="})(jQuery);\n";
			return $htmlT;
		}
		throw new RuntimeException("HTML file(".$path.") couldnt be opened");
		
	}
}
?>