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
			$('#wizard_container .cluster').attr('disabled','disabled');
			if (modelrequester!=null) modelrequester.done(function(p){
				if (self.manager.widgets["requester"].hasLevels){
					$('#wizard_container .cluster').attr('disabled',null);
					$('#wizard_container .cluster').click(function(){
						self.manager.widgets["requester"].request(["","3"],"cluster")
						$('#wizard_mask').hide(); 
						$('#wizard_container').hide();
					});
				}else{
					$('#wizard_container .cluster + .explain').html("The core doesn't have cluster information.");
				}
			});
		},
		afterRequest: function () {
			var self = this;
			$('#wizard_mask').hide(); 
			$('#wizard_container').hide();
		}
	});
})(jQuery);