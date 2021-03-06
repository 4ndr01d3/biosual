(function ($) {
	AjaxSolr.RulerWidget = AjaxSolr.AbstractWidget.extend({
		rules: null,
		ruler:null,
		init: function(){
			var self=this;
			self.fields=self.manager.widgets["requester"].fields;
			self.prefixes=self.manager.widgets["requester"].prefixes;
			self.ruler = new Biojs.Ruler({
				target: self.target,
				allowOrdering:true,
				rules: self.rules
			});	
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				self.ruler.onRuleCreated(function(obj){
					Manager.widgets["provenance"].addAction("Rule Created",self.id,obj);
				});
				self.ruler.onRuleRemoved(function(obj){
					Manager.widgets["provenance"].addAction("Rule Removed",self.id,obj);
				});
				self.ruler.onRuleEditing(function(obj){
					Manager.widgets["provenance"].addAction("Rule Edited",self.id,obj);
				});
				self.ruler.onOrderChanged(function(obj){
					Manager.widgets["provenance"].addAction("Rule's order changed",self.id,obj);
				});
			}
			
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
		},
		initTest:function(){
			var self = this;
			ok(self.ruler!=null, "Widget("+self.id+"-RulerWidget): The BioJs component has been initializated");
			ok($("#"+self.target+" section.ruler").length>0,"Widget("+self.id+"-RulerWidget): The target contains at least a SECTION.ruler element");
		},
		status2JSON:function(){
			var self = this;
			return {"rules":self.ruler.getActiveRules()};
		},
		uploadStatus:function(json){
			var self = this;
			for (var i=0;i<json.rules.length;i++){
				self.ruler.addActiveRule(json.rules[i]);
			}
		}, 
		triggerExecuters:function(){
			var self = this;
			self.ruler.triggerOrderChange();
		}
	});
})(jQuery);