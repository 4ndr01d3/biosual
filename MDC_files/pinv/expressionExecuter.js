(function ($) {
  $(function () {
	  	$.fn.expression={};
	  	$.fn.expression.paintProteins = function(self){
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
		
	  	$.fn.expression.paintCircleProteins = function(self){
	  		var expW= self.manager.widgets["expression"];
			if (expW.active==false) return;
			if (expW.loader==null || expW.expressions==null) return;

			var proteins = self.manager.widgets["graph2"].graph.proteins;
			for(var i in proteins) {
				if( typeof expW.expressions[proteins[i].id] != "undefined") {
					var value=1*expW.expressions[proteins[i].id][expW.column*1];
					var rgb = expW.loader.getRGBString(value);
					self.manager.widgets["graph2"].graph.setFillColor("[id =figure_"+proteins[i].id+"]",rgb);
				}
			}
		};
		
	  	$.fn.expression.paintCellProteins = function(self){
	  		var expW= self.manager.widgets["expression"];
			if (expW.active==false) return;
			if (expW.loader==null || expW.expressions==null) return;

			var proteins = self.manager.widgets["table"].ids;
			for(var i in proteins) {
				if( typeof expW.expressions[proteins[i]] != "undefined") {
					var value=1*expW.expressions[proteins[i]][expW.column*1];
					var rgb = expW.loader.getRGBString(value);
					self.manager.widgets["table"].paintCell("",".cell_protein1[content="+proteins[i]+"], .cell_protein2[content="+proteins[i]+"]",rgb);
				}
			}
		};
  });
})(jQuery);
