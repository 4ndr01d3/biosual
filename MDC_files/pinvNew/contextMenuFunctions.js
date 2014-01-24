(function ($) {
	$(function () {
		/*
		 * For each item in the contextual menu a function should be created here.
		 */
		$.fn.context ={};
		$.fn.context.interactions = function(t){
			var protein= t.id.substr(5);
			Manager.widgets["requester"].request([ protein ],Manager.widgets["requester"].basic);
		};
		$.fn.context.hideProtein = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context.hideInteractions = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context.hideBoth = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context.label = function(t){
			Manager.widgets["graph"].graph.swapShowLegend("#"+t.id+" .legend");
		};
		$.fn.context.lock = function(t){
			var protein= t.id.substr(5);
			Manager.widgets["graph"].graph.swapFixed(protein);
		};
		$.fn.context.highlight = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context.highlight_p = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Proteins",condition:"interactions with",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context.highlight_i = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		/*
		 * For each item in the contextual menu a function should be created here.
		 */
		$.fn.context2 ={};
		$.fn.context2.interactions = function(t){
			var protein= t.id.substr(5);
			Manager.widgets["requester"].request([ protein ],Manager.widgets["requester"].basic);
		};
		$.fn.context2.hideProtein = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Hide",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context2.hideInteractions = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Hide",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context2.hideBoth = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
			var rule= {location:"",action:{name:"Hide",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context2.label = function(t){
			Manager.widgets["graph2"].graph.swapShowLegend("#"+t.id+" .legend");
		};
		$.fn.context2.lock = function(t){
			var protein= t.id.substr(5);
			Manager.widgets["graph2"].graph.swapFixed(protein);
		};
		$.fn.context2.highlight = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Proteins",condition:"accession number",parameters:["equals",protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context2.highlight_p = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Proteins",condition:"interactions with",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
		$.fn.context2.highlight_i = function(t){
			var protein= t.id.substr(5);
			var rule= {location:"Current Graphic",action:{name:"Highlight",type:"single"},target:"Interactions",condition:"protein",parameters:[protein]};
			Manager.widgets["ruler"].ruler.addActiveRule(rule);
		};
	});
})(jQuery);
