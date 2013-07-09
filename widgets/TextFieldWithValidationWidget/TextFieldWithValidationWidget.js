(function ($) {
	AjaxSolr.TextFieldWithValidationWidget = AjaxSolr.AbstractFacetWidget.extend({
		excludeNames:[],
		init: function () {
			var self = this;
			var timeoutReference=0;
			var filter= function(x){
		        if (timeoutReference) clearTimeout(timeoutReference);
		        timeoutReference = setTimeout(function() {
		        	if (self.excludeNames.indexOf($('#'+self.target+ " input").val()))
		        		$('#'+self.target+ " span.validationResult").html("OK");
		        	else
		        		$('#'+self.target+ " span.validationResult").html("Unavailable Name");
		        }, 100);
			};
			$('#'+self.target+ " input").keydown(filter);
		},
		afterRequest: function(){
			var self =this;
			self.excludeNames=[];
			for (var facet in self.manager.response.status) {
				self.excludeNames.push(facet);
			}
		}
	});
})(jQuery);
