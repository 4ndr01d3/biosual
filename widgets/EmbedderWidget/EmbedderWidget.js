(function ($) {
	AjaxSolr.EmbedderWidget = AjaxSolr.AbstractWidget.extend({
		afterRequest:function(){
			var self = this;
			if (getURLParameter("embedded")=="true"){
				self._css();
				self._hide();
			}
		},
		init:function(){
			var self = this;
			if (getURLParameter("embedded")=="true"){
				self._css();
				self._hide();
			}
		},
		_hide: function(){
			var self = this;
			for (var i=0;i<self.hide.length;i++)
				$(self.hide[i]).hide();
		},
		_css: function(){
			var self = this;
			for (var i=0;i<self.cssChanges.length;i++)
				for (var j=0;j<self.cssChanges[i].selectors.length;j++)
					for (var k=0;k<self.cssChanges[i].changes.length;k++)
					$(self.cssChanges[i].selectors[j]).css(self.cssChanges[i].changes[k].attribute,self.cssChanges[i].changes[k].value);
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});
})(jQuery);