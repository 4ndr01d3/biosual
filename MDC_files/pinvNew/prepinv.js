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
includeProteinsFromURLParameter(URLrequests,"prtExt","recursive");

var coreURL=getURLParameter("core");
if (coreURL==null || coreURL=="null" || jQuery.trim(coreURL)=="")
	coreURL="";
var private_key=getURLParameter("key");

var model=[],
	mainfields=["p1","p1_organism","p2","p2_organism","score"],
	prefix=["p1_",false,"p2_",false,"score_"];

var callback = function (response) {
	console.debug("callback from luke!!!");
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
var modelrequester=null;
var uploadModel =function(){
	var url_parameters='/admin/luke?wt=json&numTerms=0&Explicit=True&json.wrf=?';
	if ( typeof private_key != "undefined" && private_key != null && private_key != "null")
		url_parameters += "&key="+private_key;

	modelrequester=$.ajax({
		  error:  function() {
			    	console.debug('a 403 was received');
			     
			    },
		  dataType: "json",
		  url: server+coreURL+url_parameters
		});

//	modelrequester=jQuery.getJSON(server+coreURL+url_parameters);
	modelrequester.done(callback);
	modelrequester.fail( function(jqXHR, exception) {
        if (jqXHR.status === 0) {
            alert('Not connect.\n Verify Network.');
        } else if (jqXHR.status == 404) {
            alert('Requested page not found. [404]');
        } else if (jqXHR.status == 403) {
            alert('ERROR: The requested core is protected or doesn\'t exists.');
        } else if (jqXHR.status == 500) {
            alert('Internal Server Error [500].');
        } else if (exception === 'parsererror') {
            alert('Requested JSON parse failed.');
        } else if (exception === 'timeout') {
            alert('Time out error.');
        } else if (exception === 'abort') {
            alert('Ajax request aborted.');
        } else {
            alert('Uncaught Error.\n' + jqXHR.responseText);
        }
    });
};
var reloadModel =function(){
	model=[],
	mainfields=["p1","p1_organism","p2","p1_organism","score"],
	prefix=["p1_",false,"p2_",false,"score_"];
	uploadModel();
};
if (getURLParameter("status")=="null")
	uploadModel();
