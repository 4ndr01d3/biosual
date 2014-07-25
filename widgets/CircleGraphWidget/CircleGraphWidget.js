(function ($) {
	AjaxSolr.CircleGraphWidget = AjaxSolr.AbstractWidget.extend({
		graph:null,
		previousRequest:null,
		selected:null,
		lastClick:0,
		visibleProteins:[],
		
		init: function () {
			var self =this;
			$("#"+this.target).empty();
			self.fields=self.manager.widgets["requester"].fields;
			self.prefixes=self.manager.widgets["requester"].prefixes;
			self.graph = new Biojs.InteractionsBundleD3({
				target: self.target,
				width: (typeof self.width == "undefined")?"800":self.width,
				height: (typeof self.height == "undefined")?"800":self.height 
			});			
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
			var currentQ=this.manager.response.responseHeader.params.q;
//			if(currentQ=="*:*")
//				self.resetGraphic();
//			else
				currentQ=currentQ.substr(5);
			
//			if (self.previousRequest!=null ){//}&& self.previousRequest=="*:*"){
//				$("#"+this.target).empty();
//				self.graph.resetGraphic();
//				self.graph = new Biojs.InteractionsBundleD3({
//				    target: self.target,
//					width: (typeof self.width == "undefined")?"800":self.width,
//					height: (typeof self.height == "undefined")?"800":self.height 
//				});			
//			}
				
			self.interactions = Array(); 
			
//			var type = (currentQ=="*:*")?"normal":self.manager.widgets["requester"].requestedProteins[currentQ].type;
			var type = self.manager.widgets["requester"].requestedProteins[currentQ].type;
			
			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				doc.organism1 = (typeof doc.organism1 == 'undefined')?'undefined':doc.organism1;
				doc.organism2 = (typeof doc.organism2 == 'undefined')?'undefined':doc.organism2;
				if (type=="normal" || type=="recursive"){
					self.addProtein(doc,self.fields["p1"], self.prefixes["p1"],self.fields["organism1"]);
					self.addProtein(doc,self.fields["p2"], self.prefixes["p2"],self.fields["organism2"]);
	
					doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
					self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
				}else{
					var queried=this.manager.response.responseHeader.params.q;
					if (queried.indexOf(doc[self.fields["p1"]])!=-1){
						self.addProtein(doc,self.fields["p1"], self.prefixes["p1"],self.fields["organism1"]);
						if (typeof self.graph.proteins[doc[self.fields["p2"]]] != "undefined"){
							doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
							self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
						}
					} else if (queried.indexOf(doc[self.fields["p2"]])!=-1){
						self.addProtein(doc,self.fields["p2"], self.prefixes["p2"],self.fields["organism2"]);
						if (typeof self.graph.proteins[doc[self.fields["p1"]]] != "undefined"){
							doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
							self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
						}
					} else if ((typeof self.graph.proteins[doc[self.fields["p1"]]] != "undefined") && (typeof self.graph.proteins[doc[self.fields["p2"]]] != "undefined")){
						doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
						self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
					}
				}
			}
			self.graph.clearAndRestartGraphic();
			self.previousRequest=self.manager.store.get('q').val();
			self.visibleProteins = Object.keys(self.graph.proteins);
			self.executeStylers();
		},	

		
		addProtein:function(doc,id,prefix,orgfield){
			var self = this;
			var n1=0;
			
			if (typeof self.graph.proteins[doc[id]] == "undefined"){
					var feats = self._getProteinFeaturesFromDoc(doc, prefix);
					feats.organism =doc[orgfield];
					n1 = self.graph.addProtein({
						"id":doc[id],
						"name":doc[id],
						"showLegend":false,
						"typeLegend":"id",
						"organism":doc[orgfield],
						"features":feats,
						"size":1}) -1;
			}else						
				n1 = self.graph.proteins[doc[id]];
		
			return n1;
		},
		setSize: function(size){
			var self=this;
			var s=size.split("x");
			self.graph.setSize(s[0],s[1]);
			self.graph.restart();
			self.executeStylers();
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("The size of the SVG has been changed",self.id,size);
			}

		},
		proteinClick: function(d){
			var self=this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Click on protein",self.id,d.protein.id);
			}

			if (d.protein.name==self.selected){
				$('[id="node-'+self.selected+'"] .figure').css("stroke",'');
				self.selected=null;
			}else{
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
		interactionClick: function(d){
			var self = this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Click on interaction",self.id,d.interaction.source.id+"-"+d.interaction.target.id);
			}
			if (d.interaction.source.id+"-"+d.interaction.target.id==self.selected){
				self.graph.setColor('[id="link-'+self.selected+'"]',"#999");
				self.selected=null;
			}else{
				if (self.selected!=null){
					if (self.selected.indexOf("-")==-1)
						$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
					else
						self.graph.setColor('[id="link-'+self.selected+'"]',"#999");
				}
				self.graph.setColor('[id="link-'+d.interaction.source.id+"-"+d.interaction.target.id+'"]',"#000");
				self.selected=d.interaction.source.id+"-"+d.interaction.target.id;
			}
		},
		proteinLabelVisibility:{},
		overProtein: function( objEvent ) {
			var self=this;
			self.graph.highlight("path.link.target-" + objEvent.protein.key);
			self.graph.highlight("path.link.source-" + objEvent.protein.key);
			self.graph.setColor("#node-" + objEvent.protein.key,'#0f0');
			self.proteinLabelVisibility[objEvent.protein.key]=self.graph.isLegendVisible("#node-"+objEvent.protein.key);
			if (!self.proteinLabelVisibility[objEvent.protein.key])
				self.graph.swapShowLegend("#node-"+objEvent.protein.key);
		},
		outOfProtein: function( objEvent ) {
			var self=this;
			self.graph.setColor("#node-" + objEvent.protein.key,'');
			self.graph.setColor("path.link.target-" + objEvent.protein.key,"rgb(153, 153, 153)");
			self.graph.setColor("path.link.source-" + objEvent.protein.key,"rgb(153, 153, 153)");
//			self.executeStylers();
			if (typeof self.proteinLabelVisibility[objEvent.protein.key] != "undefined" && !self.proteinLabelVisibility[objEvent.protein.key]){
				self.graph.swapShowLegend("#node-"+objEvent.protein.key);
				self.proteinLabelVisibility[objEvent.protein.key]=false;
			}
		},
		transformOverSVG:function( objEvent ) {
			var self = this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Transform over the SVG",self.id,objEvent);
			}
		},
		_getInteractionFeaturesFromDoc: function(doc){
			var self=this;
			var features = {};
			for (var key in doc){
				if (key.indexOf(self.prefixes["p1"])==-1 && key.indexOf(self.prefixes["p2"])==-1 && !(key in self.fields))
					features[key]=doc[key];
			}
			return features;
		},
		_getProteinFeaturesFromDoc: function(doc, prefix){
			var self=this;
			var features = {};
			if (prefix==self.prefixes["p1"]) 
				features["id"]=doc[self.fields["p1"]] ;
			else if (prefix==self.prefixes["p2"]) 
				features["id"]=doc[self.fields["p2"]] ;
			for (var key in doc){
				if (key.indexOf(prefix)==0)
					features[key.substr(prefix.length)]=doc[key];
			}
			return features;
		},
		_getProteinsFromQuery: function(){
			var self=this;
			return self.manager.widgets["requester"].getQueries();
		},
		getColor: function(group,numberOfClasses){
			return getDistinctColors(numberOfClasses)[group];
		},
		removeProtein: function(protein,excludelist){
			var self =this;
			self.graph.removeProtein(protein,excludelist);
			self.graph.clearAndRestartGraphic();

		},
		resetGraphic: function(){
			var self=this;
			self.graph.resetGraphic();
			self.graph.restart();
		},
		resizeByFeature: function(self,feature,selector){
			selector = (typeof selector=="undefined")?".figure":selector;
			var from = 0.3, to =5.0;

			var max=Number.NEGATIVE_INFINITY,min=Number.POSITIVE_INFINITY;
			for (var i in self.graph.proteins){
				var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
				if (c=="Unknown" || c=="") break;
				
				if (typeof c=="undefined" || !isNumber(c))
					throw "not a number"; 
				if (c>max) max = c*1;
				if (c<min) min = c*1;
			}
			var m=(from-to)/(min-max);
			var b=to-m*max;
			
			for (var i in self.graph.proteins){
				var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
				if (c=="Unknown" || c=="") 
					self.graph.proteins[i].size= m*(min-5)+b;
				else
					self.graph.proteins[i].size= m*c+b;
			}
			self.graph.refreshSizeScale(selector);
			self.graph.addLegends([feature,(1-b)/m,1],"Resize By");
			self.graph.addLegends([feature,max,to],"Resize By");
		},

		colorByFeature: function(self,feature,selector,type){
			selector = (typeof selector=="undefined")?".figure":selector;
			var classes =[];
			for (var i in self.graph.proteins){
				var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
				var g = classes.indexOf(c.toLowerCase());
				if (g==-1){
					g = classes.length;
					classes.push(c.toLowerCase());
				}
				self.graph.proteins[i].group=g;
			}
			var classesS=classes.slice(0);
			if (isNumberArray(classesS))
				classesS.sort(function(a,b){return a-b;});
			else
				classesS.sort();
			for (var i in self.graph.proteins)
				self.graph.proteins[i].group=classesS.indexOf(classes[self.graph.proteins[i].group]);

			if (typeof type != "undefined" && type=="color"){
				self.colorBy(self,selector,classes.length);
				self.graph.addLegends(classesS,"Color By");
			}else{
				self.borderBy(self,selector,classes.length);
				self.graph.addLegends(classesS,"Border By");
			}
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
			if (typeof type != "undefined" && type=="color"){
				self.colorBy(self,selector,proteins.length);
				self.graph.addLegends(proteins,"Color By");
			}else{
				self.borderBy(self,selector,proteins.length);
				self.graph.addLegends(proteins,"Border By");
			}
		},
		colorBy:function(self,selector,numberOfClasses){
			self.graph.vis.selectAll(selector).style("fill", function(d) {       	
				return self.getColor(d.group,numberOfClasses);   
			});
		},
		borderBy:function(self,selector,numberOfClasses){
			self.graph.vis.selectAll(selector).style("stroke", function(d) {       	
				return self.getColor(d.group,numberOfClasses);
			});
		},
		getLineComponents: function(feature,from,to,isForProteins){
			var self=this;
			var max=Number.NEGATIVE_INFINITY,min=Number.POSITIVE_INFINITY;
			var c="";
			if (isForProteins){
				for (var i in self.graph.proteins){
					c= (feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
					if (c=="Unknown" || c=="") break;
					
					if (typeof c=="undefined" || !isNumber(c))
						throw "not a number"; 
					if (c>max) max = c*1;
					if (c<min) min = c*1;
				}
			} else
				for (var i in self.graph.interactions){
					c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
					if (c=="Unknown" || c=="") break;
					
					if (typeof c=="undefined" || !isNumber(c))
						throw "not a number"; 
					if (c>max) max = c*1;
					if (c<min) min = c*1;
				}

			var m=(from-to)/(min-max);
			var b=to-m*max;
			return {m:m,b:b};
		},
		opacityByFeature: function(self,feature,selector,isForProteins){
			selector = (typeof selector=="undefined")?".figure":selector;
			
			line =self.getLineComponents(feature,0.0,1.0,isForProteins);
			var c="";
			if (isForProteins){
				for (var i in self.graph.proteins){
					c= (feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
						
					if (c=="Unknown" || c=="") 
						self.graph.proteins[i].alpha= line.m*(min-5)+line.b;
					else
						self.graph.proteins[i].alpha= line.m*c+line.b;
				}
			}else{
				for (var i in self.graph.interactions){
					c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
					if (c=="Unknown" || c=="") 
						self.graph.interactions[i].alpha= line.m*(min-5)+line.b;
					else
						self.graph.interactions[i].alpha= line.m*c+line.b;
				}
			}
			self.graph.refreshOpacity(selector,isForProteins);
		},
		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			self.graph.addLegends(null);
			self.graph.setFillColor(".figure",null);
			self.graph.setColor(".figure",null);
			self.graph.setSizeScale(".figure",1);
			self.graph.vis.selectAll(".node").attr("visibility", 'visible').style("stroke","#fff");
			self.graph.vis.selectAll(".link").attr("visibility", 'visible').style("stroke","#999");
			self.graph.vis.selectAll(".legend").attr("visibility",function(d) { return (d.showLegend)?"visible":"hidden";});
			self.graph.vis.selectAll(".legend").style("font-size", "10px");
			self.graph.setOpacity(".node",null);
			self.graph.setOpacity(".link",null);
			for (var i in self.stylers){
//				console.debug("styler:"+i);
				self.stylers[i]();
			}
			self.graph.restart();
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
		stylers:{},
		
		initTest: function(){
			var self = this;
			ok($("#"+self.target).html()!="", "Widget("+self.id+"-CircleGraphWidget): The target element has been loaded and its not empty");
			ok(self.graph!=null, "Widget("+self.id+"-CircleGraphWidget): The BioJs component has been initializated");
			equal(Object.keys(self.stylers).length,self.predefined_stylers.length,"Widget("+self.id+"-CircleGraphWidget): the number of stylers is according to the json");
			equal($("#"+self.target).hasClass( "graphCircle" ),true,"Widget("+self.id+"-CircleGraphWidget): the target has now the CSS class of the widget");
			ok($("#"+self.target+" svg").length>0,"Widget("+self.id+"-CircleGraphWidget): The target contains at least a SVG element");
			ok(self.graph.cluster!=null, "Widget("+self.id+"-CircleGraphWidget): The BioJs component has an attribute force that has been initializated");

		},
		status2JSON:function(){
			var self = this;
			var translate=(self.graph.tTranslate==null)?[0,0]:self.graph.tTranslate;
			var scale=(self.graph.tTranslate==null)?1:self.graph.tScale;
			return {"translateX":translate[0],
					"translateY":translate[1],
					"scale":scale};
		},
		uploadStatus:function(json){
			var self = this;
			self.graph.redraw(json.translateX,json.translateY,json.scale);
			self.graph.zoom.translate([json.translateX,json.translateY]).scale(json.scale);
			
		}
	});
})(jQuery);