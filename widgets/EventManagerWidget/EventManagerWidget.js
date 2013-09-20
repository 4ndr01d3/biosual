(function ($) {
	AjaxSolr.EventManagerWidget = AjaxSolr.AbstractWidget.extend({
		init: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="init")
					Manager.widgets[event.source][event.object][event.event](function(event){
						return function( objEvent ) {
							Manager.widgets[event.listener][event.method](objEvent);
						};
					}(event)); 
			}			
		},	

		afterRequest: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="afterRequest")
					Manager.widgets[event.source][event.object][event.event](function(event){
						return function( objEvent ) {
							Manager.widgets[event.listener][event.method](objEvent);
						};
					}(event)); 
			}			
		},	

		afterRemove: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="afterRequest")
					Manager.widgets[event.source][event.object][event.event](function(event){
						return function( objEvent ) {
							Manager.widgets[event.listener][event.method](objEvent);
						};
					}(event)); 
			}			
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});
})(jQuery);