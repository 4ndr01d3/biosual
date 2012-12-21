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
    Manager.store.addByValue('q', '*:*');
    for (var name in params)
      Manager.store.addByValue(name, params[name]);
    Manager.doRequest();
  });
  $.fn.showIf = function (condition) {
    if (condition) {
      return this.show();
    }else {
      return this.hide();
    }
  };

})(jQuery);
