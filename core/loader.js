var Manager;
(function ($) {
	$(function () {
		if (typeof coreURL=="undefined") coreURL="";
		Manager = new AjaxSolr.Manager({
			solrUrl: server + coreURL +"/"
		});
		for (var i = 0, l = json.length; i < l; i++) {
			Manager.addWidget(new AjaxSolr[json[i]['widget']](json[i]['parameters']));
		}
		Manager.init();
		if ( typeof servlet != "undefined") {
			Manager.servlet=servlet;
			Manager.store.servlet=servlet;
		}
		for (var name in params)
			Manager.store.addByValue(name, params[name]);
		if ( typeof URLrequests == "undefined" || !Array.isArray(URLrequests) || URLrequests.length<1) {
			if (getURLParameter("status")==null || getURLParameter("status")=="null"){
				Manager.store.addByValue('q', '*:*');
				Manager.doRequest();
			}
		}else
			for (var i=0;i<URLrequests.length;i++)
				Manager.widgets["requester"].request([URLrequests[i].id],URLrequests[i].type);
	});

})(jQuery);
var STATUS={};
STATUS.NO_APPLICABLE=979223;
function getURLParameter(name) {
    return decodeURIComponent(
        (location.search.match(RegExp("[?|&]"+name+'=(.+?)(&|$)'))||[,null])[1]
    );  
}
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
