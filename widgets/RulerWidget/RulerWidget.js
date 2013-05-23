(function ($) {
	AjaxSolr.RulerWidget = AjaxSolr.AbstractWidget.extend({
		rules: null,
		ruler:null,
		init: function(){
			var self=this;
			self.ruler = new Biojs.Ruler({
				target: "ruler",
				allowOrdering:true,
				rules: self.rules
			});	
		},
		afterRequest: function () {
			var self = this;
			self._fillDynamicFields();
		},
		afterRemove: function (){
			var self =this;
			self._fillDynamicFields();
		},
		_fillDynamicFields: function(){
			var self = this;
		    for (var i in self.dynamicRuleField){
		    	var drf = self.dynamicRuleField[i];
		    	if (typeof drf.condition != 'undefined')
		    		self.rules.target[drf.target].conditions[drf.condition].values=self.manager.widgets[drf.widget][drf.parameter];
		    	else if (typeof drf.action != 'undefined')
		    		self.rules.target[drf.target].action[drf.action].options=self.manager.widgets[drf.widget][drf.parameter];
		    }			
		}
	});
})(jQuery);