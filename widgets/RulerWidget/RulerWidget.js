(function ($) {
	AjaxSolr.RulerWidget = AjaxSolr.AbstractWidget.extend({
		rules: null,
		ruler:null,
		init: function(){
			var self=this;
			self.fields=self.manager.widgets["requester"].fields;
			self.prefixes=self.manager.widgets["requester"].prefixes;
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
		    	var values=[];
		    	if (typeof drf.otherValues != "undefined")
		    		values =drf.otherValues;
		    	values = values.concat(self.manager.widgets[drf.widget][drf.parameter]);
		    	
		    	if (typeof drf.condition != 'undefined')
		    		self.rules.target[drf.target].conditions[drf.condition].values=values;
		    	else if (typeof drf.action != 'undefined')
		    		self.rules.target[drf.target].action[drf.action].options=values;
		    }			
		}
	});
})(jQuery);