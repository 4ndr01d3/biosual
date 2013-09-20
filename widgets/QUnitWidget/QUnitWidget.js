(function ($) {
	AjaxSolr.QUnitWidget = AjaxSolr.AbstractWidget.extend({
		init: function(){
			unitTests();
		},
		afterRequest: function(){
			var self = this;
			if (typeof self.test != "undefined" && self.test != null ){
				self.test.callback();
				self.test=null;
			}
		},
		initTest: function(){
			var self = this;
			ok(true, "Widget("+self.id+"-QUnitWidget): Aren't you running the tests??");
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});
})(jQuery);