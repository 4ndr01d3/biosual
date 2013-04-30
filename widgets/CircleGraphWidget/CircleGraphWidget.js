(function ($) {
	AjaxSolr.CircleGraphWidget = AjaxSolr.AbstractWidget.extend({
		graph:null,
		previousRequest:null,
		selected:null,
		lastClick:0,
		visibleProteins:[],
		orderInteractionsFeatures:[	"protein1",
		                           	"organism1",
				                    "protein2",
		                           	"organism2",
				                    "unified_score",
				                    "cooccurrence",
		                          	"domain",
		                          	"experimental",
				                    "fusion",
				                    "interlogs",
				                    "knowledge",
				                    "microarray",
				                    "neighborhood",
				                    "pdb",
				                    "similarity",
				                    "txt_mining"
		                      ],
  		orderProteinFeatures:[	
								"gene_name",
								"organism",
								"location",
								"funct_class",
								"chrom_location",
								"actinobacteridae",
								"actinomycetales",
								"bacteria",
								"betweenness",
								"closeness",
								"codon_volatility",
								"corynebacterineae",
								"cordon_bias",
								"ddtrp",
								"degree",
								"dn_vs_ds",
								"eigen",
								"gas_nic",
								"go_growth",
								"h.sapiens",
								"hub",
								"in_leprae",
								"mtb",
								"mtb_cplx",
								"non_bacteria",
								"num_paralogs",
								"percentage_gc",
								"sass_growth",
								"sass_infect",
								"strand_direction",
								"tdr",
								"uniprot"
		                      ],
		
		init: function () {
			var self =this;
			$("#"+this.target).empty();
//			self.nodeA = Array(); // Associative array  [id]->Node
			self.graph = new Biojs.InteractionsBundleD3({
				target: self.target,
				width: "800",
				height: "800"
			});			
			var self = this;
		    for (var i in self.predefined_stylers){
		    	var styler = self.predefined_stylers[i];
		    	self.registerStyler(styler.id,function(styler){ 
		    		return function () {
		    			$.fn[styler.id][styler.method](self);
		    		};
		    	}(styler));
		    }			
		
		},
		afterRequest: function () {
			var self =this;
			if(self.manager.store.get('q').val()=="*:*")
				self.resetGraphic();
			if (self.previousRequest!=null && self.previousRequest=="*:*"){
				$("#"+this.target).empty();
//				self.nodeA = Array();
				self.graph.resetGraphic();
				self.graph = new Biojs.InteractionsBundleD3({
				    target: self.target,
					width: "800",
					height: "800"
				});			
			}
				
			self.interactions = Array(); 
			var proteins = [];//this._getProteinsFromQuery();

			
			var singleProt = (this.manager.response.responseHeader.params.rows=="1");
			var queried=this.manager.response.responseHeader.params.q;
			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				var n1=0,n2=0;
				doc.organism1 = (typeof doc.organism1 == 'undefined')?'undefined':doc.organism1;
				doc.organism2 = (typeof doc.organism2 == 'undefined')?'undefined':doc.organism2;
				
				if (!singleProt || queried.indexOf(doc.protein1)!=-1){
					if (typeof self.graph.proteins[doc.protein1] == "undefined"){
						var feats = self._getProteinFeaturesFromDoc(doc, "p1_");
						feats.organism =doc.organism1;
						n1 = self.graph.addProtein({
							"id":doc.protein1,
							"name":doc.protein1,
							"showLegend":false,
							"typeLegend":"id",
							"organism":doc.organism1,
							"features":feats}) -1;
	//					self.graph.proteins[doc.protein1]=n1;
					}else
						n1 = self.graph.proteins[doc.protein1];
				}
				if (!singleProt || queried.indexOf(doc.protein2)!=-1){
					if (typeof self.graph.proteins[doc.protein2] == "undefined"){
						var feats = self._getProteinFeaturesFromDoc(doc, "p2_");
						feats.organism =doc.organism2;
						n2 = self.graph.addProtein({
							"id":doc.protein2,
							"name":doc.protein2,
							"showLegend":false,
							"typeLegend":"id",
							"organism":doc.organism2,
							"features":feats}) -1;
	//					self.nodeA[doc.protein2]=n2;
					}else
						n2 = self.graph.proteins[doc.protein2];
				}
				if (!singleProt){
					doc.id=doc.protein1 +" - "+ doc.protein2;
					self.graph.addInteraction(doc.protein1, doc.protein2,{score:doc["unified-score"],doc:self._getInteractionFeaturesFromDoc(doc)});
				}
			}
			self.graph.restart();
			self.graph.interactionClick( function(d){
				var newClick = (new Date()).getTime();
				if (newClick-self.lastClick<300)
					return;
				self.lastClick=newClick;
				if (d.interaction.source.id+"_"+d.interaction.target.id==self.selected){
					self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
					self.selected=null;
					Manager.widgets.info.fillDetails({id:"Selection Empty"});
				}else{
					Manager.widgets.info.fillDetails(d.interaction.doc,self.orderInteractionsFeatures);
					if (self.selected!=null){
						if (self.selected.indexOf("_")==-1)
							$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
						else
							self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
					}
					self.graph.setColor('[id="link_'+d.interaction.source.id+"_"+d.interaction.target.id+'"]',"#000");
					self.selected=d.interaction.source.id+"_"+d.interaction.target.id;
				}
			});

			self.previousRequest=self.manager.store.get('q').val();
			
			
			self.visibleProteins = Object.keys(self.graph.proteins);
			self.executeStylers();
			
			
		},	
		setSize: function(size){
			var self=this;
			var s=size.split("x");
			self.graph.setSize(s[0],s[1]);
			self.executeStylers();

		},
		proteinClick: function(d){
			var self=this;
			var newClick = (new Date()).getTime();
			if (newClick-self.lastClick<300)
				return;
			self.lastClick=newClick;
			if (d.protein.name==self.selected){
				$('[id="node-'+self.selected+'"] .figure').css("stroke",'');
				self.selected=null;
//				Manager.info.updateFeatures({id:"Selection Empty"});
			}else{
//				Manager.info.updateFeatures(d.protein.features,self.orderProteinFeatures);
				if (self.selected!=null){
					if (self.selected.indexOf("_")==-1)
						$('[id="node-'+self.selected+'"] .figure').css("stroke",'');
					else
						self.graph.setColor('[id="link-'+self.selected+'"]',"#999");
				}
				self.graph.setColor('[id="node-'+d.protein.name+'"] .figure',"#000");
				self.selected=d.protein.name;
			}
		},
		overProtein: function( objEvent ) {
			var self=this;
			self.graph.highlight("path.link.target-" + objEvent.protein.key);
			self.graph.highlight("path.link.source-" + objEvent.protein.key);
			self.graph.setColor("#node-" + objEvent.protein.key,'#0f0');
			//alert("The mouse is over the protein " + objEvent.protein.id);
		},
		outOfProtein: function( objEvent ) {
			var self=this;
			self.graph.setColor("#node-" + objEvent.protein.key,'');
			self.graph.setColor("path.link.target-" + objEvent.protein.key,"");
			self.graph.setColor("path.link.source-" + objEvent.protein.key,"");
			self.executeStylers();
		},
		_getInteractionFeaturesFromDoc: function(doc){
			features = {};
			for (var key in doc){
				if (key.indexOf("p1_")==-1 && key.indexOf("p2_")==-1)
					features[key]=doc[key];
			}
			return features;
		},
		_getProteinFeaturesFromDoc: function(doc, prefix){
			features = {};
			if (prefix=="p1_") 
				features["id"]=doc.protein1;
			else if (prefix=="p2_") 
				features["id"]=doc.protein2;
			for (var key in doc){
				if (key.indexOf(prefix)==0)
					features[key.substr(3)]=doc[key];
			}
			return features;
		},
		_getProteinsFromQuery: function(){
			var self=this;
			return self.manager.widgets["requester"].getQueries();
		},
		_getGroup: function(doc, proteins){
			if (proteins.length<=1) 
				return 0;
			for (var i = 0, l = proteins.length; i < l; i++) {
				if (doc.protein1==proteins[i] || doc.protein2==proteins[i] )
					return i;
			}
			return -1;
		},
		getColor: function(group){
			var self=this;
			return self.graph.color(group);
		},
		removeProtein: function(protein,excludelist){
			var self =this;
			self.graph.removeProtein(protein,excludelist);
			self.graph.restart();
		},
		removeProteinForce: function(protein){
			var self =this;
			self.graph.removeProteinForce(protein);
			self.graph.restart();
		},
		resetGraphic: function(){
			var self=this;
			self.graph.resetGraphic();
			self.graph.restart();
		},
		colorByFeature: function(self,feature,selector,type){
			selector = (typeof selector=="undefined")?".figure":selector;
			var classes =[];
			for (var i in self.graph.proteins){
				var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
				var g = classes.indexOf(c);
				if (g==-1){
					g = classes.length;
					classes.push(c);
				}
				self.graph.proteins[i].group=g;
			}
			if (typeof type != "undefined" && type=="color")
				self.colorBy(self,selector);
			else
				self.borderBy(self,selector);
		},
		colorBySeed: function(self,selector,type){
			selector = (typeof selector=="undefined")?".figure":selector;
			var proteins = this._getProteinsFromQuery();
			for (var j=proteins.length-1;j>=0;j--){
				for (var i=0;i<self.graph.interactions.length;i++){
					if (self.graph.interactions[i].source.id==proteins[j]){
						self.graph.interactions[i].source.group=j;
						self.graph.interactions[i].target.group=j;
					}
					if (self.graph.interactions[i].target.id==proteins[j]){
						self.graph.interactions[i].source.group=j;
						self.graph.interactions[i].target.group=j;
					}
				}
			}
			if (typeof type != "undefined" && type=="color")
				self.colorBy(self,selector);
			else
				self.borderBy(self,selector);
		},
		colorBy:function(self,selector){
			self.graph.vis.selectAll(selector).style("fill", function(d) {       	
				return self.getColor(d.group);   
			});
		},
		borderBy:function(self,selector){
			self.graph.vis.selectAll(selector).style("stroke", function(d) {       	
				return self.getColor(d.group);   
			});
		},
		_getTypeLegend: function(label){
			switch(label){
				case "Functional Class":
					return "features.funct_class";
				case "Organism":
					return "organism";
				case "Gene Name":
					return "features.gene_name";
				default:
					return "id";
			}
		}, 
		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			self.graph.setFillColor(".figure",null);
			self.graph.vis.selectAll(".node").attr("visibility", 'visible').style("stroke","#fff");
			self.graph.vis.selectAll(".link").attr("visibility", 'visible').style("stroke","#999");
			self.graph.vis.selectAll(".legend").attr("visibility",function(d) { return (d.showLegend)?"visible":"hidden";});
			for (var i in self.stylers){
//				console.debug("styler:"+i);
				self.stylers[i]();
			}
		},
		removeStyler:function(name){
			var self = this;
			delete self.stylers[name];
		},
		afterRemove: function (facet) {
			var self=this;
			var qs= self.manager.widgets["requester"].getQueries();
			self.removeProtein(facet,qs);
			self.visibleProteins = Object.keys(self.graph.proteins);
			self.executeStylers();
		},
		stylers:{}
	});
})(jQuery);