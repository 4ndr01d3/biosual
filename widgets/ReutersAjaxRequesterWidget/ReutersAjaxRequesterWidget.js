(function ($) {
	AjaxSolr.ReutersAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		request: function(type,parameters){
			var self = this;
			if (self.manager.store.addByValue('fq', parameters[0])) {
				self.doRequest();
			}
		},
		getQueries: function(){
			var self=this;
			return self.manager.store.values('fq');
		},
		removeAll: function() {
			var self = this;
			return function () {
		        self.manager.store.get('q').val('*:*');
		        self.manager.store.remove('fq');
		        self.doRequest();
			};
		},
		getNumberOfResponsesPerQuery: function(query){
			return null;
		},
		removeQuery: function (facet) {
			var self = this;
			return function () {
				if (self.manager.store.removeByValue('fq', facet)) {
					self.doRequest();
				}
				return false;
			};

		}


	});
})(jQuery);