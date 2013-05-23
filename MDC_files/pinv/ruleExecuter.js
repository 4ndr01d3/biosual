(function ($) {
  $(function () {
	  	$.fn.ruler={};
		$.fn.ruler.applyRules = function(self){
//			var self =this;
			var rules = Manager.widgets["ruler"].ruler.getActiveRules();
			var model = Manager.widgets["ruler"].rules;
			//Reseting the graph 

			var selector ="";
			for (var i=0;i<rules.length;i++){
				selector ="";
				var rule=rules[i];
				if (rule.target==model.target[0].name){ //Proteins
					var prefix =(rule.action.name=="Color" || rule.action.name=="Color By" || rule.action.name=="Border" || rule.action.name=="Border By")?"figure_":"node_";
					var prefix2=(rule.action.name=="Color" || rule.action.name=="Color By" || rule.action.name=="Border" || rule.action.name=="Border By")?".figure":".node";
					switch (rule.condition){
						case model.target[0].conditions[1].name: // interactions with
							//TODO: Add validations in case proteins have been deleted
							for (var j=0;j<self.graph.interactionsA[rule.parameters[0]].length;j++){
								selector +="[id ="+prefix+self.graph.interactionsA[rule.parameters[0]][j].name+"],";
							}
							selector = selector.substring(0, selector.length-1);
							break;
						case model.target[0].conditions[2].name: // number of interactions
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
						case model.target[0].conditions[3].name: // accession number
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
						case model.target[0].conditions[4].name: // features
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
						case model.target[0].conditions[0].name: // all
							selector = prefix2;
							break;
					}
				} else if (rule.target==model.target[1].name) { //Interactions
					switch (rule.condition){
						case model.target[1].conditions[1].name: // protein
							selector ="line[id *="+rule.parameters[0]+"]";
							break;
						case model.target[1].conditions[2].name: // proteins
							selector ="line[id *="+rule.parameters[0]+"][id *="+rule.parameters[1]+"]";
							break;
						case model.target[1].conditions[3].name: // score
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
						case model.target[1].conditions[4].name: // type of evidence
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
						case model.target[1].conditions[0].name: // all
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
						self.graph.showLegend(selector,rule.actionParameters[0]);
						break;
					case "Hide Label":
						self.graph.hideLegend(selector);
						break;
				}
				var affected = (selector=="")?0:self.graph.vis.selectAll(selector)[0].length;
				self.manager.widgets["ruler"].ruler.setAffectedByRule(rule.id,affected);
			}
		};	  	
		$.fn.ruler.applyRules2 = function(self){
//			var self =this;
			var rules = Manager.widgets["ruler"].ruler.getActiveRules();
			var model = Manager.widgets["ruler"].rules;
			//Reseting the graph 

			var selector ="";
			for (var i=0;i<rules.length;i++){
				selector ="";
				var rule=rules[i];
				if (rule.target==model.target[0].name){ //Proteins
					var prefix=(rule.action.name=="Color" || rule.action.name=="Color By")?"figure_":"node-";
					var prefix2=(rule.action.name=="Color" || rule.action.name=="Color By")?".figure":".node";
					switch (rule.condition){
						case model.target[0].conditions[1].name: // interactions with
							//TODO: Add validations in case proteins have been deleted
							for (var j=0;j<self.graph.interactionsA[rule.parameters[0]].length;j++){
								selector +="[id ="+prefix+self.graph.interactionsA[rule.parameters[0]][j].name+"],";
							}
							selector = selector.substring(0, selector.length-1);
							break;
						case model.target[0].conditions[2].name: // number of interactions
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
						case model.target[0].conditions[3].name: // accession number
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
						case model.target[0].conditions[4].name: // features
							var nodes= self.graph.proteins;
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
						case model.target[0].conditions[0].name: // all
							selector = prefix2;
							break;
					}
				} else if (rule.target==model.target[1].name) { //Interactions
					switch (rule.condition){
						case model.target[1].conditions[1].name: // protein
							selector =".link[id *="+rule.parameters[0]+"]";
							break;
						case model.target[1].conditions[2].name: // proteins
							selector =".link[id *="+rule.parameters[0]+"][id *="+rule.parameters[1]+"]";
							break;
						case model.target[1].conditions[3].name: // score
							var links= self.graph.interactions;
							for (var j in links){
								var link = links[j];
								var score=link.doc["unified_score"];
								switch (rule.parameters[0]){
									case "==":
										if (1*score==1*rule.parameters[1])
											selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
										break;
									case ">":
										if (1*score>1*rule.parameters[1])
											selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
										break;
									case "<":
										if (1*score<1*rule.parameters[1])
											selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
										break;
									case "<=":
										if (1*score<=1*rule.parameters[1])
											selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
										break;
									case ">=":
										if (1*score>=1*rule.parameters[1])
											selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
										break;
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[1].conditions[4].name: // type of evidence
							var links= self.graph.interactions;
							for (var j in links){
								var link = links[j];
								var score=link.doc[rule.parameters[0]];
								if (typeof score != "undefined" && score*1>0.0){
									selector +="[id=link-"+link.source.name+"-"+link.target.name+"],";
								}
							}
							if (selector.length>0) selector = selector.substring(0, selector.length-1);
							break;
						case model.target[1].conditions[0].name: // all
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
//				var affected = (selector=="")?0:self.graph.vis.selectAll(selector)[0].length;
//				self.manager.widgets["ruler"].ruler.setAffectedByRule(rule.id,affected);
			}
		};
		$.fn.ruler.applyRules3 = function(self){
			var rules = Manager.widgets["ruler"].ruler.getActiveRules();
			var model = Manager.widgets["ruler"].rules;
			var selectorTR ="",selectorTD ="";
			for (var i=0;i<rules.length;i++){
				selectorTR ="";
				selectorTD ="";
				var rule=rules[i];
				if (rule.target==model.target[0].name){ //Proteins
					switch (rule.condition){
						case model.target[0].conditions[0].name: // all
							selectorTD = ".cell_protein1, .cell_protein2";
							break;
						case model.target[0].conditions[1].name: // interactions with
							selectorTR = "tr[id*="+rule.parameters[0]+"], tr[id*="+rule.parameters[0]+"]"
							selectorTD = ".cell_protein1, .cell_protein2";
							break;
						case model.target[0].conditions[4].name: // features
							var added=[];
							for (var j in self.trIds){
								var node = self.trIds[j];
								
								var doc= self.oTable.$('tr', {"filter": "applied"}).filter("#"+node).data("doc");
								
								switch (rule.parameters[1]){
									case "equals":
										if  (doc["p1_"+rule.parameters[0]] == rule.parameters[2] )
											if (added.indexOf(doc["protein1"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein1']+"], .cell_protein2[content="+doc['protein1']+"],";
												added.push(doc["protein1"]);
											}
										if  (doc["p2_"+rule.parameters[0]] == rule.parameters[2] )
											if (added.indexOf(doc["protein2"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein2']+"], .cell_protein2[content="+doc['protein2']+"],";
												added.push(doc["protein2"]);
											}
										break;
									case "contains":
										if  (doc["p1_"+rule.parameters[0]].indexOf(rule.parameters[2])!=-1)
											if (added.indexOf(doc["protein1"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein1']+"], .cell_protein2[content="+doc['protein1']+"],";
												added.push(doc["protein1"]);
											}
										if  (doc["p2_"+rule.parameters[0]].indexOf(rule.parameters[2])!=-1)
											if (added.indexOf(doc["protein2"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein2']+"], .cell_protein2[content="+doc['protein2']+"],";
												added.push(doc["protein2"]);
											}
										break;
									case "different":
										if  (doc["p1_"+rule.parameters[0]] != rule.parameters[2] )
											if (added.indexOf(doc["protein1"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein1']+"], .cell_protein2[content="+doc['protein1']+"],";
												added.push(doc["protein1"]);
											}
										if  (doc["p2_"+rule.parameters[0]] != rule.parameters[2] )
											if (added.indexOf(doc["protein2"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein2']+"], .cell_protein2[content="+doc['protein2']+"],";
												added.push(doc["protein2"]);
											}
										break;
									case "not contains":
										if  (doc["p1_"+rule.parameters[0]].indexOf(rule.parameters[2])==-1)
											if (added.indexOf(doc["protein1"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein1']+"], .cell_protein2[content="+doc['protein1']+"],";
												added.push(doc["protein1"]);
											}
										if  (doc["p2_"+rule.parameters[0]].indexOf(rule.parameters[2])==-1)
											if (added.indexOf(doc["protein2"])==-1){
												selectorTD += " .cell_protein1[content="+doc['protein2']+"], .cell_protein2[content="+doc['protein2']+"],";
												added.push(doc["protein2"]);
											}
										break;
								}
							}
							if (selectorTD.length>0) selectorTD = selectorTD.substring(0, selectorTD.length-1);
							break;
						case model.target[0].conditions[3].name: // accession number
							switch (rule.parameters[0]){
								case "equals":
									selectorTD = ".cell_protein1[content="+rule.parameters[1]+"], .cell_protein2[content="+rule.parameters[1]+"]";
									break;
								case "contains":
									selectorTD = ".cell_protein1[content *=\""+rule.parameters[1]+"\"], .cell_protein2[content *=\""+rule.parameters[1]+"\"]";
									break;
								case "different":
									selectorTD = ".cell_protein1:not([content="+rule.parameters[1]+"]), .cell_protein2:not([content="+rule.parameters[1]+"])";
									break;
								case "not contains":
									selectorTD =".cell_protein1:not([content *="+rule.parameters[1]+"]),.cell_protein2:not([content *="+rule.parameters[1]+"])";
									break;

							}
							break;
						case model.target[0].conditions[2].name: // number of interactions
							for (var pos in self.ids){
								var id= self.ids[pos];
								
								var len = self.oTable.$('tr', {"filter": "applied"}).filter("[id *=\""+id+"\"]").length;
								
								switch (rule.parameters[0]){
									case "==":
										if (1*len==1*rule.parameters[1])
											selectorTD +=" .cell_protein1[content="+id+"], .cell_protein2[content="+id+"],";
										break;
									case ">":
										if (1*len>1*rule.parameters[1])
											selectorTD +=" .cell_protein1[content="+id+"], .cell_protein2[content="+id+"],";
										break;
									case "<":
										if (1*len<1*rule.parameters[1])
											selectorTD +=" .cell_protein1[content="+id+"], .cell_protein2[content="+id+"],";
										break;
									case "<=":
										if (1*len<=1*rule.parameters[1])
											selectorTD +=" .cell_protein1[content="+id+"], .cell_protein2[content="+id+"],";
										break;
									case ">=":
										if (1*len>=1*rule.parameters[1])
											selectorTD +=" .cell_protein1[content="+id+"], .cell_protein2[content="+id+"],";
										break;
								}
							}
							if (selectorTD.length>0) selectorTD = selectorTD.substring(0, selectorTD.length-1);
							break;
					}
					if (selectorTR!="" || selectorTD!="") switch (rule.action.name){
						case "Hide":
							self.hideCell(selectorTR,selectorTD);
							break;
						case "Show":
							self.showCell(selectorTR,selectorTD);
							break;
						case "Highlight":
							self.paintCell(selectorTR,selectorTD,"#00ff00");
							break;
						case "Border":
							self.paintBorderCell(selectorTR,selectorTD,rule.actionParameters[0]);
							break;
						case "Color":
							self.paintCell(selectorTR,selectorTD,rule.actionParameters[0]);
							break;
						case "Color By":
						case "Border By":
							var type = (rule.action.name=="Color By")?"color":"border";
							switch(rule.actionParameters[0]){
								case "Protein Queried":
									self.colorBySeed(selectorTR,selectorTD,type);
									break;
								case "Functional Class":
									self.colorByFeature(selectorTR,selectorTD,"funct_class",type);
									break;
								case "Gene Name":
									self.colorByFeature(selectorTR,selectorTD,"gene_name",type);
									break;
								case "Organism":
									self.colorByFeature(selectorTR,selectorTD,"organism",type);
									break;
							}
							break;
					}
				} else if (rule.target==model.target[1].name) { //Interactions
					var selectorTR ="";
					switch (rule.condition){
						case model.target[1].conditions[0].name: // all
							selectorTR ="tr[id *=cell_]";
							break;
						case model.target[1].conditions[1].name: // protein
							selectorTR ="tr[id*="+rule.parameters[0]+"]";
							break;
						case model.target[1].conditions[2].name: // proteins
							selectorTR ="tr#cell_"+rule.parameters[0]+"_"+rule.parameters[1]+", tr#cell_"+rule.parameters[1]+"_"+rule.parameters[2];
							break;
						case model.target[1].conditions[3].name: // score
							for (var j in self.trIds){
								var node = self.trIds[j];
								
								var doc= self.oTable.$('tr', {"filter": "applied"}).filter("#"+node).data("doc");
								var score=doc.unified_score;
								if (score!="" && score!="-" ){
									score=score*1.0;
									switch (rule.parameters[0]){
										case "==":
											if (score==1*rule.parameters[1])
												selectorTR +=" #"+node+",";
											break;
										case ">":
											if (score>1*rule.parameters[1])
												selectorTR +=" #"+node+",";
											break;
										case "<":
											if (score<1*rule.parameters[1])
												selectorTR +=" #"+node+",";
											break;
										case "<=":
											if (score<=1*rule.parameters[1])
												selectorTR +=" #"+node+",";
											break;
										case ">=":
											if (score>=1*rule.parameters[1])
												selectorTR +=" #"+node+",";
											break;
									}
								}
							}
							if (selectorTR.length>0) selectorTR = selectorTR.substring(0, selectorTR.length-1);
							break;
						case model.target[1].conditions[4].name: // type of evidence
							for (var j in self.trIds){
								var node = self.trIds[j];
								
								var doc= self.oTable.$('tr', {"filter": "applied"}).filter("#"+node).data("doc");
								var score=doc[rule.parameters[0]];
								if (typeof score != "undefined" && score!="" && score!="-" && score*1>0.0){
									selectorTR +=" #"+node+",";
								}
							}
							if (selectorTR.length>0) selectorTR = selectorTR.substring(0, selectorTR.length-1);
							break;
					}
					if (selectorTR!="") switch (rule.action.name){
						case "Hide":
							self.hideCell(selectorTR,selectorTD);
							break;
						case "Show":
							self.showCell(selectorTR,selectorTD);
							break;
						case "Highlight":
							self.paintRowBackground(selectorTR,"#00ff00");
							break;
						case "Border":
							self.paintRowBackground(selectorTR,rule.actionParameters[0]);
							break;
					}
				}
			}

		};	  	
  });
})(jQuery);
  