var Manager;
(function ($) {
  $(function () {
    Manager = new AjaxSolr.Manager({
        solrUrl: server
      });
	for (var i = 0, l = json.length; i < l; i++) {
	    Manager.addWidget(new AjaxSolr[json[i]['widget']](json[i]['parameters']));
	}
    Manager.init();
    for (var name in params)
        Manager.store.addByValue(name, params[name]);
    if ( typeof URLrequests == "undefined" || !Array.isArray(URLrequests) || URLrequests.length<1)
    	Manager.store.addByValue('q', '*:*');
    else
		for (var i=0;i<URLrequests.length;i++)
			Manager.widgets["requester"].request([URLrequests[i]]);
    Manager.doRequest();
  });

})(jQuery);
