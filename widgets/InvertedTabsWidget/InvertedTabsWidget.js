(function ($) {
	AjaxSolr.InvertedTabsWidget = AjaxSolr.AbstractFacetWidget.extend({
		init: function () {
			var self =this;
			$("#"+self.target).empty();
			$("#"+self.target).html("<ul />");
			for (var i=0;i<self.tabs.length;i++){
				var def=(self.tabs[i].selected)?' class="current"':"";
				$("#"+self.target+ " ul").append('<li'+def+'><a title="'+self.tabs[i].title+'">'+self.tabs[i].title+'</a></li>');
				if (!self.tabs[i].selected)
					$("#"+self.tabs[i].target).hide();
				else
					for (var j=0;j<self.sideEffects.length;j++){
						if ( self.sideEffects[j].visibleWith.indexOf(self.tabs[i].title)==-1)
							$("#"+self.sideEffects[j].target).hide();
						else
							$("#"+self.sideEffects[j].target).show();
					}
				
				
				$("#"+self.target+ " ul a[title='"+self.tabs[i].title+"']").click(function(d){ 
					
					$("#"+self.target+ " ul li").removeClass("current");
					for (var i=0;i<self.tabs.length;i++){
						$("#"+self.tabs[i].target).hide();
						if ($(this).attr("title")==self.tabs[i].title){
							$("#"+self.tabs[i].target).show();
							$(this).parent().addClass("current");
						}
					}
				
					if (typeof self.sideEffects !="undefined") 
						for (var i=0;i<self.sideEffects.length;i++){
							if ( self.sideEffects[i].visibleWith.indexOf($(this).attr("title"))==-1)
								$("#"+self.sideEffects[i].target).hide();
							else
								$("#"+self.sideEffects[i].target).show();
						}
					
				});
			}
		}
	});
})(jQuery);
