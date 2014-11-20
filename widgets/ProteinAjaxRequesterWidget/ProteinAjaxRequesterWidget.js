(function ($) {
	/**
	 * Interface widget to do any request.
	 */
	AjaxSolr.ProteinAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		activeProteins: Array(), //A  protein can be requested then removed. Its info will be in requestedProteins but wont be in activeProteins
		proteinsInGraphic: Array(), 
		numOfInteracts:{},
		previousRequest:null,ids:[],
		features:["id"],
		scores:[],
		hasLevels:false,
		/**
		 * Constructor method. 
		 * It paints the current header in the page and load the model of the current core
		 */
		init:function(){
			var self = this;
			if (coreURL!=null && coreURL!="null" && jQuery.trim(coreURL)!=""){
				$("header.main h2").html("Core: "+coreURL);
			}else
				$("header.main h2").html("Core: Default");
			
			if (modelrequester!=null) modelrequester.done(function(p){
				for (var i=0;i<model.length;i++){
					if (typeof model[i].id != "undefined" && model[i].id=="level")
						self.hasLevels = true;
				}
				for (var i=0;i<model[0].subcolumns.length;i++){
					self.features.push(model[0].subcolumns[i].substring(prefix[0].length));
				}
				
				self.scores = model[4].subcolumns;
			});
		},
		getFqFromResponse:function(response){
			var self = this;
			var filter="";
			if ($.isArray( response.responseHeader.params.fq)){
				var fq =response.responseHeader.params.fq;
				for (var i=0; i<fq.length;i++)
					if (fq[i].indexOf("level")!=0)
						filter=fq[i];
			}else if (response.responseHeader.params.fq.indexOf("level:0")!=0)
					filter=(typeof response.responseHeader.params.fq=="undefined")?"":response.responseHeader.params.fq;
			return filter;
		},
		/**
		 * This method is the first to get executed when a request is received.
		 * 
		 */
		afterRequest: function (response) {
			var self =this;
			if (typeof response == "undefined")
				response=this.manager.response;
			
			var filter = self.getFqFromResponse(response);
			if (response !=null && typeof response.responseHeader.params.q != 'undefined'){
				if (self.previousRequest!=null)
					self.ids=[];
				var protein =response.responseHeader.params.q.substr(5);
				self.requestedProteins[protein][filter].doc=response;
				
				self._addToActiveProteins({query:protein,filter:filter});
			}
			
			self.processJson(response,filter);

			self.previousRequest=self.manager.store.get('q').val();
			
		},
		_addToActiveProteins:function(protein){
			var self = this;
			var inActive =false;
			for (var i=0;i<self.activeProteins.length;i++){
				if (self.activeProteins[i].query==protein.query && self.activeProteins[i].filter==protein.filter){
					inActive=true;
					break;
				}
			}
			if (!inActive)
				self.activeProteins.push(protein);
		},
		jointQueries:{},
		previousAnimationState:false,
		_clusterToBeReplacedBy:{},
		isActiveCluster: function(cluster){
			var self = this;
			if (cluster.length<=3)
				return true;
			for (var i=0;i<self.activeProteins.length;i++){
				var p =self.activeProteins[i];
				if (p.query==cluster)
					return true;
				var pattern = new RegExp("^"+p.query.substring(0,p.query.length-1)+"[0-3]?$");
				if (pattern.test(cluster))
					return true;
			}
			return false;
		},
		processJson: function(json,fq){
			var self=this;

			var type= self.requestedProteins[json.responseHeader.params.q.substr(5)][fq].type;
			var protein =json.responseHeader.params.q.substr(5);

			if (type=="recursive"){
				self._createJointQuery(protein, "Recursive calls from protein: "+protein);
				for (var i = 0, l = json.response.docs.length; i < l; i++) {
					var doc = json.response.docs[i];
					self._addToJointQuery(protein,doc[self.fields["p1"]]);
					self._addToJointQuery(protein,doc[self.fields["p2"]]);
				}
			}else
				self._tagIfInJointQuery(protein);
						
			for (var i = 0, l = json.response.docs.length; i < l; i++) {
				var doc = json.response.docs[i];
				if (self.ids.indexOf(doc[self.fields["p1"]])==-1)
					self.ids.push(doc[self.fields["p1"]]);
				if (self.ids.indexOf(doc[self.fields["p2"]])==-1)
					self.ids.push(doc[self.fields["p2"]]);
				
				if (type=="recursive") 
					self.getNextInternalInteractions(self,doc);
				
				if (type=="cluster"){
					if (self.isActiveCluster(doc["p1"]) && doc["p1_description"].split(";").length==1){ //it is a cluster of one
						self._clusterToBeReplacedBy[doc["p1_description"]]=doc[self.fields["p1"]];
						self.request(doc["p1_description"],"explicit");
					}
					if (self.isActiveCluster(doc["p2"]) && doc["p2_description"].split(";").length==1){
						self._clusterToBeReplacedBy[doc["p2_description"]]=doc[self.fields["p2"]];
						self.request(doc["p2_description"],"explicit");
					}
						
				}
			}
			
	
			if(json.response.numFound*1 > (json.response.start+json.response.docs.length)){
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
			self.requestedProteins[protein][fq].numOfInteracts=json.response.start+json.response.docs.length;

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
		 * 
		 * @param type normal, explicit or recursive
		 * @param parameters if the parameter is a string it is a single query. If is an array it is multiple
		 */
		request: function(parameters,type){
			var self=this;
			type= (typeof type=="undefined")?"normal":type;
			if (!$.isArray(parameters))
				parameters=[parameters];
			else if (type!="cluster")
				self._createJointQuery("mult_query_"+self.multipleQueries, "Executing multiple requested queries");
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
					case "cluster":
						self.requestCluster(parameters[0],parameters[1]);
						return;
				}
			}
			self.multipleQueries++;
		},
		multipleQueries:0,
		requestedProteins:{},
		requestNormal: function(protein){
			var self =this;
			
			//is there any previous query for that protein?
			if (protein in self.requestedProteins) {

				if (self.currentFilter in self.requestedProteins[protein]) {//is there any query on the same protein with the same filter?
					self._tagIfInJointQuery(protein); //TODO: CHECK with dict of filters
					if (self.requestedProteins[protein][self.currentFilter].type=="normal" || self.requestedProteins[protein][self.currentFilter].type=="recursive")
						return false; //do nothing because the same protein with the same filter is already there.
					else if (self.requestedProteins[protein][self.currentFilter].type=="explicit" || self.requestedProteins[protein][self.currentFilter].type=="removed"){
						//the data for this protein is already in memory but is not fully loaded. So, get it and processed 
						self.requestedProteins[protein][self.currentFilter].type ="normal";
						self.manager.store.add("q",AjaxSolr.Parameter({"name":"q","value":protein}));
						self.manager.handleResponse(self.requestedProteins[protein][self.currentFilter].doc);
						return false; // finish the request.
					}
				}
			}
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				if (typeof self.requestedProteins[protein] == "undefined") 
					self.requestedProteins[protein]={};
				if(self.hasLevels) self.manager.store.addByValue('fq', "level:0");
				self.requestedProteins[protein][self.currentFilter] ={ "type":"normal", "doc":null};
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
				if(self.hasLevels) self.manager.store.addByValue('fq', "level:0");
				self.manager.doRequest(start);
			}
			return true;
		},
		requestRecursive: function(protein){
			var self =this;
			if (protein in self.requestedProteins) {
				if (self.currentFilter in self.requestedProteins[protein]) {//is there any query on the same protein with the same filter?
					self._tagIfInJointQuery(protein);
					if (self.requestedProteins[protein][self.currentFilter].type=="normal" || self.requestedProteins[protein][self.currentFilter].type=="explicit"){
						self.requestedProteins[protein][self.currentFilter].type ="recursive";
						self.processJson(self.requestedProteins[protein][self.currentFilter].doc,self.currentFilter);
						return false;
					}else if (self.requestedProteins[protein][self.currentFilter].type=="recursive"){
						return false;
					}else if (self.requestedProteins[protein][self.currentFilter].type=="removed"){
						self.requestedProteins[protein][self.currentFilter].type ="recursive";
						self.manager.handleResponse(self.requestedProteins[protein].doc);
						return false;
					}
				}
			}
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				if (typeof self.requestedProteins[protein] == "undefined") 
					self.requestedProteins[protein]={};
				if(self.hasLevels) self.manager.store.addByValue('fq', "level:0");
				self.requestedProteins[protein][self.currentFilter] ={ "type":"recursive", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		requestExplicit: function(protein){
			var self =this;
			if (protein in self.requestedProteins){ 
				//Checking for differences in the filters
				if (self.currentFilter in self.requestedProteins[protein]) {//is there any query on the same protein with the same filter?
					if (self.requestedProteins[protein][self.currentFilter].doc!=null)
						self._tagIfInJointQuery(protein);
					if (self.requestedProteins[protein][self.currentFilter].type=="removed"){
						self.requestedProteins[protein][self.currentFilter].type ="explicit";
						self.manager.handleResponse(self.requestedProteins[protein].doc);
					}
					return false;
				}
			}
			
			var q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
				if (typeof self.requestedProteins[protein] == "undefined") 
					self.requestedProteins[protein]={};
				if(self.hasLevels) self.manager.store.addByValue('fq', "level:0");
				self.requestedProteins[protein][self.currentFilter] ={ "type":"explicit", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		_clusterQ: {},
		requestCluster: function(cluster, level){
			var self =this;
			var fq="level:"+level;
			if (typeof self.requestedProteins[cluster] != "undefined" && typeof self.requestedProteins[cluster][fq] != "undefined" && self.requestedProteins[cluster][fq].doc!=null){
//				if (typeof self._clusterQ[cluster+"#"+fq]=="undefined" || !self._clusterQ[cluster+"#"+fq]){
					self.manager.handleResponse(self.requestedProteins[cluster][fq].doc);
//					self._clusterQ[cluster+"#"+fq]=true;
//				}
				return true;
			}

			
			var qt=(cluster=="")?"*":cluster,
				q = 'text:'+qt;
			if (self.manager.store.addByValue('q', q)) {
		        self.manager.store.remove('fq');
				if (typeof self.requestedProteins[cluster] == "undefined") 
					self.requestedProteins[qt]={};
				if(self.hasLevels) self.manager.store.addByValue('fq', fq);
				self.requestedProteins[qt][fq] ={ "type":"cluster", "doc":null};
				self.manager.doRequest(0);
			}
			return true;
		},
		getQueries: function(){
			var self =this;
			return self.activeProteins;
		},
		removeAll: function() {
			var self =this;
			return function () {
				var clone = self.activeProteins.slice(0);
				for (var i=0;i<self.activeProteins.length;i++)
					self.requestedProteins[self.activeProteins[i].query][self.activeProteins[i].filter].type="removed";
				self.activeProteins = Array();
				for (var i=0;i<clone.length;i++)
					self.manager.facetRemoved(clone[i].query);//TODO:check why is calling this
				return false;
			};

		},
		getNumberOfResponsesPerQuery: function(query,filter){
			var self =this; 
			
			if (typeof self.requestedProteins[query][filter] != "undefined" && typeof self.requestedProteins[query][filter].numOfInteracts != 'undefined')
				return self.requestedProteins[query][filter].numOfInteracts;
			if (typeof this.manager.response.responseHeader.params.q != 'undefined' && this.manager.response.responseHeader.params.q.substr(5)==query){
				return this.manager.response.response.docs.length;
			}
			return 0;
		},
		removeQuery: function (facet) {
			var self = this; 
			var index = jQuery.inArray(facet,self.activeProteins);
			if (index==-1) return;
			self.activeProteins.splice(index, 1);
			self.requestedProteins[facet.query][facet.filter].type="removed";
			
			self.manager.facetRemoved(facet.query); //TODO:check why is calling this
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
			var onlist=activeProteins;
			ok(self.activeProteins.indexOf(onlist)!=-1, "Widget("+self.id+"-ProteinAjaxRequesterWidget): The requested protein is now in the array of ids ");
			ok(self.requestedProteins[protein].numOfInteracts==Manager.response.response.docs.length,"Widget("+self.id+"-ProteinAjaxRequesterWidget): The number of interactions in the requester cache is the same as in the reponse");
			
		},
		getURL:function(){
			var self = this;
			var strN="",strExp="",strExt="";
			for (var protein in self.requestedProteins){
				for (var filter in self.requestedProteins[protein])
					switch (self.requestedProteins[protein][filter].type){
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
				for (var filter in self.requestedProteins[protein])
					switch (self.requestedProteins[protein][filter].type){
						case "normal":
							nor.push(protein);
							norF.push(filter);
							break;
						case "explicit":
							exp.push(protein);
							expF.push(filter);
							break;
						case "recursive":
							ext.push(protein);
							extF.push(filter);
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
//					if(json.queried[type][i]=="*"){
//						globalFilter=json.filters[type][i];
//						globalType=type;
//						continue;
//					}
					var prevFilter=self.currentFilter;
					self.setFilter("");
					if (typeof json.filters != "undefined" && typeof json.filters[type] != "undefined" && typeof json.filters[type][i] != "undefined") 
						self.setFilter(json.filters[type][i]);
					self.request(json.queried[type][i],type);
					self.setFilter(prevFilter);
				}
			
//			if(globalType != null){
//				var prevFilter=self.currentFilter;
//				self.setFilter("");
//				if (typeof json.filters != "undefined") 
//					self.setFilter(globalFilter);
//				self.request(["*"],globalType);
//				self.setFilter(prevFilter);
//			}
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