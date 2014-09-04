(function ($) {
	AjaxSolr.FewOptionsWidget = AjaxSolr.AbstractFacetWidget.extend({
		init: function () {
			var self =this;
			$("#"+self.target).empty();
			$("#"+self.target).html("<ul class='options'/>");
			for (var i=0;i<self.options.length;i++){
				self.addOption(self.options[i]);
			}
			$("#"+self.target).append("<ul><li><a class='other_option'>Other...</a><span class='other_option'><input type='text'><button>add</button></span></li></ul>");
			$("#"+self.target+" span.other_option").hide();
			$("#"+self.target+ " a.other_option").click(function(d){ 
				$("#"+self.target+" span.other_option").show();
			});
			$("#"+self.target+ " span.other_option button").click(function(d){
				var newoption=$("#"+self.target+ " span.other_option input").val();
				if (self.optionFormat){
					var regexp=new RegExp(self.optionFormat);
					if (regexp.test(newoption)){
						self.addOption({"title":newoption});
						$("#"+self.target+ " ul.options a[title='"+newoption+"']").click();
						$("#"+self.target+" span.other_option").hide();
					}else{
						alert(self.explainFormat);
					}
						
				}
			});
			$("ul.options .current a").click();
		},
		addOption: function(option){
			var self = this;
			var def=(option.selected)?' class="current"':"";
			$("#"+self.target+ " ul.options").append('<li'+def+'><a title="'+option.title+'">'+option.title+'</a></li>');

			$("#"+self.target+ " ul.options a[title='"+option.title+"']").click(function(d){ 
				
				$("#"+self.target+ " ul.options li").removeClass("current");
				for (var i=0;i<self.options.length;i++){
					$("#"+option.target).hide();
					if ($(this).attr("title")==option.title){
						$(this).parent().addClass("current");
					}
				}
				for (var i=0;i<self.trigger.length;i++){
					var toTrigger= self.manager.widgets[self.trigger[i].widget];
					toTrigger[self.trigger[0].method]($(this).attr("title"));
				}
			});
		},
		onceOff:true,
		afterRequest: function(){
		},
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
