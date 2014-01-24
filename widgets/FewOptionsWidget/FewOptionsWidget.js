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
//		afterRequest:function(){
//			var self =this;
//			if (self.previousRequest!=null && self.previousRequest=="*:*"){
//				$("#"+self.target+ " ul li").removeClass("current");
//				for (var i=0;i<self.options.length;i++){
//					if  (self.options[i].selected)
//						$("#"+self.target+ " ul a[title="+self.options[i].title+"]").parent().addClass("current");
//				}
//			}
//			self.previousRequest=self.manager.store.get('q').val();
//		},
		initTest: function(){
			var self = this;
			ok($("#"+self.target+" ul").length>0,"Widget("+self.id+"-FewOptionsWidget): The target contains at least a UL element");
			var tabsLI=$("#"+self.target+ " ul li");
			equal(tabsLI.length,self.options.length,"Widget("+self.id+"-FewOptionsWidget): the number of options is according to the json");
			var tabSelected=null,tabUnselected=null;
			for (var j=0;j<tabsLI.length;j++){
				if ($(tabsLI[j]).hasClass( "current" ))
					tabSelected = $(tabsLI[j]);
				else
					tabUnselected = $(tabsLI[j]);
				equal($(tabsLI[j]).hasClass( "current" ),self.options[j].selected,"Widget("+self.id+"-FewOptionsWidget): The option "+self.options[j].title+" has been well initialized");
			}
			ok(tabSelected!=null,"Widget("+self.id+"-FewOptionsWidget): There is at least one tab selected");
			ok(tabUnselected!=null,"Widget("+self.id+"-FewOptionsWidget): There is at least one tab no selected");
			tabUnselected.find("a").click();
			equal(tabUnselected.hasClass( "current" ),true,"Widget("+self.id+"-FewOptionsWidget): the unselected tab has change its class once has been click");
			equal(tabSelected.hasClass( "current" ),false,"Widget("+self.id+"-FewOptionsWidget): the selected tab has change its class once has been click");
			
		},
		status2JSON:function(){
			var self = this;
			var element=$("#"+self.target+ " ul li.current a");
			return {current:element.text()};
		},
		uploadStatus:function(json){
			var self = this;
			$("#"+self.target+ " ul li a[title="+json.current+"]").click();
		}
	});
})(jQuery);
