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
			$("#"+self.target).append(html);
		},
		afterRequest: function() {
			var self=this;
			$(self.triggerer).contextMenu("context_"+self.id, {
				bindings: self.bindings,
				menuStyle:self.menuStyle,
				itemStyle:self.itemStyle,
				itemHoverStyle:self.itemHoverStyle,
			});
		},
		afterRemove: function() {
			var self=this;
			$(self.triggerer).contextMenu("context_"+self.id, {
				bindings: self.bindings,
				menuStyle:self.menuStyle,
				itemStyle:self.itemStyle,
				itemHoverStyle:self.itemHoverStyle,
			});
		},
		initTest: function(){
			var self = this;
			ok($("#"+self.target+" div.contextMenu").length>0,"Widget("+self.id+"-ContextMenuWidget): The target contains at least a DIV.contextMenu element");
			for (var key in self.menu){
				ok($("#context_"+self.id+" li#"+key).length==1,"Widget("+self.id+"-ContextMenuWidget): There is one and only one context element with id "+key);
			}
			equal(Object.keys(self.bindings).length,Object.keys(self.menu).length,"Widget("+self.id+"-ContextMenuWidget): the number of binders is equal to the number of menu items");
		}
	});
})(jQuery);