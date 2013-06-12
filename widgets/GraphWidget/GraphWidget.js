(function ($) {
	AjaxSolr.GraphWidget = AjaxSolr.AbstractWidget.extend({
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


			self.graph = new Biojs.InteractionsD3({
				target: self.target,
				radius: 10,
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
			if(self.manager.store.get('q').val()=="*:*")
				self.resetGraphic();
			if (self.previousRequest!=null && self.previousRequest=="*:*"){
				$("#"+this.target).empty();
				self.graph.resetGraphic();
				self.graph = new Biojs.InteractionsD3({
					target: self.target,
					radius: 10,
					width: (typeof self.width == "undefined")?"800":self.width,
					height: (typeof self.height == "undefined")?"800":self.height 
				});			
			}
				
			self.interactions = Array(); 
			
			var singleProt = (this.manager.response.responseHeader.params.rows=="1");

			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				doc.organism1 = (typeof self.fields["organism1"] == 'undefined' || typeof doc[self.fields["organism1"]] == 'undefined')?'undefined':doc[self.fields["organism1"]];
				doc.organism2 = (typeof self.fields["organism2"] == 'undefined' || typeof doc[self.fields["organism2"]] == 'undefined')?'undefined':doc[self.fields["organism2"]];
				
				self.addProtein(doc,self.fields["p1"], self.prefixes["p1"],self.fields["organism1"],singleProt);
				self.addProtein(doc,self.fields["p2"], self.prefixes["p2"],self.fields["organism2"],singleProt);

				if (!singleProt){
					doc.id=doc[self.fields["p1"]] +" - "+ doc[self.fields["p2"]];
					self.graph.addInteraction(doc[self.fields["p1"]] ,doc[self.fields["p2"]] ,{score:doc[self.fields["score"]],doc:self._getInteractionFeaturesFromDoc(doc)});
				}
			}

			self.graph.restart();
			self.previousRequest=self.manager.store.get('q').val();
			self.visibleProteins = Object.keys(self.graph.proteinsA);
			self.executeStylers();
		},	

		addProtein:function(doc,id,prefix,orgfield,singleProt){
			var self = this;
			var queried=this.manager.response.responseHeader.params.q;
			var n1=0;
			if (!singleProt || queried.indexOf(doc[id])!=-1){
				if (typeof self.graph.proteinsA[doc[id]] == "undefined"){
					var feats = self._getProteinFeaturesFromDoc(doc, prefix);
					feats.organism =doc[orgfield];
					n1 = self.graph.addProtein({
						"id":doc[id],
						"name":doc[id],
						"showLegend":false,
						"typeLegend":"id",
						"organism":doc[orgfield],
						"features":feats}) -1;
				}else
					n1 = self.graph.proteinsA[doc[id]];
			}
			return n1;
		},
		setSize: function(size){
			var self=this;
			var s=size.split("x");
			self.graph.setSize(s[0],s[1]);
			self.executeStylers();
		},
		interactionClick: function(d){
			var self = this;
			var newClick = (new Date()).getTime();
			if (newClick-self.lastClick<300)
				return;
			self.lastClick=newClick;
			if (d.interaction.source.id+"_"+d.interaction.target.id==self.selected){
				self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
				self.selected=null;
			}else{
				if (self.selected!=null){
					if (self.selected.indexOf("_")==-1)
						$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
					else
						self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
				}
				self.graph.setColor('[id="link_'+d.interaction.source.id+"_"+d.interaction.target.id+'"]',"#000");
				self.selected=d.interaction.source.id+"_"+d.interaction.target.id;
			}
		},
		proteinClick: function(d){
			var self=this;
			var newClick = (new Date()).getTime();
			if (newClick-self.lastClick<300)
				return;
			self.lastClick=newClick;
			if (d.protein.name==self.selected){
				$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
				self.selected=null;
			}else{
				if (self.selected!=null){
					if (self.selected.indexOf("_")==-1)
						$('[id="node_'+self.selected+'"] .figure').css("stroke",'');
					else
						self.graph.setColor('[id="link_'+self.selected+'"]',"#999");
				}
				self.graph.setColor('[id="node_'+d.protein.name+'"] .figure',"#000");
				self.selected=d.protein.name;
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
		getColor: function(group){
			var self=this;
			return self.graph.color(group);
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
			if (typeof type != "undefined" && type=="color"){
				self.colorBy(self,selector);
				self.graph.addLegends(classes,"Color By");
			}else{
				self.borderBy(self,selector);
				self.graph.addLegends(classes,"Border By");
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
				self.colorBy(self,selector);
				self.graph.addLegends(proteins,"Color By");
			}else{
				self.borderBy(self,selector);
				self.graph.addLegends(proteins,"Border By");
			}
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
		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			self.graph.addLegends(null);
			self.graph.setFillColor(".figure",null);
			self.graph.setColor(".figure",null);
			self.graph.vis.selectAll(".node").attr("visibility", 'visible').style("stroke","#fff");
			self.graph.vis.selectAll("line").attr("visibility", 'visible').style("stroke","#999");
			self.graph.vis.selectAll(".legend").attr("visibility",function(d) { return (d.showLegend)?"visible":"hidden";});
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
			self.visibleProteins = Object.keys(self.graph.proteinsA);
			self.executeStylers();
		},
		stylers:{}
	});
})(jQuery);