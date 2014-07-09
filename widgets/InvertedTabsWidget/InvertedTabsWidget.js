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
							$(self.sideEffects[j].target).hide();
						else
							$(self.sideEffects[j].target).show();
					}
				
				
				$("#"+self.target+ " ul a[title='"+self.tabs[i].title+"']").click(function(d){ 
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Changing Tab",self.id,{
							"from":$("#"+self.target+ " ul li.current a").attr("title"),
							"to":$(this).attr("title")
						});
					}
					
					$("#"+self.target+ " ul li").removeClass("current");
					for (var i=0;i<self.tabs.length;i++){
						$("#"+self.tabs[i].target).hide();
						if ($(this).attr("title")==self.tabs[i].title){
							if (typeof self.tabs[i].on_show == "undefined")
								$("#"+self.tabs[i].target).show();
							else{
								$("#"+self.tabs[i].target).show(0,self.manager.widgets[self.tabs[i].on_show.widget][self.tabs[i].on_show.method]);
							}
							$(this).parent().addClass("current");
						}
					}
					if (typeof self.on_show != "undefined")
						self.manager.widgets[self.on_show.widget][self.on_show.method]();
				
					if (typeof self.sideEffects !="undefined") 
						for (var i=0;i<self.sideEffects.length;i++){
							if ( self.sideEffects[i].visibleWith.indexOf($(this).attr("title"))==-1)
								$(self.sideEffects[i].target).hide();
							else
								$(self.sideEffects[i].target).show();
						}
					
				});
			}
		},
		initTest: function(){
			var self = this;
			var tabsLI=$("#"+self.target+ " ul li");
			equal(tabsLI.length,self.tabs.length,"Widget("+self.id+"-InvertedTabsWidget): the number of tabs is according to the json");
			var tabSelected=null,tabUnselected=null;
			for (var j=0;j<tabsLI.length;j++){
				if ($(tabsLI[j]).hasClass( "current" ))
					tabSelected = $(tabsLI[j]);
				else
					tabUnselected = $(tabsLI[j]);
				equal($(tabsLI[j]).hasClass( "current" ),self.tabs[j].selected,"Widget("+self.id+"-InvertedTabsWidget): The tab "+self.tabs[j].title+" has been well initialized");
			}
			ok(tabSelected!=null,"Widget("+self.id+"-InvertedTabsWidget): There is at least one tab selected");
			ok(tabUnselected!=null,"Widget("+self.id+"-InvertedTabsWidget): There is at least one tab no selected");
			tabUnselected.find("a").click();
			equal(tabUnselected.hasClass( "current" ),true,"Widget("+self.id+"-InvertedTabsWidget): the unselected tab has change its class once has been click");
			equal(tabSelected.hasClass( "current" ),false,"Widget("+self.id+"-InvertedTabsWidget): the selected tab has change its class once has been click");
			tabSelected.find("a").click();
			
		},
		status2JSON:function(){
			var self = this;
			var element=$("#"+self.target+ " ul li.current a");
			return {current:element.text()};
		},
		uploadStatus:function(json){
			var self = this;
			$("#"+self.target+ " ul li a[title="+json.current+"]").click();
		},
		resetStatus:function(){
			var self = this;
			$("#"+self.target+ " ul li").removeClass("current");
			for (var i=0;i<self.tabs.length;i++){
				if (self.tabs[i].selected)
					$("#"+self.target+ " ul li a[title:"+self.tabs[i].title+"]").click();
			}			
		}

	});
})(jQuery);
