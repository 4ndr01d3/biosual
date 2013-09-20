function getURLParameter(name) {
    return decodeURIComponent(
        (location.search.match(RegExp("[?|&]"+name+'=(.+?)(&|$)'))||[,null])[1]
    );  
}
function includeProteinsFromURLParameter(array,parameter,type){
	var proteins=getURLParameter(parameter);
	if (proteins!=null && proteins!="null" && jQuery.trim(proteins)!=""){
		var prs=proteins.split(",");
		for (var i=0;i<prs.length;i++){
			array.push({"id":prs[i],"type":type});
		}
	}
}
var URLrequests=[];
includeProteinsFromURLParameter(URLrequests,"proteins","normal");
includeProteinsFromURLParameter(URLrequests,"prtNor","normal");
includeProteinsFromURLParameter(URLrequests,"prtExp","explicit");
includeProteinsFromURLParameter(URLrequests,"prtExt","extended");

var coreURL=getURLParameter("core");
if (coreURL!=null && coreURL!="null" && jQuery.trim(coreURL)!="")
	server += coreURL+"/";

var model=[],
	mainfields=["p1","p1_organism","p2","p1_organism","score"],
	prefix=["p1_",false,"p2_",false,"score_"];

var callback = function (response) {
	for (var i=0;i<mainfields.length;i++) {
		var subfields=[];
		if (prefix[i]==="")
			for (var field in response.fields) {
				if (mainfields.indexOf(field)==-1 && prefix.indexOf(field.substring(0,3))==-1 && response.fields[field].type!="text_ws")
					subfields.push(field);
			}
		else
			for (var field in response.fields) {
				if (prefix[i] !=false && field.indexOf(prefix[i])!=-1 && response.fields[field].type!="text_ws")
					subfields.push(field);
			}
		if (subfields.length>0)
			model.push({
				"id":mainfields[i],
				"label":mainfields[i],
				"subcolumns":subfields
			});
		else
			model.push({
				"id":mainfields[i],
				"label":mainfields[i]
			});
	}
};

var modelrequester=jQuery.getJSON(server+ 'admin/luke?wt=json&numTerms=0&Explicit=True&json.wrf=?');
modelrequester.done(callback);
