(function ($) {
  $(function () {
	  	$.fn.expression={};
	  	$.fn.expression.paintProteins = function(self){
//			var self = this;
	  		var expW= self.manager.widgets["expression"];
			if (expW.active==false) return;
			if (expW.loader==null || expW.expressions==null) return;
			var proteins = self.manager.widgets["graph"].graph.proteins;
			for(var i=0; i<proteins.length; i++) {
				if( typeof expW.expressions[proteins[i].id] != "undefined") {
					var value=1*expW.expressions[proteins[i].id][expW.column*1];
					var rgb = expW.loader.getRGBString(value);
					self.manager.widgets["graph"].graph.setFillColor("[id =figure_"+proteins[i].id+"]",rgb);
				}
			}			
			self.manager.widgets["graph"].graph.restart();
		};
  });
})(jQuery);
