/**
 * This component creates a floating div as a pop-up window to visualize a list of annotations on an entity. 
 * Eg. Protein, Interaction, Gene, etc
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="gustavoadolfo.salazar@gmail.com">Gustavo A. Salazar</a>
 * @version 1.0.0
 * 
 * @requires <a href='http://code.jquery.com/query-1.7.2.min.js'>jQuery Core 1.7.2</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.7.2.min.js"></script>
 * 
 * @requires <a href='http://jqueryui.com/download/jquery-ui-1.8.20.custom.zip'>jQuery UI 1.8.2</a>
 * @dependency <script src="../biojs/dependencies/jquery/jquery-ui-1.8.2.custom.min.js" type="text/javascript"></script>
 *
 * @requires <a href='http://jqueryui.com/download/jquery-ui-1.8.20.custom.zip'>jQuery UI CSS 1.8.2</a>
 * @dependency <link rel="stylesheet" href="../biojs/dependencies/jquery/jquery-ui-1.8.2.css" />
 * 
 * @requires <a href='http://www.ebi.ac.uk/~jgomez/biojs/biojs/css/biojs.detailsFrame.css'>Details frame CSS</a>
 * @dependency <link rel="stylesheet" href="../biojs/css/biojs.detailsFrame.css" />
 * 
 * @param {Object} options An object with the options for the Details Frame component.
 * 
 * @option {string} target
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @option {object} features
 *    Object with the features to display, every attribute is displayed as an item in the list. 
 *    The attribute id, is used for the title of the frame. 
 *    The attribute description has a different style at the beggining of the list
 * 
 * @option {boolean} [minizable=true]
 *    to indicate if the window is minizable. default value: true
 * 
 * @option {boolean} [draggable=true]
 *    to indicate if the window can be draggable. default value: true
 * 
 * @example
 * 					var instance = new Biojs.DetailsFrame({
 *					     target: "YourOwnDivId",
 *					     features: {
 *					    	 "id":"P64747",
 *					    	 "description":"Uncharacterized protein Rv0893c/MT0917","Gene-Name":"Rv0893c",
 *					    	 "%GC":" 60.63",
 *					    	 "Location":" Unknown",
 *					    	 "Chrom-Location":" 946",
 *					    	 "Strand-Direction":" -1",
 *					    	 "Cordon-Bias":" 0.07692",
 *					    	 "Funct-Class":" unknown",
 *					    	 "Degree":" 15",
 *					    	 "Betweenness":" 784.68",
 *					    	 "Closeness":" 0.24790",
 *					    	 "Eigen":" 0.00003",
 *					    	 "Hub":" N",
 *					    	 "Sass-Infect":" 0",
 *					    	 "Sass-Growth":" 0",
 *					    	 "GO-Growth":" 0",
 *					    	 "TDR":" 0",
 *					    	 "UniProt":" 0",
 *					    	 "DDTRP":" 0",
 *					    	 "Gas-Nic":" 0",
 *					    	 "#-Paralogs":" 11",
 *					    	 "Mtb-cplx":" 11",
 *					    	 "Mtb":" 7",
 *					    	 "Corynebacterineae":" 0",
 *					    	 "Actinomycetales":" 0",
 *					    	 "Actinobacteridae":" 0",
 *					    	 "Bacteria":"0",
 *					    	 "Non-bacteria":"0",
 *					    	 "H.sapiens":"0",
 *					    	 "in_leprae":"0",
 *					    	 "DN/DS":"0.48",
 *					    	 "Codon-Volatility":"0.1"
 *					   	}
 *					});			
 * 
 */
