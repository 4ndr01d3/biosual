(function ($) {
	AjaxSolr.FewOptionsWidget = AjaxSolr.AbstractFacetWidget.extend({
		init: function () {
			var self =this;
			$("#"+self.target).empty();
			$("#"+self.target).html("<ul />");
			for (var i=0;i<self.options.length;i++){
				var def=(self.options[i].selected)?' class="current"':"";
				$("#"+self.target+ " ul").append('<li'+def+'><a title="'+self.options[i].title+'">'+self.options[i].title+'</a></li>');

				$("#"+self.target+ " ul a[title='"+self.options[i].title+"']").click(function(d){ 
					
					$("#"+self.target+ " ul li").removeClass("current");
					for (var i=0;i<self.options.length;i++){
						$("#"+self.options[i].target).hide();
						if ($(this).attr("title")==self.options[i].title){
							$(this).parent().addClass("current");
						}
					}
					for (var i=0;i<self.trigger.length;i++){
						var toTrigger= self.manager.widgets[self.trigger[i].widget];
						toTrigger[self.trigger[0].method]($(this).attr("title"));
					}
				});
			}
		},
		afterRequest:function(){
			var self =this;
			if (self.previousRequest!=null && self.previousRequest=="*:*"){
				$("#"+self.target+ " ul li").removeClass("current");
				for (var i=0;i<self.options.length;i++){
					if  (self.options[i].selected)
						$("#"+self.target+ " ul a[title="+self.options[i].title+"]").parent().addClass("current");
				}
			}
			self.previousRequest=self.manager.store.get('q').val();
		}
	});
})(jQuery);
