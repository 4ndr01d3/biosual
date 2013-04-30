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
				$("#"+self.target+ " ul a[title='"+self.tabs[i].title+"']").click(function(d){ 
					
					$("#"+self.target+ " ul li").removeClass("current");
					for (var i=0;i<self.tabs.length;i++){
						$("#"+self.tabs[i].target).hide();
						if ($(this).attr("title")==self.tabs[i].title){
							$("#"+self.tabs[i].target).show();
							$(this).parent().addClass("current");
						}
					}
					
				});
			}
		}
	});
})(jQuery);
