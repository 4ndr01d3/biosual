function getURLParameter(name) {
    return decodeURIComponent(
        (location.search.match(RegExp("[?|&]"+name+'=(.+?)(&|$)'))||[,null])[1]
    );  
}
var proteins=getURLParameter("proteins");
var URLrequests=[];
if (proteins!=null && proteins!="null" && jQuery.trim(proteins)!=""){
	URLrequests=proteins.split(",");
}
var coreURL=getURLParameter("core");
if (coreURL!=null && coreURL!="null" && jQuery.trim(coreURL)!=""){
	server += coreURL+"/";
}