(function ($) {
	AjaxSolr.HeatmapWidget = AjaxSolr.AbstractWidget.extend({
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


			self.graph = new Biojs.InteractionsHeatmapD3({
				target: self.target,
				width: (typeof self.width == "undefined")?"800":self.width,
				height: (typeof self.height == "undefined")?"800":self.height 
			});
			$("#"+this.target).width((typeof self.width == "undefined")?"800":self.width);
			$("#"+this.target).height((typeof self.height == "undefined")?"800":self.height);

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
				currentQ=currentQ.substr(5);

			var type = self.manager.widgets["requester"].requestedProteins[currentQ].type;

			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				doc.organism1 = (typeof self.fields["organism1"] == 'undefined' || typeof doc[self.fields["organism1"]] == 'undefined')?'undefined':doc[self.fields["organism1"]];
				doc.organism2 = (typeof self.fields["organism2"] == 'undefined' || typeof doc[self.fields["organism2"]] == 'undefined')?'undefined':doc[self.fields["organism2"]];
				if (type=="normal" || type=="recursive"){
					
					self.addProtein(doc,self.fields["p1"], self.prefixes["p1"],self.fields["organism1"]);
					self.addProtein(doc,self.fields["p2"], self.prefixes["p2"],self.fields["organism2"]);
	
					doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
					self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
				}else{
					var queried=this.manager.response.responseHeader.params.q;
					if (queried.indexOf(doc[self.fields["p1"]])!=-1){
						self.addProtein(doc,self.fields["p1"], self.prefixes["p1"],self.fields["organism1"]);
						if (typeof self.graph.proteinsA[doc[self.fields["p2"]]] != "undefined"){
							doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
							self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
						}
					} else if (queried.indexOf(doc[self.fields["p2"]])!=-1){
						self.addProtein(doc,self.fields["p2"], self.prefixes["p2"],self.fields["organism2"]);
						if (typeof self.graph.proteinsA[doc[self.fields["p1"]]] != "undefined"){
							doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
							self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
						}
					} else if ((typeof self.graph.proteinsA[doc[self.fields["p1"]]] != "undefined") && (typeof self.graph.proteinsA[doc[self.fields["p2"]]] != "undefined")){
						doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
						self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
					}
				}
			}
			self.previousRequest=currentQ;
			self.visibleProteins = Object.keys(self.graph.proteinsA);
			
			
			self.graph.restart();

			self.executeStylers();
		},	
		addProtein:function(doc,id,prefix,orgfield){
			var self = this;
			var n1=0;
			if (typeof self.graph.proteinsA[doc[id]] == "undefined"){
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
				n1 = self.graph.proteinsA[doc[id]];
			return n1;
		},		

		setSize: function(size){
			var self=this;
			var s=size.split("x");
			self.graph.setSize(s[0],s[1]);
			$("#"+this.target).width(s[0]);
			$("#"+this.target).height(s[1]);
			self.executeStylers();
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("The size of the SVG has been changed",self.id,size);
			}
		},
		interactionClick: function(d){
			var self = this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Click on interaction",self.id,d.interaction.source.id+"_"+d.interaction.target.id);
			}
			
			if ("#cell_"+d.interaction.id==self.selected){
				self.graph.highlight("#cell_"+d.interaction.id,false);
				self.graph.updateInfoFrame(null,"left");
				self.graph.updateInfoFrame(null,"right");
				self.selected=null;
			}else{
				if (self.selected!=null){
					self.graph.highlight(self.selected,false);
				}
				self.graph.updateInfoFrame(d.interaction.source,"left");
				self.graph.updateInfoFrame(d.interaction.target,"right");
				self.graph.highlight("#cell_"+d.interaction.id);
				self.selected="#cell_"+d.interaction.id;
			}
		},
		proteinClick: function(d){
			var self=this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Click on protein",self.id,d.protein.name);
			}
			if ("#label_"+d.side+"_"+d.protein.id==self.selected){
				self.graph.highlight("#label_"+d.side+"_"+d.protein.id,false);
				self.graph.updateInfoFrame(null,"left");
				self.graph.updateInfoFrame(null,"right");
				self.selected=null;
			}else{
				if (self.selected!=null){
					self.graph.highlight(self.selected,false);
				}
				self.graph.updateInfoFrame(d.protein,d.side);
				self.graph.highlight("#label_"+d.side+"_"+d.protein.id);
				self.selected="#label_"+d.side+"_"+d.protein.id;
			}
		},
		proteinLabelVisibility:{},
		proteinMouseOver: function(p){
			var self = this;
			self.graph.activateProteins([p.protein]);
		},
		proteinMouseOut: function(d){
			var self = this;
			self.graph.deactivateProteins();
		},
		interactionMouseOver: function(p){
			var self = this;
			self.graph.activateProteins([p.interaction.source,p.interaction.target]);
		},
		interactionMouseOut: function(d){
			var self = this;
			self.graph.deactivateProteins();
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
//			var self=this;
			return getDistinctColors(numberOfClasses)[group];
//			return self.graph.color(group);
		},
		removeProtein: function(protein,excludelist){
			var self =this;
			self.graph.removeProtein(protein,excludelist);
			self.graph.restart();
		},
		resetGraphic: function(){
			var self=this;
			self.graph.resetGraphic();
			self.graph.restart();
		},
		colorInteractionByFeature: function(self,feature,selector,type,addLegends){
			selector = (typeof selector=="undefined")?".cell":selector;
			addLegends = (typeof addLegends=="undefined")?true:false;
			var classes =[];
			for (var i=0;i<self.graph.interactions.length;i++){
				var c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
				var g = classes.indexOf(c.toLowerCase());
				if (g==-1){
					g = classes.length;
					classes.push(c.toLowerCase());
				}
				self.graph.interactions[i].group=g;
			}
			var classesS=classes.slice(0);
			if (isNumberArray(classesS))
				classesS.sort(function(a,b){return a-b;});
			else
				classesS.sort();
			for (var i=0;i<self.graph.interactions.length;i++)
				self.graph.interactions[i].group=classesS.indexOf(classes[self.graph.interactions[i].group]);
			
			if (typeof type != "undefined" && type=="color"){
				self.colorBy(self,selector,classes.length,"interactions");
				if (addLegends) self.graph.addLegends(classesS,"Color By ("+feature+")");
			}else{
				self.borderBy(self,selector,classes.length,"interactions");
				if (addLegends) self.graph.addLegends(classesS,"Border By ("+feature+")");
			}
		},

		colorByFeature: function(self,feature,selector,type,addLegends){
			selector = (typeof selector=="undefined")?".legend":selector;
			addLegends = (typeof addLegends=="undefined")?true:false;
			var classes =[];
			for (var i=0;i<self.graph.proteins.length;i++){
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
			for (var i=0;i<self.graph.proteins.length;i++)
				self.graph.proteins[i].group=classesS.indexOf(classes[self.graph.proteins[i].group]);
			
			if (typeof type != "undefined" && type=="color"){
				self.colorBy(self,selector,classes.length);
				if (addLegends) self.graph.addLegends(classesS,"Color By ("+feature+")");
			}else{
				self.borderBy(self,selector,classes.length);
				if (addLegends) self.graph.addLegends(classesS,"Border By ("+feature+")");
			}
		},
		colorBySeed: function(self,selector,type,addLegends){
			selector = (typeof selector=="undefined")?".legend":selector;
			addLegends = (typeof addLegends=="undefined")?true:false;
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
				if (addLegends) self.graph.addLegends(proteins,"Color By (Protein)");
			}else{
				self.borderBy(self,selector,proteins.length);
				if (addLegends) self.graph.addLegends(proteins,"Border By (Protein)");
			}
		},
		colorBy:function(self,selector,numberOfClasses,type){
			type = (typeof type=="undefined")?"proteins":type;
			self.graph.svg.selectAll(selector).style("fill", function(d,i) {
				if (type=="proteins")
					return self.getColor(self.graph.nodes[i].group,numberOfClasses);
				else
					return self.getColor(self.graph.interactions[d.i].group,numberOfClasses);
			});
		},
		borderBy:function(self,selector,numberOfClasses){
			self.graph.svg.selectAll(selector).style("stroke", function(d,i) {       	
				return self.getColor(self.graph.nodes[i].group,numberOfClasses);   
			});
		},
		getLineComponents: function(feature,from,to,isForProteins){
			var self=this;
			var max=Number.NEGATIVE_INFINITY,min=Number.POSITIVE_INFINITY;
			var c="";
			if (isForProteins)
				for (var i in self.graph.proteins){
					c= (feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
					if (c=="Unknown" || c=="") break;
					
					if (typeof c=="undefined" || !isNumber(c))
						throw "not a number"; 
					if (c>max) max = c*1;
					if (c<min) min = c*1;
				}
			else
				for (var i=0;i<self.graph.interactions.length;i++){
					c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
					if (c=="Unknown" || c=="") break;
					
					if (typeof c=="undefined" || !isNumber(c))
						throw "not a number"; 
					if (c>max) max = c*1;
					if (c<min) min = c*1;
				}
			var m=(from-to)/(min-max);
			var b=to-m*max;
			return {m:m,b:b,min:min,max:max};
		},
		resizeByFeature: function(self,feature,selector,addLegends){
			addLegends = (typeof addLegends=="undefined")?true:false;
			selector = (typeof selector=="undefined")?".legend":selector;
			var line = self.getLineComponents(feature,0.3,3.0,true);
			
			for (var i in self.graph.proteins){
				var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
				if (c=="Unknown" || c=="") 
					self.graph.proteins[i].size= line.m*(line.min-5)+line.b;
				else
					self.graph.proteins[i].size= line.m*c+line.b;
			}
			self.graph.refreshSizeScale(selector);
			if (addLegends) self.graph.addLegends([feature,(1-line.b)/line.m,1],"Resize By");
			if (addLegends) self.graph.addLegends([feature,line.max,3.0],"Resize By");
		},
		opacityByFeature: function(self,feature,selector,isForProteins){
			addLegends = (typeof addLegends=="undefined")?true:false;
			selector = (typeof selector=="undefined")?".legend":selector;
			var line = self.getLineComponents(feature,0.1,1.0,isForProteins);

			if (isForProteins)
				for (var i in self.graph.proteins){
					var c=(feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
					if (c=="Unknown" || c=="") 
						self.graph.proteins[i].alpha= line.m*(line.min-5)+line.b;
					else
						self.graph.proteins[i].alpha= line.m*c+line.b;
				}
			else
				for (var i in self.graph.interactions){
					var c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
					if (c=="Unknown" || c=="") 
						self.graph.interactions[i].alpha= line.m*(line.min-5)+line.b;
					else
						self.graph.interactions[i].alpha= line.m*c+line.b;
				}
			self.graph.refreshOpacity(selector);
		},

		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			self.graph.addLegends(null);
			self.graph.show(".legend,.cell");
			self.graph.highlight(".legend,.cell",false);
			self.graph.setFillColor(".legend,.cell",null);
			self.graph.setColor(".legend,.cell",null);
			self.graph.setSizeScale(".legend,.cell",1);
			self.graph.setOpacity(".cell",null);
			self.graph.setOpacity(".legend",null);
			for (var i in self.stylers){
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
			self.visibleProteins = Object.keys(self.graph.proteinsA);
			self.executeStylers();
		},
		stylers:{},
		
		initTest: function(){
			var self = this;
		},
		afterRequestTest:function(){
			var self = this;
			var test= Manager.widgets["qunit"].test;

		},
		status2JSON:function(){
			var self = this;
			return {"selected":self.selected};
		},
		onceOffStatus:null,
		uploadStatus:function(json){
			var self = this;

			if (typeof json.selected != "undefined" && json.selected != null){
				if(json.selected.indexOf("#cell_"==0)){
	//				self.graph.updateInfoFrame(d.interaction.source,"left");
	//				self.graph.updateInfoFrame(d.interaction.target,"right");
				}else{
	//				self.graph.updateInfoFrame(d.protein,d.side);
				}
				self.graph.highlight(json.selected);
				self.selected=json.selected;
			}
		}
	});
})(jQuery);