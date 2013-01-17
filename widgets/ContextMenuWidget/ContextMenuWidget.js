(function ($) {
	AjaxSolr.ContextMenuWidget = AjaxSolr.AbstractWidget.extend({
		init: function(){
			var self=this;
			self.bindings={};
			var html = '<div  class="contextMenu" id="context_'+self.id+'" style="display: none;"><ul>';
			for (var key in self.menu){
				html +=	'<li id="'+key+'">'+self.menu[key].label+'</li>';
				
				self.bindings[key] = function(k){
					return function(t){ 
						$.fn[self.id][k](t);
					};
				}(key);
			}
			html +=	'</ul></div>';
			$("body").append(html);
		},
		afterRequest: function() {
			var self=this;
			$(self.triggerer).contextMenu("context_"+self.id, {
				bindings: self.bindings,
				menuStyle:self.menuStyle,
				itemStyle:self.itemStyle,
				itemHoverStyle:self.itemHoverStyle,
			});
			
		}
	});
})(jQuery);