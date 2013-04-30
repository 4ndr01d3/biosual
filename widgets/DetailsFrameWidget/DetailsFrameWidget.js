(function ($) {
	AjaxSolr.DetailsFrameWidget = AjaxSolr.AbstractWidget.extend({
		info:null,
		selected:null,
		lastClick:0,
		init: function(){
			var self = this;
			
			self.info = new Biojs.DetailsFrame({
				target: self.target,
				features: {id:self.defeultText}
			});
			
			if (typeof self.positionTarget != "undefined") {
				$("#"+self.target).position({
					of: $("#"+self.positionTarget),
				    my: self.myPosition,
				    at: self.atPosition
				});
			}
		},	
		fillDetails: function(d){
			var self=this;
			var newClick = (new Date()).getTime();
			if (newClick-self.lastClick<300)
				return;
			self.lastClick=newClick;
			if (d.protein.name==self.selected){
				self.info.updateFeatures({id:self.defeultText});
				self.selected=null;
			}else{
				self.info.updateFeatures(d.protein.features);//,self.orderProteinFeatures);
				self.selected=d.protein.name;
			}
		},
		afterRequest: function(){
		    for (var i in events){
		    	var event = events[i];
		    	if (event.type=="afterRequest")
			    	Manager.widgets[event.source][event.object][event.event](function(event){
			    			return function( objEvent ) {
			    				Manager.widgets[event.listener][event.method](objEvent);
			    			};
					}(event)); 
		    	
		    }			
		}
	});
})(jQuery);