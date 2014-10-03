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
				enableEdges:self.enableEdges,
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
		    $("#"+self.target).before('<input type="checkbox" id="'+self.target+'_bundling" class="toggle" /><label for="'+self.target+'_bundling"><span>&#9679;</span> Bundle Links</label><input id="'+self.target+'_bundling_slider" type="range" min="0" max="200" value="100" style="display:none"/>');
		    $("#"+self.target).before("<input type='checkbox' id='"+self.target+"_switch' checked='checked'/><label for=\""+self.target+"_switch\"><span class='indicator_on'>&#9679;</span> Animation</label>");
		    $("#"+self.target).before("<input type='checkbox' id='"+self.target+"_cluster' class='toggle'/><label for=\""+self.target+"_cluster\"><span>&#9679;</span> Cluster</label><input id='"+self.target+"_cluster_slider' type='range' min='1' max='8' value='2' style='display:none'/>");
		    $("#"+self.target+"_switch").change(function(e){
		    	self.animateOnSwitch();
		    });
		    $("#"+self.target+"_cluster").change(function(e){
		    	self.graph._shouldCluster = this.checked;
		    	self.graph.restart();
				if (this.checked){
					$("#"+self.target+"_cluster_slider").show();
			    	$("label[for="+self.target+"_cluster] span").addClass("indicator_on");
				}else{
					$("#"+self.target+"_cluster_slider").hide();					
			    	$("label[for="+self.target+"_cluster] span").removeClass("indicator_on");
				}
		    });
		    $("#"+self.target+"_bundling").change(function(e){
		    	$("label[for="+self.target+"_bundling] span").toggleClass("indicator_on");
				if (this.checked){
					$("#"+self.target+"_bundling_slider").show();
			    	$("#"+self.target+"_switch").prop("checked",false);
			    	$("label[for="+self.target+"_switch] span").removeClass("indicator_on");
					self.graph.bundleLinks();
				}else{
					$("#"+self.target+"_bundling_slider").hide();
			    	$("#"+self.target+"_switch").prop("checked",true);
			    	$("label[for="+self.target+"_switch] span").addClass("indicator_on");
					self.graph.unbundleLinks();
				}
		    });
		    $("#"+self.target+"_bundling_slider").change(function(e){
		    	self.graph.changeBundlingStrength(this.value / 100);
		    });
		    $("#"+self.target+"_cluster_slider").change(function(e){
		    	self.graph._howDeep =this.value;
		    	self.graph.restart();
		    });

		    
		},
		animateOnSwitch:function(){
			var self = this;
	    	$("label[for="+self.target+"_switch] span").toggleClass("indicator_on");
	    	if ($("#"+self.target+"_switch").is(':checked')){
	    		if ($("#"+self.target+"_bundling").is(':checked')){
			    	$("#"+self.target+"_bundling").prop("checked",false);
					$("#"+self.target+"_bundling_slider").hide();
			    	$("label[for="+self.target+"_bundling] span").removeClass("indicator_on");
//					self.graph.unbundleLinks();
	    			
	    		}
	    			
	    		self.graph.enableAnimation();
	    		self.executeStylers();
	    	}else
	    		self.graph.disableAnimation();
		},
		afterRequest: function () {
			var self =this;
			var currentQ=this.manager.response.responseHeader.params.q;
//			if(currentQ=="*:*")
//				self.resetGraphic();
//			else
				currentQ=currentQ.substr(5);
			
//			if (self.previousRequest!=null && self.previousRequest=="*:*"){
//				$("#"+this.target).empty();
//				self.graph.resetGraphic();
//				self.graph = new Biojs.InteractionsD3({
//					target: self.target,
//					radius: 10,
//					enableEdges:self.enableEdges,
//					width: (typeof self.width == "undefined")?"800":self.width,
//					height: (typeof self.height == "undefined")?"800":self.height 
//				});			
//			}
				
//			var type = (currentQ=="*:*")?"normal":self.manager.widgets["requester"].requestedProteins[currentQ].type;
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
			
			if (!$("#"+self.target+"_switch").is(':checked'))
				return;
			
			self.graph.restart();
			self.graph.jumpToStable();
			//used to get into an stable state of the graphic.
			self.executeStylers();
			if (self.onceOffStatus!=null){
				self.uploadStatus(self.onceOffStatus);
				self.onceOffStatus=null;
			}
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
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Click on protein",self.id,d.protein.name);
			}
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
		transformOverSVG:function( objEvent ) {
			var self = this;
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Transform over the SVG",self.id,objEvent);
			}
		},
		proteinLabelVisibility:{},
		proteinMouseOver: function(d){
			var self = this;
			self.proteinLabelVisibility[d.protein.id]=self.graph.isLegendVisible("#node_"+d.protein.id);
			self.graph.showLegend("#node_"+d.protein.id,"full");
			if (!self.proteinLabelVisibility[d.protein.id])
				self.graph.swapShowLegend("#node_"+d.protein.id);
		},
		proteinMouseOut: function(d){
			var self = this;
			self.graph.showLegend("#node_"+d.protein.id,"short");
			if (typeof self.proteinLabelVisibility[d.protein.id] != "undefined" && !self.proteinLabelVisibility[d.protein.id]){
				self.graph.swapShowLegend("#node_"+d.protein.id);
				self.proteinLabelVisibility[d.protein.id]=false;
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
		getLineComponents: function(feature,from,to,isForProteins){
			var self=this;
			var max=Number.NEGATIVE_INFINITY,min=Number.POSITIVE_INFINITY;
			var c="";
			if (isForProteins)
				for (var i=0;i<self.graph.proteins.length;i++){
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
			return {m:m,b:b};
		},
		resizeByFeature: function(self,feature,selector){
			selector = (typeof selector=="undefined")?".figure":selector;
			
			line =self.getLineComponents(feature,0.3,5.0,true);
			var m=line.m, b=line.b;

			
			for (var i=0;i<self.graph.proteins.length;i++){
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
		opacityByFeature: function(self,feature,selector,isForProteins){
			selector = (typeof selector=="undefined")?".figure":selector;
			
			line =self.getLineComponents(feature,0.0,1.0,isForProteins);
			var c="";
			if (isForProteins){
				for (var i=0;i<self.graph.proteins.length;i++){
					c= (feature!="organism")?self.graph.proteins[i].features[feature]:self.graph.proteins[i].organism;
						
					if (c=="Unknown" || c=="") 
						self.graph.proteins[i].alpha= line.m*(min-5)+line.b;
					else
						self.graph.proteins[i].alpha= line.m*c+line.b;
				}
			}else{
				for (var i=0;i<self.graph.interactions.length;i++){
					c=(feature!="score")?self.graph.interactions[i].doc[feature]:self.graph.interactions[i].score;
					if (c=="Unknown" || c=="") 
						self.graph.interactions[i].alpha= line.m*(min-5)+line.b;
					else
						self.graph.interactions[i].alpha= line.m*c+line.b;
				}
			}
			self.graph.refreshOpacity(selector,isForProteins);
		},
		colorByFeature: function(self,feature,selector,type){
			selector = (typeof selector=="undefined")?".figure":selector;
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
				self.graph.addLegends(classesS,"Color By ("+feature+")");
			}else{
				self.borderBy(self,selector,classes.length);
				self.graph.addLegends(classesS,"Border By ("+feature+")");
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
				self.graph.addLegends(proteins,"Color By (Protein)");
			}else{
				self.borderBy(self,selector,proteins.length);
				self.graph.addLegends(proteins,"Border By (Protein)");
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
		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			self.graph.addLegends(null);
			self.graph.setFillColor(".figure",null);
			self.graph.setColor(".figure",null);
			self.graph.setFillColor(".link",null);
			self.graph.setColor(".link",null);
			self.graph.setSizeScale(".figure",1);
			self.graph.vis.selectAll(".node").attr("visibility", 'visible').style("stroke","#fff");
			self.graph.vis.selectAll("line").attr("visibility", 'visible').style("stroke","#999");
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
			self.visibleProteins = Object.keys(self.graph.proteinsA);
			self.executeStylers();
		},
		stylers:{},
		
		initTest: function(){
			var self = this;
			ok($("#"+self.target).html()!="", "Widget("+self.id+"-GraphWidget): The target element has been loaded and its not empty");
			ok(self.graph!=null, "Widget("+self.id+"-GraphWidget): The BioJs component has been initializated");
			equal(Object.keys(self.stylers).length,self.predefined_stylers.length,"Widget("+self.id+"-GraphWidget): the number of stylers is according to the json");
			equal($("#"+self.target).hasClass( "graphNetwork" ),true,"Widget("+self.id+"-GraphWidget): the target has now the CSS class of the widget");
			ok($("#"+self.target+" svg").length>0,"Widget("+self.id+"-GraphWidget): The target contains at least a SVG element");
			ok(self.graph.force!=null, "Widget("+self.id+"-GraphWidget): The BioJs component has an attribute force that has been initializated");
		},
		afterRequestTest:function(){
			var self = this;
			var test= Manager.widgets["qunit"].test;
			ok(typeof self.graph.proteinsA[test.value] != "undefined","Widget("+self.id+"-GraphWidget): The graph object contains an entry of "+test.value);
			equal(self.graph.proteinsA[test.value].showLegend,false,"Widget("+self.id+"-GraphWidget): The attribute showLegend si false.");
			ok(self.graph.proteins.indexOf(self.graph.proteinsA[test.value]) != -1,"Widget("+self.id+"-GraphWidget): The graph object contains an entry of the id "+test.value);
			ok(typeof self.graph.organisms[self.graph.proteinsA[test.value].organism]!= "undefined","Widget("+self.id+"-GraphWidget): The organism of the requested protein is now in the array of organisms.");
			equal(Object.keys(self.graph.organisms).length,Object.keys(self.graph.foci).length,"Widget("+self.id+"-GraphWidget): There are as many foci defined as organisms");
			if (test.type=="normal" || test.type=="recursive"){
				ok(typeof self.graph.interactionsA[test.value] != "undefined","Widget("+self.id+"-GraphWidget): There is an entry for the id "+test.value+" to record its interactions");
				equal(self.graph.interactionsA[test.value].length, self.manager.response.response.docs.length,"Widget("+self.id+"-GraphWidget): There number of interactions for the id "+test.value+" is equal to the number of documents returned on the response");
			}
			// This tests only work if is the first request (i.e. the current view is *:*) 
			equal($("#"+self.target+ ".graphNetwork line.link").length,self.manager.response.response.docs.length,"Widget("+self.id+"-GraphWidget): the number of lines in the SVG correspont o the number of ducoments in the response");
			equal($("#"+self.target+ ".graphNetwork .node").length,self.manager.response.response.docs.length+1,"Widget("+self.id+"-GraphWidget): the number of nodes in the SVG correspont o the number of documents in the response(one interactor per doc) plus one(the queried protein)");
			equal($("#"+self.target+ ".graphNetwork .node .figure").length,self.manager.response.response.docs.length+1,"Widget("+self.id+"-GraphWidget): the number of figures in the SVG correspont o the number of documents in the response(one interactor per doc) plus one(the queried protein)");
			equal($("#"+self.target+ ".graphNetwork .node .legend").length,self.manager.response.response.docs.length+1,"Widget("+self.id+"-GraphWidget): the number of labels(hidden) in the SVG correspont o the number of documents in the response(one interactor per doc) plus one(the queried protein)");
			equal($("#"+self.target+ ".legendBlock").length,0,"Widget("+self.id+"-GraphWidget): the legend block is not present");
			
			equal(self.previousRequest,test.value,"Widget("+self.id+"-GraphWidget): the id queried has been saved as the previous request");
			equal(self.visibleProteins.length,self.manager.response.response.docs.length+1,"Widget("+self.id+"-GraphWidget): the number of visible proteins is equal to the number of documents in the response(one interactor per doc) plus one(the queried protein)");
			var painted=0;
			$("#"+self.target+ ".graphNetwork .node").each(function(i,d){
				if ($(d).css("stroke")=="#ffffff")
					painted++;
			});
			equal(self.visibleProteins.length,painted,"Widget("+self.id+"-GraphWidget): alll the visible proteins are the same color, because there are not stylers defined.");
			painted=0;
			$("#"+self.target+ ".graphNetwork line").each(function(i,d){
				if ($(d).css("stroke")=="#999999")
					painted++;
			});
			equal(self.graph.interactions.length,painted,"Widget("+self.id+"-GraphWidget): all the visible interactions are the same color, because there are not stylers defined.");
			
		},
		status2JSON:function(){
			var self = this;
			var translate=(self.graph.tTranslate==null)?[0,0]:self.graph.tTranslate;
			var scale=(self.graph.tTranslate==null)?1:self.graph.tScale;
			var fixed = self.graph.getFixedProteins();
			return {"translateX":translate[0],
					"translateY":translate[1],
					"scale":scale,
					"fixed":fixed,
					"selected":self.selected,
					"organisms":self.graph.organisms};
		},
		onceOffStatus:null,
		uploadStatus:function(json){
			var self = this;
//			if (self.previousRequest=="*:*"){
//				self.onceOffStatus=json;
//				return;
//			}
			if (typeof json.organisms != "undefined" && json.organisms != null){
				self.graph.organisms=json.organisms;
			}
			self.graph.redraw(json.translateX,json.translateY,json.scale);
			self.graph.zoom.translate([json.translateX,json.translateY]).scale(json.scale);
			
			for (var i=0;i<json.fixed.length;i++){
				self.graph.fixProteinAt(json.fixed[i].protein,json.fixed[i].x,json.fixed[i].y);
			}
			if (typeof json.selected != "undefined" && json.selected != null){
				if (json.selected.indexOf("_")==-1){ // the selection is a node
					self.graph.setColor('[id="node_'+json.selected+'"] .figure',"#000");
					self.selected=json.selected;
				}else{
					self.graph.setColor('[id="link_'+json.selected+'"]',"#000");
					self.selected=json.selected;
				}
			}
		},
		isAnimationRunning:function(){
			var self = this;
			return $("#"+self.target+"_switch").is(':checked');
		},
		stopAnimation:function(){
			var self = this;
			$("#"+self.target+"_switch").attr('checked', false);
			self.animateOnSwitch();
		},
		startAnimation:function(){
			var self = this;
			$("#"+self.target+"_switch").attr('checked', true);
			self.animateOnSwitch();
		}
	});
})(jQuery);