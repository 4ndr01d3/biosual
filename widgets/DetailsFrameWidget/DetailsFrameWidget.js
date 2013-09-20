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
			var obj=false;
			
			if (typeof self.locations!="undefined") 
				for (var i=0;i<self.locations.length;i++){
					obj=self.extractFromLocation(d, self.locations[i]);
					if (obj !== false)
						break;
				}
			
			if (obj==false || obj.id==self.selected){
				self.info.updateFeatures({id:self.defeultText});
				self.selected=null;
			}else{
				self.info.updateFeatures(obj);//,self.orderProteinFeatures);
				self.selected=obj.id;
			}
		},
		extractFromLocation: function(object,location){
			var parts = location.split(".");
			var objtemp=object;
			for (var i=0;i<parts.length;i++){
				var part=parts[i];
				if (typeof objtemp[part]=="undefined")
					return false;
				else
					objtemp=objtemp[part];
			}
			return objtemp;
		},
		initTest: function(){
			var self = this;
			ok(self.info!=null, "Widget("+self.id+"-DetailsFrameWidget): The BioJs component has been initializated");
			ok($("#"+self.target+" ul").length>0,"Widget("+self.id+"-DetailsFrameWidget): The target contains at least a UL element");
		},
		status2JSON:function(){
			var self = this;
			return {"features":self.info.opt.features,
					"order":self.info.order};
		},
		uploadStatus:function(json){
			var self = this;
			self.info.updateFeatures(json.features,json.order);
		}
	});
})(jQuery);