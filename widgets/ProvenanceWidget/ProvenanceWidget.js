(function ($) {
	AjaxSolr.ProvenanceWidget = AjaxSolr.AbstractWidget.extend({
		actions : [],
		addAction:function(label,source, parameters){
			var self = this;
			self.actions.push({
				"label":label,
				"source":source,
				"parameters":parameters
			});
			$("#"+self.target+" .provenance_list").html(self.getHTMLList());
		},
		getHTMLList:function(){
			var self = this;
			var html =  "<ol>";
			for (var i=0;i<self.actions.length;i++){
				html +=     "<li><p><em>["+self.actions[i].source+"]"+self.actions[i].label+"</em>"+JSON.stringify(self.actions[i].parameters)+"</p></li>";
			}
			html +=     "<ol>";
			return html;
		}
	});
})(jQuery);