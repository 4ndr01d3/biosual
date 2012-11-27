var Manager;
(function ($) {
  $(function () {
	    Manager = new AjaxSolr.Manager({
	        solrUrl: 'http://evolvingweb.ca/solr/reuters/'
	      });
		for (var i = 0, l = json.length; i < l; i++) {
		    Manager.addWidget(new AjaxSolr[json[i]['widget']](json[i]['parameters']));
		}
    Manager.init();
    Manager.store.addByValue('q', '*:*');
    var params = {
      facet: true,
      'facet.field': [ 'topics', 'organisations', 'exchanges', 'countryCodes' ],
      'facet.limit': 20,
      'facet.mincount': 1,
      'f.topics.facet.limit': 50,
      'f.countryCodes.facet.limit': -1,
      'facet.date': 'date',
      'facet.date.start': '1987-02-26T00:00:00.000Z/DAY',
      'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
      'facet.date.gap': '+1DAY',
      'json.nl': 'map'
    };
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
  }

})(jQuery);