Biojs.DetailsFrame = Biojs.extend (
/** @lends Biojs.DetailsFrame# */
{
	constructor: function (options) {
		var self=this;
		var target =self.opt.target;
		var html =	'';
		if (self.opt.minizable)
			html += 	'		<div class="minimize to_minimize" " ></div>';
		if (self.opt.draggable)
			html += 	'		<div class="dragger" src="../../main/resources/css/images/draggable.png" ></div>';
		html += 	'		<header class="protein-label" />';
		html += 	'		<ul />';
		$("#"+target).addClass("floater");
		$("#"+target).append(html);
		self.updateFeatures();
		if (self.opt.minizable)
			$("#"+target+" .minimize").click(function(){
				if ($("#"+target+" ul").css('display') == "none"){
					$("#"+target+" ul").show();
					$(this).removeClass("minimized");
					$(this).addClass("to_minimize");
				}else{
					$("#"+target+" ul").hide();
					$(this).removeClass("to_minimize");
					$(this).addClass("minimized");
				}
			});
		if (self.opt.draggable){
			$("#"+target).draggable({cursor:"move",handle: ".dragger"});
			$("#"+target+" .dragger").on('mousedown', function(e) {
			    var $this = $(this);
			    e.preventDefault();

			    // Make every element on page unselectable
			    $('.top').addClass('unselectable');
			    $('.center').addClass('unselectable');

			    // Some setup here, like remembering the original location, etc
			    $(window).on('mousemove', function(e) {
			       // Do the thing!
			       $this.on('mouseup', function(e) {
			           $('.top').removeClass('unselectable');
			           $('.center').removeClass('unselectable');
			           // Other clean-up tasks here
			       });
			    });
			});
		}
	},

	/**
	 * Default values for the options
	 * @name Biojs.DetailsFrame-opt
	 */
	opt: {
		target: "YourOwnDivId",
		features: { "id":"Not loaded" },
		minizable:true,
		draggable:true
	},

	/**
	 * Array containing the supported event names
	 * @name Biojs.DetailsFrame-eventTypes
	 */	
	eventTypes: [
	    		 /**
	    		  * @name Biojs.DetailsFrame#onFeaturesUpdated
	    		  * @event
	    		  * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
	    		  * 	It gets activated when the features of the frame have been updated
				  *    
	    		  * @example 
	    		  * 	instance.onFeaturesUpdated(function( objEvent ) {
	    		  * 		alert("Features have been updated!"); 
	    		  * 	}); 
	    		  */
	             "onFeaturesUpdated"
	             ],
	             
	 /**
	  * The content of the frame can be changed by using this method.
	  * 
	  * @param {Object} details An object with the features to display in the Details Frame component.
	  * @example 
	  * instance.updateFeatures({id:"newId",description:"new description",newFeature:"its value",otherFeature:"another value"});
	  * 
	  */ 
	updateFeatures: function(features,order){
		var self=this;
		self.order=order;
		if (typeof features != "undefined")
			self.opt.features = features;
		var re = new RegExp("[A-NR-Z][0-9][A-Z][A-Z0-9][A-Z0-9][0-9]|[OPQ][0-9][A-Z0-9][A-Z0-9][A-Z0-9][0-9]");
		var m = re.exec(self.opt.features.id);
		if (m == null)
			$("#"+self.opt.target+" header").html(self.opt.features.id);
		else if (m.index==0)
			$("#"+self.opt.target+" header").html("<a href='http://www.uniprot.org/uniprot/"+self.opt.features.id+"' target='_new'>"+self.opt.features.id+"</a>");
		var html = 	'';
		if (typeof self.opt.features["description"] != "undefined")
			html +=	'			<li class="protein-description"><h2>'+self.opt.features["description"]+'</h2></li>';
		if (typeof order == "undefined")
			for (var i in self.opt.features){
				if ((i!="description") && (i!='id'))
					html +=	self._getListItem(i,self.opt.features[i],self.opt.features["organism"]);
			}
		else
			for (var i=0; i<order.length; i++){
				html +=	'			<li><b>'+order[i]+':</b>'+self.opt.features[order[i]]+'</li>';
			}
		var external = Object.keys(self._externalURL);
		if (m != null && m.index==0)
			html +=	self._getListItem("Search",external);
		$("#"+self.opt.target+" ul").html(html);
		for (var i=0;i<external.length;i++)
			$("."+external[i]).css("background-image","url('biosual/images/"+external[i]+".png')");
		self.raiseEvent('onFeaturesUpdated', {});
	},
	_externalURL:{
		"EBI":"http://www.ebi.ac.uk/ebisearch/search.ebi?db=allebi&query=",
		"NCBI":"http://www.ncbi.nlm.nih.gov/protein/",
		"INTERPRO":"http://www.ebi.ac.uk/interpro/protein/",
		"STRING":"http://string-db.org/newstring_cgi/show_network_section.pl?identifier=",
		"SWISS-MODEL":"http://swissmodel.expasy.org/repository/smr.php?sptr_ac="},
	_getListItem:function(key,value,organism){
		var self = this;
		organism=(typeof organism == "undefined")?"":organism;
		organism= organism.replace("(", "").replace(")", "").replace(/strain /gi, "").replace(/ /gi, "_");
		switch (key){
			case "organism":
				return '			<li><b>'+key+':</b> <a href="http://www.uniprot.org/taxonomy/?query='+value+'&sort=score" target="_new">'+value+'</a></li>';
			case "gene_name":
				return '			<li><b>'+key+':</b> <a href="http://ensemblgenomes.org/search/eg/'+value+" "+organism+'" target="_new">'+value+'</a></li>';
			case "Search":
				var html = '<li><b>'+key+':</b> ';
				for (var i=0;i<value.length;i++)
					html += '<a href="'+self._externalURL[value[i]]+self.opt.features.id+'" target="_new"><div class="external_search '+value[i]+'" ></div></a> ';
				html += '</li>';
				return html;
		}
		return '			<li><b>'+key+':</b> '+value+'</li>';
	}
});