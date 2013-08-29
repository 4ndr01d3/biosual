(function ($) {
	AjaxSolr.ExpressionWidget = AjaxSolr.AbstractWidget.extend({
		loader:null,
		expressions:null,
		colorData:null,
		column:-1,
		active:false,
		init: function(){
			var self=this;
			self.loader = new Biojs.ExpressionLoader({
				target: self.target
			});	
		},

		onFileLoaded: function( objEvent ) {
			var self=this;
			self.expressions =objEvent.expressions;
			self.colorData=objEvent.colorData;
			self.column=objEvent.column;
			self.active=true;
		},
		
		onFileRemoved: function( objEvent ) {
			var self=this;
			self.active=false;
		},
		initTest: function(){
			var self = this;
			ok(self.loader!=null, "Widget("+self.id+"-ExpressionWidget): The BioJs component has been initializated");
			ok($("#"+self.target+" input.button-link").length>0,"Widget("+self.id+"-ExpressionWidget): The target contains at least a INPUT.button-link element");
		}
	});
})(jQuery);