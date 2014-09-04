(function ($) {
	AjaxSolr.QuickStartWidget = AjaxSolr.AbstractWidget.extend({
		init: function () {
			var self = this;
			$('#wizard_mask').show(); 
			$('#wizard_container').show();
			$('#wizard_container .dataset').html(coreURL);
			$('#wizard_container .empty').click(function(){
				$('#wizard_mask').hide(); 
				$('#wizard_container').hide();
			});
			$('#wizard_container .filter').click(function(){
				$('#wizard_mask').hide(); 
				$('#wizard_container').hide();
				$('#filter_mask').show(); 
				$('#filter_container').show();
			});
			$('#wizard_container .cluster').click(function(){
				$('#wizard_mask').hide(); 
				$('#wizard_container').hide();
			});
		},
		afterRequest: function () {
			var self = this;
			$('#wizard_mask').hide(); 
			$('#wizard_container').hide();
		}
	});
})(jQuery);