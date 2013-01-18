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
		};
  });
})(jQuery);
  