(function ($) {
	AjaxSolr.EventManagerWidget = AjaxSolr.AbstractWidget.extend({
		functions:{},
		init: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="init")
					self._registerEvent(event);
			}			
		},	
		_registerEvent:function(event){
			var self = this;
			if (typeof self.functions[event.listener+"."+event.method]=="undefined")
				self.functions[event.listener+"."+event.method] = function(event){
					return function( objEvent ) {
						Manager.widgets[event.listener][event.method](objEvent);
					};
				}(event);
			else
				Manager.widgets[event.source][event.object].removeListener(event.event, self.functions[event.listener+"."+event.method]);
			
			Manager.widgets[event.source][event.object][event.event](  self.functions[event.listener+"."+event.method]); 
			
		},
		afterRequest: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="afterRequest")
					self._registerEvent(event);
			}			
		},	

		afterRemove: function(){
			var self =this;
			for (var i in self.events){
				var event = self.events[i];
				if (event.type=="afterRequest")
					self._registerEvent(event);
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