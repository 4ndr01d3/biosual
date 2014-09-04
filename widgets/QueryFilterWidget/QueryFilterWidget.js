(function ($) {
	AjaxSolr.QueryFilterWidget = AjaxSolr.AbstractWidget.extend({
		queries: {},
		total:0,
		width:160,
		height: 160,
		radius: 160 / 2,
		defined:false,
		currentFilter:"",
		ruler:null,
		mode:"",
		
		init: function(){
			var self = this;
			self.queries={};
			self.queried={};

			$('#filter_mask').show(); 
			$('#filter_container').show();

			if (self.ruler==null){
				$(".filter_img").click(function(){
					$('#filter_mask').show(); 
					$('#filter_container').show();
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Pre-Filters window opened",self.id);
					}
				});
				$("#filter_close").click(function(){
					$('.explain_close').hide(); 
					$('#filter_mask').hide(); 
					$('#filter_container').hide();
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Pre-Filters window closed",self.id);
					}
				});
				self.ruler = new Biojs.Ruler({
					target: self.target,
					allowOrdering:false,
					rules: self.rules
				});
				self.ruler.onRuleCreated(function(obj){
					$('.explain_close').hide(); 
					self.refreshGraphicFromCurrentFilters(self);
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Prefilter rule created",self.id,obj);
					}
				});
				self.ruler.onRuleRemoved(function(obj){
					self.refreshGraphicFromCurrentFilters(self);
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Prefilter rule removed",self.id,obj);
					}
				});
				self.ruler.onRuleEditing(function(obj){
					self.refreshGraphicFromCurrentFilters(self);
					if ( typeof Manager.widgets["provenance"] != "undefined") {
						Manager.widgets["provenance"].addAction("Prefilter rule edition",self.id,obj);
					}
				});
			}
			$(".filter_div .ruler .add_rule a").html("Add Filter");

			$(".filter_stats_chart").empty();
			self.color = d3.scale.category20();
			self.svg = d3.select(".filter_stats_chart").append("svg")
				.attr("width", self.width)
				.attr("height", self.height)
				.append("g")
				.attr("transform", "translate(0," + self.height / 2 + ")");

			var gotTotal= function(response){
				self.total = response.response.numFound;
				self.filtered=self.total;
				self.queries["total"]=self.total;
				self.restart();
				self.refreshTextFromCurrentFilters(self);
			};
			var q="*";
			self.prequery(q,gotTotal);




			$(".filter_button button").click(function(){
				$('.explain_close').hide(); 

				self.mode = $(this).val();
				self.executeClick(self);
				if ( typeof Manager.widgets["provenance"] != "undefined") {
					Manager.widgets["provenance"].addAction("Prefilters executed",self.id);
				}
			});
			self.refreshGraphicFromCurrentFilters(self);
			if (modelrequester!=null) modelrequester.done(function(p){
				self._fillDynamicFields();
			});

			$('#filter_mask').hide(); 
			$('#filter_container').hide();
		},
		setTotalProteins:function(total){
			var self = this;
			$("#"+self.id+" .filter_total_proteins").html(" "+total);
		},
		restart: function(){
			var self = this;
			var arc = d3.svg.arc()
				.innerRadius(function(d,i){
					return self.radius - 60 + (2*i);
				})
				.outerRadius(function(d,i){
					return self.radius - 30 - (2*i);
				})
				.startAngle(0)
				.endAngle(function(d){
					return (self.total==0)?0:Math.PI*(d.value/self.total);
				});
			
			var testData=d3.entries(self.queries);
			testData=testData.sort(function(a,b){
				return (a.value<b.value)?true:false;
			});

			self.svg.selectAll("path").remove();
			self.svg.selectAll("path")
				.data(testData)
				.enter().append("path")
				.attr("fill", function(d, i) { return self.color(i); })
				.attr("d", arc)
				.attr("stroke","lawngreen")
				.attr("stroke-width","0px")
				.on("mouseover",function(d){
					$(this).attr("stroke-width","2px");
//					$("#label_svg_filter").text(d.key+" ("+d.value+" Interactions)");
					if (d.key=="total")
						$(".filter_total").parent().addClass("overpie");
					else if (d.key=="All Filters")
						$(".filter_filtered").parent().addClass("overpie");
					else if (typeof self.contributionTags[d.key] != "undefined")
						$("."+self.contributionTags[d.key]).addClass("overpie");
				})
				.on("mouseleave",function(d){
					$(this).attr("stroke-width","0px");
//					$("#label_svg_filter").text("");
					if (d.key=="total")
						$(".filter_total").parent().removeClass("overpie");
					else if (d.key=="All Filters")
						$(".filter_filtered").parent().removeClass("overpie");
					else if (typeof self.contributionTags[d.key] != "undefined")
						$("."+self.contributionTags[d.key]).removeClass("overpie");
				});
		},
		prequery:function(query,callback){
			var self = this;
			var suffix="&rows=0&facet=false&facet.limit=0&json.nl=map&wt=json&json.wrf=?";
			if ( typeof private_key != "undefined" && private_key != null && private_key != "null")
				suffix += "&key="+private_key;
			jQuery.getJSON(this.manager.solrUrl + 'select?q=' +query + suffix, {}, callback);
		},
		queried:{},
		refreshTextFromCurrentFilters:function(self){
			$("#"+self.id+" .filter_total").html(" "+self.total);
			$("#"+self.id+" .filter_filtered").html(" "+self.filtered+" ("+(100*(self.filtered/self.total)).toFixed(2)+"%)");
			var table="";
			self.contributionTags={};
			var counter=1;
			for (var i in self.queries){
				if (i!="total" && i!="All Filters"){
					self.contributionTags[i]="css_"+counter;
					table += "<tr class=\"css_"+(counter++)+"\"><th>"+i+":</th><td> ("+(100*(self.queries[i]/self.total)).toFixed(2)+"%) "+self.queries[i]+"</td></tr>";
				}
			} 
			$("#"+self.id+" .filter_contributions").html(table);
		},
		prequeryAllFilters:function(callback){
			var self = this;
			var query="";
			var sep="";
//			if (Object.keys(self.queries).length<3)
//				return;
			for (var i in self.queries){
				if (i!="total" && i!="All Filters"){
					query += sep + i;
					sep= " AND ";
				}
			}
			if (typeof self.queried[query] != "undefined"){
				self.queries["All Filters"]=self.queried[query];
				self.currentFilter=query;
				self.filtered=self.queried[query];
				self.restart();
				self.refreshTextFromCurrentFilters(self);
			}else
				self.prequery(query, callback);
		},
		_solrScape:function(text){
			return text.replace(/[-[\]{}\[\]()*:\/~!+\"?\\^&|#\s]/g, "\\$&");
		},
		refreshGraphicFromCurrentFilters:function(self){
			var rules = self.ruler.getActiveRules();
			var model = self.rules;
			self.queries={};
			self.queries["total"]=self.total;
			self.filtered=self.total;
			self.currentFilter="";
			
			var callback4AllFilterPrequery=function(response){
				response.allFilters=true;
				self.currentFilter=response.responseHeader.params.q;
				callback4Prequery(response);
			};
			var callback4Prequery=function(response){
				var label = (response.allFilters)?"All Filters":response.responseHeader.params.q;
				self.queried[response.responseHeader.params.q]=response.response.numFound;
				self.queries[label]=response.response.numFound;
				self.restart();
				self.refreshTextFromCurrentFilters(self);
				if(Object.keys(self.queries).length==rules.length+1)
					self.prequeryAllFilters(callback4AllFilterPrequery);
				if (response.allFilters){
					self.filtered=response.response.numFound;
					self.refreshTextFromCurrentFilters(self);
				}
			};

			
			for (var i=0;i<rules.length;i++){
				var rule=rules[i];
				var query="";
				if (rule.target==model.target[0].name){ //Proteins
					switch (rule.condition){
						case model.target[0].conditions[0].name: // feature
							if (rule.parameters[0]=="id"){
								switch (rule.parameters[1]){
									case "equals":
										query = (rule.parameters[2]=="")?'(-p1:["" TO *] AND -p2:["" TO *])':'(p1:'+rule.parameters[2]+' AND p2:'+rule.parameters[2]+')';
										break;
									case "contains":
										query ='(p1:*'+rule.parameters[2]+'* AND p2:*'+rule.parameters[2]+'*)';
										break;
									case "different":
										query = (rule.parameters[2]=="")?'*':'-(p1:'+rule.parameters[2]+' AND p2:'+rule.parameters[2]+')';
										break;
									case "not contains":
										query ='-(p1:*'+rule.parameters[2]+'* AND p2:*'+rule.parameters[2]+'*)';
										break;
								}
								
							}else{
								switch (rule.parameters[1]){
									case "equals":
										query = (rule.parameters[2]=="")?'(-p1_'+self._solrScape(rule.parameters[0])+':["" TO *] AND -p2_'+self._solrScape(rule.parameters[0])+':["" TO *])':'(p1_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+' AND p2_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+')';
										break;
									case "contains":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'* AND p2_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'*)';
										break;
									case "different": //TODO: solar query not working as expected: * AND !(-p1_gpl51\-01_\(gsm854\)_heat_shock_05_min:["" TO *] AND -p2_gpl51\-01_\(gsm854\)_heat_shock_05_min:["" TO *])
										query ='-(p1_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+' AND p2_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+')';
										break;
									case "not contains":
										query ='-(p1_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'* AND p2_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'*)';
										break;
									case ">":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':['+rule.parameters[2]+' TO *] AND p2_'+self._solrScape(rule.parameters[0])+':['+rule.parameters[2]+' TO *])';
										break;
									case "<":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':[* TO '+rule.parameters[2]+'] AND p2_'+self._solrScape(rule.parameters[0])+':[* TO '+rule.parameters[2]+'])';
										break;
								}
							}
						case model.target[0].conditions[1].name: // number of interactions
							break;
					}
				}				
				else if (rule.target==model.target[1].name){ //Interactions
					switch (rule.condition){
						case model.target[1].conditions[0].name: // score
							switch (rule.parameters[0]){
								case "==":
									query ='score:'+rule.parameters[1];
									break;
								case ">":
									query ='score:['+(rule.parameters[1]*1+0.000001)+' TO *]';
									break;
								case "<":
									query ='score:[* TO '+(rule.parameters[1]*1-0.000001)+']';
									break;
								case ">=":
									query ='score:['+rule.parameters[1]*1+' TO *]';
									break;
								case "<=":
									query ='score:[* TO '+rule.parameters[1]*1+']';
									break;
							}
							break;
						case model.target[1].conditions[1].name: // type of evidence
							query =rule.parameters[0]+':[0.01 TO *]';
							break;
						case model.target[1].conditions[2].name: //  one of its proteins
							if (rule.parameters[0]=="id"){
								switch (rule.parameters[1]){
									case "equals":
										query ='(p1:'+rule.parameters[2]+' OR p2:'+rule.parameters[2]+')';
										break;
									case "contains":
										query ='(p1:*'+rule.parameters[2]+'* OR p2:*'+rule.parameters[2]+'*)';
										break;
									case "different":
										query ='-(p1:'+rule.parameters[2]+' OR p2:'+rule.parameters[2]+')';
										break;
									case "not contains":
										query ='-(p1:*'+rule.parameters[2]+'* OR p2:*'+rule.parameters[2]+'*)';
										break;
								}
								
							}else{
								switch (rule.parameters[1]){
									case "equals":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+' OR p2_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+')';
										break;
									case "contains":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'* OR p2_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'*)';
										break;
									case "different":
										query ='-(p1_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+' OR p2_'+self._solrScape(rule.parameters[0])+':'+rule.parameters[2]+')';
										break;
									case "not contains":
										query ='-(p1_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'* OR p2_'+self._solrScape(rule.parameters[0])+':*'+rule.parameters[2]+'*)';
										break;
									case ">":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':['+rule.parameters[2]+' TO *] OR p2_'+self._solrScape(rule.parameters[0])+':['+rule.parameters[2]+' TO *])';
										break;
									case "<":
										query ='(p1_'+self._solrScape(rule.parameters[0])+':[* TO '+rule.parameters[2]+'] OR p2_'+self._solrScape(rule.parameters[0])+':[* TO '+rule.parameters[2]+'])';
										break;
								}
							}

					}
				}				
				if (typeof self.queried[query] == "undefined") {
					self.prequery(query,callback4Prequery);
				}else{
					self.queries[query]=self.queried[query];
					if(Object.keys(self.queries).length==rules.length+1)
						self.prequeryAllFilters(callback4AllFilterPrequery);
				}
			}
			self.restart();
			self.refreshTextFromCurrentFilters(self);
		},
		afterRequest: function () {
			var self = this;
			$('#filter_mask').hide(); 
			$('#filter_container').hide();
			self._fillDynamicFields();
//			if (self.onceOffStatus!=null){
//				self.uploadStatus(self.onceOffStatus);
//				self.onceOffStatus=null;
//			}
		},
		_fillDynamicFields: function(){
			var self = this;
		    for (var i in self.dynamicRuleField){
		    	var drf = self.dynamicRuleField[i];
		    	var values=[];
		    	if (typeof drf.otherValues != "undefined")
		    		values =drf.otherValues;
		    	values = values.concat(self.manager.widgets[drf.widget][drf.parameter]);
		    	
		    	if (typeof drf.condition != 'undefined')
		    		self.rules.target[drf.target].conditions[drf.condition].values=values;
		    	else if (typeof drf.action != 'undefined')
		    		self.rules.target[drf.target].action[drf.action].options=values;
		    }			
		},
		executeClick:function(self){
			var option = self.mode;//$("input[name='filter_action']:checked").val();
			var rules = self.ruler.getActiveRules();
			self.defined = (rules.length>0);
			if (!self.defined){
				$(".filter_img").attr("src","biosual/widgets/QueryFilterWidget/filter1.png");
				alert("WARNING! No Filter have been defined.");
				return;
			}else {
				$(".filter_img").attr("src","biosual/widgets/QueryFilterWidget/filter2.png");
			}
			switch(option){
				case "future":
					self.manager.widgets["requester"].setFilter(self.currentFilter);
					break;
				case "past":
					self.manager.widgets["requester"].setFilter(self.currentFilter);
					var qs= self.manager.widgets["requester"].getQueries().slice(0);
					var requestedProteins= self.manager.widgets["requester"].requestedProteins;
					for (var i=0;i<qs.length;i++){
						var q=qs[i],m=requestedProteins[qs[i]].type;
						self.manager.widgets["requester"].removeQuery(q);
						self.manager.widgets["requester"].request(q,m);
					}
					break;
				case "explicit":
					if (self.filtered>2000){
						if(!confirm("The current filter is going to fetch "+self.filtered+" interactions. This might take a while. Are you sure?"))
							return;
					}
						
					self.manager.widgets["requester"].setFilter(self.currentFilter);
					self.manager.widgets["requester"].request("*","explicit");
					break;
				case "full":
					if (self.filtered>1000){
						if(!confirm("The current filter is going to fetch "+self.filtered+" interactions. This might take a while. Are you sure?"))
							return;
					}
					
					self.manager.widgets["requester"].setFilter(self.currentFilter);
					self.manager.widgets["requester"].request("*");
					break;
			}
			$("#filter_close").click();
		},
		status2JSON:function(){
			var self = this;
			return {
				"rules":self.ruler.getActiveRules(),
				"option":self.mode//$("input[name='filter_action']:checked").val()
			};
		},
		onceOffStatus:null,
		uploadStatus:function(json){
			var self = this;
//			if (self.previousRequest=="*:*"){
//				self.onceOffStatus=json;
//				return;
//			}
			for (var i=0;i<json.rules.length;i++){
				self.ruler.addActiveRule(json.rules[i]);
			}
			//$("#"+json.option).attr('checked', 'checked');
			self.mode = json.option;
			self.defined = (self.ruler.getActiveRules().length>0);
			if (!self.defined)
				$(".filter_img").attr("src","biosual/widgets/QueryFilterWidget/filter1.png");
			else{
				$(".filter_img").attr("src","biosual/widgets/QueryFilterWidget/filter2.png");
				
				//the timeout is to give some time to the responses to build the current filter
				setTimeout(function(){
					self.manager.widgets["requester"].setFilter(self.currentFilter);
				},500);
				
			}

		}
	});
})(jQuery);