(function ($) {
	AjaxSolr.GraphWidget = AjaxSolr.AbstractWidget.extend(Biojs).extend({
		graph:null,
		previousRequest:null,
		selected:null,
		lastClick:0,
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
			self.graph = new Biojs.InteractionsD3({
				target: self.target,
				radius: 10,
				height: "650" 

			});			
		
		},
		afterRequest: function () {
			var self =this;
			if(self.manager.store.get('q').val()=="*:*")
				self.resetGraphic();
			if (self.previousRequest!=null && self.previousRequest=="*:*"){
				$("#"+this.target).empty();
//				self.nodeA = Array();
				self.graph.resetGraphic();
				self.graph = new Biojs.InteractionsD3({
				     target: self.target,
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
					if (typeof self.graph.proteinsA[doc.protein1] == "undefined"){
						var feats = self._getProteinFeaturesFromDoc(doc, "p1_");
						feats.organism =doc.organism1;
						n1 = self.graph.addProtein({
							"id":doc.protein1,
							"name":doc.protein1,
							"showLegend":false,
							"typeLegend":"id",
							"organism":doc.organism1,
							"features":feats}) -1;
	//					self.graph.proteinsA[doc.protein1]=n1;
					}else
						n1 = self.graph.proteinsA[doc.protein1];
				}
				if (!singleProt || queried.indexOf(doc.protein2)!=-1){
					if (typeof self.graph.proteinsA[doc.protein2] == "undefined"){
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
						n2 = self.graph.proteinsA[doc.protein2];
				}
				if (!singleProt){
					doc.id=doc.protein1 +" - "+ doc.protein2;
					self.graph.addInteraction(doc.protein1, doc.protein2,{score:doc["unified-score"],doc:self._getInteractionFeaturesFromDoc(doc)});
				}
			}
			self.graph.restart();
			self.graph.proteinClick( function(d){
				var newClick = (new Date()).getTime();
				if (newClick-self.lastClick<300)
					return;
				self.lastClick=newClick;
				if (d.protein.name==self.selected){
					$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
					self.selected=null;
					Manager.info.updateFeatures({id:"Selection Empty"});
				}else{
					Manager.info.updateFeatures(d.protein.features,self.orderProteinFeatures);
					if (self.selected!=null){
						if (self.selected.indexOf("_")==-1)
							$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
						else
							self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
					}
					self.graph.setColor('[id="node_'+d.protein.name+'"] .figure',"#000");
					self.selected=d.protein.name;
				}
			});
			self.graph.interactionClick( function(d){
				var newClick = (new Date()).getTime();
				if (newClick-self.lastClick<300)
					return;
				self.lastClick=newClick;
				if (d.interaction.source.id+"_"+d.interaction.target.id==self.selected){
					self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
					self.selected=null;
					Manager.info.updateFeatures({id:"Selection Empty"});
				}else{
					Manager.info.updateFeatures(d.interaction.doc,self.orderInteractionsFeatures);
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
//			self.registerStyler("rules",function () {self.applyRules(self);});
			self.executeStylers();
//			$('.node').contextMenu('myMenu1', {
//				bindings: Manager.widgets["context"].bindings,
//				menuStyle:Manager.widgets["context"].menuStyle,
//				itemStyle:Manager.widgets["context"].itemStyle,
//				itemHoverStyle:Manager.widgets["context"].itemHoverStyle,
//			});
			//self.colorBySeed();
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
			return self.manager.widgets["currentsearch"].proteins;
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
			for (var i=0;i<self.graph.proteins.length;i++){
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
		applyRules: function(self){
//			var self =this;
			var rules = self.manager.widgets["ruler"].ruler.getActiveRules();
			var model = self.manager.widgets["ruler"].rules;
			//Reseting the graph 

			var selector ="";
			for (var i=0;i<rules.length;i++){
				selector ="";
				var rule=rules[i];
				if (rule.target==model.target[0].name){ //Proteins
					var prefix=(rule.action.name=="Color" || rule.action.name=="Color By")?"figure_":"node_";
					var prefix2=(rule.action.name=="Color" || rule.action.name=="Color By")?".figure":".node";
					switch (rule.condition){
						case model.target[0].conditions[0].name: // interactions with
							//TODO: Add validations in case proteins have been deleted
							for (var j=0;j<self.graph.interactionsA[rule.parameters[0]].length;j++){
								selector +="[id ="+prefix+self.graph.interactionsA[rule.parameters[0]][j].name+"],";
							}
							selector = selector.substring(0, selector.length-1);
							break;
						case model.target[0].conditions[1].name: // number of interactions
							for (var interaction in self.graph.interactionsA){
								switch (rule.parameters[0]){
									case "==":
										if (self.graph.interactionsA[interaction].length==1*rule.parameters[1])
											selector +="[id="+prefix+interaction+"],";
										break;
									case ">":
										if (self.graph.interactionsA[interaction].length>1*rule.parameters[1])
											selector +="[id="+prefix+interaction+"],";
										break;
									case "<":
										if (self.graph.interactionsA[interaction].length<1*rule.parameters[1])
											selector +="[id="+prefix+interaction+"],";
										break;
									case "<=":
										if (self.graph.interactionsA[interaction].length<=1*rule.parameters[1])
											selector +="[id="+prefix+interaction+"],";
										break;
									case ">=":
										if (self.graph.interactionsA[interaction].length>=1*rule.parameters[1])
											selector +="[id="+prefix+interaction+"],";
										break;
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[0].conditions[2].name: // accession number
							switch (rule.parameters[0]){
								case "equals":
									selector ="#"+prefix+rule.parameters[1];
									break;
								case "contains":
									selector =prefix2+"[id *=\""+rule.parameters[1]+"\"]";
									break;
								case "different":
									selector =prefix2+':not([id="node_'+rule.parameters[1]+'"])';
									break;
								case "not contains":
									selector =prefix2+":not([id *="+rule.parameters[1]+"])";
									break;
							}
							break;
						case model.target[0].conditions[3].name: // features
							var nodes= self.graph.force.nodes();
							for (var j in nodes){
								var node = nodes[j];
								var value= node.features[rule.parameters[0]];
								switch (rule.parameters[1]){
									case "equals":
										if  (value == rule.parameters[2] )
											selector +="[id="+prefix+node.id+"],";
										break;
									case "contains":
										if (value.indexOf(rule.parameters[2])!=-1)
											selector +="[id="+prefix+node.id+"],";
										break;
									case "different":
										if (value!=rule.parameters[2]){
											selector +="[id="+prefix+node.id+"],";
										}
										break;
									case "not contains":
										if (value.indexOf(rule.parameters[2])==-1)
											selector +="[id="+prefix+node.id+"],";
										break;
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[0].conditions[4].name: // all
							selector = prefix2;
							break;
					}
				} else if (rule.target==model.target[1].name) { //Interactions
					switch (rule.condition){
						case model.target[1].conditions[0].name: // protein
							selector ="line[id *="+rule.parameters[0]+"]";
							break;
						case model.target[1].conditions[1].name: // proteins
							selector ="line[id *="+rule.parameters[0]+"][id *="+rule.parameters[1]+"]";
							break;
						case model.target[1].conditions[2].name: // score
							var links= self.graph.force.links();
							for (var j in links){
								var link = links[j];
								var score=link.doc["unified_score"];
								switch (rule.parameters[0]){
									case "==":
										if (1*score==1*rule.parameters[1])
											selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
										break;
									case ">":
										if (1*score>1*rule.parameters[1])
											selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
										break;
									case "<":
										if (1*score<1*rule.parameters[1])
											selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
										break;
									case "<=":
										if (1*score<=1*rule.parameters[1])
											selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
										break;
									case ">=":
										if (1*score>=1*rule.parameters[1])
											selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
										break;
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[1].conditions[3].name: // type of evidence
							var links= self.graph.force.links();
							for (var j in links){
								var link = links[j];
								var score=link.doc[rule.parameters[0]];
								if (typeof score != "undefined" && score*1>0.0){
									selector +="[id=link_"+link.source.name+"_"+link.target.name+"],";
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[1].conditions[4].name: // all
							selector =".link";
							break;
					}					
				}
				if (selector!="") switch (rule.action.name){
					case "Hide":
						self.graph.hide(selector);
						break;
					case "Show":
						self.graph.show(selector);
						break;
					case "Highlight":
						self.graph.highlight(selector);
						break;
					case "Border":
						self.graph.setColor(selector,rule.actionParameters[0]);
						break;
					case "Color":
						self.graph.setFillColor(selector,rule.actionParameters[0]);
						break;
					case "Color By":
					case "Border By":
						var type = (rule.action.name=="Color By")?"color":"border";
						switch(rule.actionParameters[0]){
							case "Protein Queried":
								self.colorBySeed(self,selector,type);
								break;
							case "Functional Class":
								self.colorByFeature(self,"funct_class",selector,type);
								break;
							case "Gene Name":
								self.colorByFeature(self,"gene_name",selector,type);
								break;
							case "Organism":
								self.colorByFeature(self,"organism",selector,type);
								break;
						}
						break;
					case "Show Label":
						self.graph.showLegend(selector,self._getTypeLegend(rule.actionParameters[0]));
						break;
					case "Hide Label":
						self.graph.hideLegend(selector);
						break;
				}
				var affected = (selector=="")?0:self.graph.vis.selectAll(selector)[0].length;
				self.manager.widgets["ruler"].ruler.setAffectedByRule(rule.id,affected);
			}
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
			self.graph.vis.selectAll("line").attr("visibility", 'visible').style("stroke","#999");
			self.graph.vis.selectAll(".legend").attr("visibility",function(d) { return (d.showLegend)?"visible":"hidden";});
			for (var i in self.stylers){
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
		},
		stylers:{}
	});
})(jQuery);