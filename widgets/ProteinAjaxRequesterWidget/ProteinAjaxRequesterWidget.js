(function ($) {
	AjaxSolr.ProteinAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		proteins: Array(), 
		proteinsInGraphic: Array(), 
		numOfInteracts:{},
		previousRequest:null,
		features:["id"],
		scores:[],
		
		init:function(){
			var self = this;
			if (coreURL!=null && coreURL!="null" && jQuery.trim(coreURL)!=""){
				$("header.main h2").html("Core: "+coreURL);
			}else
				$("header.main h2").html("Core: Default");
			
			if (modelrequester!=null) modelrequester.done(function(p){
				for (var i=0;i<model[0].subcolumns.length;i++){
					self.features.push(model[0].subcolumns[i].substring(prefix[0].length));
				}
				
				self.scores = model[4].subcolumns;
			});
		},
		
		afterRequest: function (response) {
			var self =this;
			if (typeof response == "undefined")
				response=this.manager.response;
			
			if (response !=null && typeof response.responseHeader.params.q != 'undefined'){
				var protein =response.responseHeader.params.q.substr(5);
				self.requestedProteins[protein].doc=response;
				var pos=jQuery.inArray(protein,self.proteins);
				if (pos==-1)
					self.proteins.push(protein);
				else
					self.proteins[pos]=protein;
			}
			
			self.processJson(response);

			self.previousRequest=self.manager.store.get('q').val();
			
		},
		jointQueries:{},
		previousAnimationState:false,
		processJson: function(json){
			var self=this;
			var recursive= self.requestedProteins[json.responseHeader.params.q.substr(5)].type=="recursive";
			var protein =json.responseHeader.params.q.substr(5);

			if (recursive){
				self._createJointQuery(protein, "Recursive calls from protein: "+protein);
				for (var i = 0, l = json.response.docs.length; i < l; i++) {
					var doc = json.response.docs[i];
					self._addToJointQuery(protein,doc[self.fields["p1"]]);
					self._addToJointQuery(protein,doc[self.fields["p2"]]);
				}
			}else
				self._tagIfInJointQuery(protein);
			
			
			if (recursive) {
				for (var i = 0, l = json.response.docs.length; i < l; i++) {
					var doc = json.response.docs[i];
					self.getNextInternalInteractions(self,doc);
				}
				self.manager.response =json;
			}
			
	
			if(json.response.numFound*1 > (json.response.start+json.response.docs.length)){
				var fq=(typeof json.responseHeader.params.fq=="undefined")?"":json.responseHeader.params.fq;
				var prevF=self.currentFilter;
				self.setFilter(fq);
				self.requestPaging(json.responseHeader.params.q,1+ json.response.start+json.response.docs.length,json.response.numFound*1);
				self.setFilter(prevF);
			} else{
				if (typeof self._mapPagingIds[self.manager.store.get('q').val()] !="undefined" ){
					self.manager.widgets["progressbar"].updateProgressBarValue(self._mapPagingIds[self.manager.store.get('q').val()],100,100);
					delete self._mapPagingIds[self.manager.store.get('q').val()];
					if ($(".pgb_container").size()==0){
						self.manager.widgets["graph"].startAnimation();
					}
				}
			}
			self.requestedProteins[protein].numOfInteracts=json.response.start+json.response.docs.length;

		}, 
		_createJointQuery:function(protein,label){
			var self = this;
			if (typeof self.jointQueries[protein]=="undefined")
				self.jointQueries[protein] = {
						"len":0,
						"parents":[],
						"children":{},
						"responded":0
					};
			else{
				self.jointQueries[protein].len=0;
				self.jointQueries[protein].responded=0;
				self.jointQueries[protein].children={};
			}
			self.previousAnimationState=self.manager.widgets["graph"].isAnimationRunning();
			self.manager.widgets["graph"].stopAnimation();
			self.manager.widgets["progressbar"].addProgressBar(protein,label);
			
		},
		_addToJointQuery: function(parent,protein){
			var self=this;
			if (protein!=parent && typeof self.jointQueries[parent] != "undefined"){
				if (typeof self.jointQueries[protein] == "undefined"){
					self.jointQueries[protein] = {
						"len":0,
						"parents":[parent],
						"children":{},
						"responded":0
					};
				}
				//add the child to its parent
				self.jointQueries[parent]["children"][protein]=self.jointQueries[protein];
				// making sure the length of the parent gets updated
				self.jointQueries[parent]["len"]=Object.keys(self.jointQueries[parent]["children"]).length;
				
				if (self.jointQueries[protein]["parents"].indexOf(parent)==-1)
					self.jointQueries[protein]["parents"].push(parent);
			}
		},
		
		_tagIfInJointQuery:function(protein){
			var self = this;
			
			if (typeof self.jointQueries[protein] != "undefined"){
				for (var i=0;i<self.jointQueries[protein]["parents"].length;i++){
					var parent=self.jointQueries[protein]["parents"][i];
					self.jointQueries[parent]["responded"] +=1;
					self.manager.widgets["progressbar"].updateProgressBarValue(parent,self.jointQueries[parent]["responded"],self.jointQueries[parent]["len"]);
				}
				self.jointQueries[protein]["parents"] = [];
				self.manager.widgets["progressbar"].updateProgressBarValue(protein,self.jointQueries[protein]["responded"],self.jointQueries[protein]["len"]);
				if ($(".pgb_container").size()==0){
					self.manager.widgets["graph"].startAnimation();
					
				}
				
			}
		},
		getNextInternalInteractions: function(self,doc,i){
//				var doc = docs[i];
				self.requestExplicit(doc[self.fields["p1"]]);
				self.requestExplicit(doc[self.fields["p2"]]);
		},

		/**
		 * Needs to be implemented
		 * 
		 * @param type
		 * @param parameters
		 */
		request: function(parameters,type){
			var self=this;
			if (!$.isArray(parameters))
				parameters=[parameters];
			else
				self._createJointQuery("mult_query_"+self.multipleQueries, "Executing multiple requested queries");
			type= (typeof type=="undefined")?"normal":type;
			for(var i=0;i<parameters.length;i++){
				self._addToJointQuery("mult_query_"+self.multipleQueries, parameters[i]);
				switch (type){
					case "normal":
						self.requestNormal(parameters[i]);
						break;
					case "explicit":
						self.requestExplicit(parameters[i]);
						break;
					case "recursive":
						self.requestRecursive(parameters[i]);
						break;
				}
			}
			self.multipleQueries++;
		},
		multipleQueries:0,
		requestedProteins:{},
		requestNormal: function(protein){
			var self =this;
			
			if (protein in self.requestedProteins) {
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				if (fq==self.currentFilter){
					self._tagIfInJointQuery(protein);
					if (self.requestedProteins[protein].type=="normal" || self.requestedProteins[protein].type=="recursive")
						return false;
					else if (self.requestedProteins[protein].type=="explicit" || self.requestedProteins[protein].type=="removed"){
						self.requestedProteins[protein].type ="normal";
						self.manager.store.add("q",AjaxSolr.Parameter({"name":"q","value":protein}));
						self.manager.handleResponse(self.requestedProteins[protein].doc);
						return false;
					}
				}
			}
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				self.requestedProteins[protein] ={ "type":"normal", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		_mapPagingIds:{},
		requestPaging: function(query,start,total){
			var self =this;
			if (typeof self._mapPagingIds[query] =="undefined" ){
				self._mapPagingIds[query]="paging_"+Object.keys(self._mapPagingIds).length;
				self.previousAnimationState=self.manager.widgets["graph"].isAnimationRunning();
				self.manager.widgets["graph"].stopAnimation();
				self.manager.widgets["progressbar"].addProgressBar(self._mapPagingIds[query],"Paging query:"+query);
			} else
				self.manager.widgets["progressbar"].updateProgressBarValue(self._mapPagingIds[query],start,total);
			
			if (self.manager.store.addByValue('q', query)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				self.manager.doRequest(start);
			}
			return true;
		},
		requestRecursive: function(protein){
			var self =this;
			if (protein in self.requestedProteins) {
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				if (fq==self.currentFilter){
					self._tagIfInJointQuery(protein);
					if (self.requestedProteins[protein].type=="normal" || self.requestedProteins[protein].type=="explicit"){
						self.requestedProteins[protein].type ="recursive";
						self.processJson(self.requestedProteins[protein].doc);
						return false;
					}else if (self.requestedProteins[protein].type=="recursive"){
						return false;
					}else if (self.requestedProteins[protein].type=="removed"){
						self.requestedProteins[protein].type ="recursive";
						self.manager.handleResponse(self.requestedProteins[protein].doc);
						return false;
					}
				}
			}
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				self.requestedProteins[protein] ={ "type":"recursive", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		requestExplicit: function(protein){
			var self =this;
			if (protein in self.requestedProteins){ 
				//Checking for differences in the filters
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				if (fq==self.currentFilter){
					if (self.requestedProteins[protein].doc!=null)
						self._tagIfInJointQuery(protein);
					if (self.requestedProteins[protein].type=="removed"){
						self.requestedProteins[protein].type ="explicit";
						self.manager.handleResponse(self.requestedProteins[protein].doc);
					}
					return false;
				}
			}
			
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				self.requestedProteins[protein] ={ "type":"explicit", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		getQueries: function(){
			var self =this;
			return self.proteins;
		},
		removeAll: function() {
			var self =this;
			return function () {
				var clone = self.proteins.slice(0);
				for (var i=0;i<self.proteins.length;i++)
					self.requestedProteins[self.proteins[i]].type="removed";
				self.proteins= Array();
				for (var i=0;i<clone.length;i++)
					self.manager.facetRemoved(clone[i]);
//				self.proteins= Array();
//				if (self.manager.store.addByValue('q', "*:*")) {
//			        self.manager.store.remove('fq');
//					if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
//					self.manager.doRequest(0);
//					for (prot in self.requestedProteins)
//						self.requestedProteins[prot].type="removed";
//				}
				return false;
			};

		},
		getNumberOfResponsesPerQuery: function(query){
			var self =this; 
			
			if (typeof self.requestedProteins[query] != "undefined" && typeof self.requestedProteins[query].numOfInteracts != 'undefined')
				return self.requestedProteins[query].numOfInteracts;
			if (typeof this.manager.response.responseHeader.params.q != 'undefined' && this.manager.response.responseHeader.params.q.substr(5)==query){
				return this.manager.response.response.docs.length;
			}
			return 0;
		},
		removeQuery: function (facet) {
			var self = this; 
			var index = jQuery.inArray(facet,self.proteins);
			if (index==-1) return;
			self.proteins.splice(index, 1);
			var protein = facet;
//				var protein = (facet[0]=="*")?facet.substring(1):facet;
			self.requestedProteins[protein].type="removed";

			
			// if is the last protein then call the random query
//				if (executeRandom && self.proteins.length==0 && self.manager.store.addByValue('q', "*:*")) {
//			        self.manager.store.remove('fq');
//					if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
//					self.manager.doRequest(0);
//				}
			self.manager.facetRemoved(protein);
			return false;
		},
		currentFilter:"",
		setFilter:function(filter){
			var self = this;
			self.currentFilter=filter;
		},
		initTest:function() {
			var self = this;
			ok($("header.main h2").html().indexOf("Core")!=-1, "Widget("+self.id+"-ProteinAjaxRequesterWidget): The header has been replaced for "+$("header.main h2").html());
		},
		afterRequestTest:function(){
			var self = this;
			var protein= Manager.widgets["qunit"].test.value;
			ok( protein in self.requestedProteins, "Widget("+self.id+"-ProteinAjaxRequesterWidget): The requested protein is now in the requester cache" );
			ok(self.requestedProteins[protein].type==Manager.widgets["qunit"].test.type,"Widget("+self.id+"-ProteinAjaxRequesterWidget): The type of the document on the cache is as requested");
			var onlist=protein;
			ok(self.proteins.indexOf(onlist)!=-1, "Widget("+self.id+"-ProteinAjaxRequesterWidget): The requested protein is now in the array of ids ");
			ok(self.requestedProteins[protein].numOfInteracts==Manager.response.response.docs.length,"Widget("+self.id+"-ProteinAjaxRequesterWidget): The number of interactions in the requester cache is the same as in the reponse");
			
		},
		getURL:function(){
			var self = this;
			var strN="",strExp="",strExt="";
			for (var protein in self.requestedProteins){
				switch (self.requestedProteins[protein].type){
					case "normal":
						strN += protein+",";
						break;
					case "explicit":
						strExp += protein+",";
						break;
					case "recursive":
						strExt += protein+",";
						break;
				}
			}
			if (strN!="") strN = "&prtNor="+strN.substring(0,strN.length-1);
			if (strExp!="") strExp = "&prtExp="+strExp.substring(0,strExp.length-1);
			if (strExt!="") strExt = "&prtExt="+strExt.substring(0,strExt.length-1);
			return window.location.href.toString().split("?")[0]+"?core="+coreURL+strN+strExp+strExt;
		},
		status2JSON:function(){
			var self = this;
			var nor=[],exp=[],ext=[],
				norF=[],expF=[],extF=[];
			for (var protein in self.requestedProteins){
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				switch (self.requestedProteins[protein].type){
					case "normal":
						nor.push(protein);
						norF.push(fq);
						break;
					case "explicit":
						exp.push(protein);
						expF.push(fq);
						break;
					case "recursive":
						ext.push(protein);
						extF.push(fq);
						break;
				}
			}
			return { 
				"queried":{
					"normal":nor,
					"explicit":exp,
					"recursive":ext
				},
				"filters":{
					"normal":norF,
					"explicit":expF,
					"recursive":extF
				},
			};
		},
		uploadStatus:function(json){
			var self = this;
			var globalFilter=null,globalType=null, first=true,parent="";
			for (var type in json.queried)
				for (var i=0;i<json.queried[type].length;i++){
					if (first){
						parent=json.queried[type][i];
						self._createJointQuery(parent,"Loading Proteins from status.");
						first=false;
					}else
						self._addToJointQuery(parent, json.queried[type][i]);
					if(json.queried[type][i]=="*"){
						globalFilter=json.filters[type][i];
						globalType=type;
						continue;
					}
					var prevFilter=self.currentFilter;
					self.setFilter("");
					if (typeof json.filters != "undefined") 
						self.setFilter(json.filters[type][i]);
					self.request(json.queried[type][i],type);
					self.setFilter(prevFilter);
				}
			
			if(globalType != null){
				var prevFilter=self.currentFilter;
				self.setFilter("");
				if (typeof json.filters != "undefined") 
					self.setFilter(globalFilter);
				self.request(["*"],globalType);
				self.setFilter(prevFilter);
			}
			if ( typeof Manager.widgets["provenance"] != "undefined") {
				Manager.widgets["provenance"].addAction("Status Upoaded",self.id,json);
			}

		},
		resetStatus:function(){
			var self = this;
			self.removeAll();
		}
	});
})(jQuery);