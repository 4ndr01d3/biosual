(function ($) {
	AjaxSolr.ProteinAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		proteins: Array(), 
		proteinsInGraphic: Array(), 
		numOfInteracts:{},
		previousRequest:null,ids:[],
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
			

			if(response.responseHeader.params.q=="*:*"){
				self.ids=[];
			}else if (response !=null && typeof response.responseHeader.params.q != 'undefined'){
				if (self.previousRequest!=null && self.previousRequest=="*:*")
					self.ids=[];
				var protein =response.responseHeader.params.q.substr(5);
				self.requestedProteins[protein].doc=response;
				var pos=jQuery.inArray(protein,self.proteins);
				if (pos==-1)
					self.proteins.push(protein);
				else
					self.proteins[pos]=protein;
			}

			if (self.previousRequest!=null && self.previousRequest=="*:*")
				self.afterRemove("*:*");
			
			self.processJson(response);

			self.previousRequest=self.manager.store.get('q').val();
			
		},
		processJson: function(json){
			var self=this;
			var recursive= (json.responseHeader.params.q!="*:*" && self.requestedProteins[json.responseHeader.params.q.substr(5)].type=="recursive");
			var protein =json.responseHeader.params.q.substr(5);
			for (var i = 0, l = json.response.docs.length; i < l; i++) {
				var doc = json.response.docs[i];
				if (self.ids.indexOf(doc[self.fields["p1"]])==-1)
					self.ids.push(doc[self.fields["p1"]]);
				if (self.ids.indexOf(doc[self.fields["p2"]])==-1)
					self.ids.push(doc[self.fields["p2"]]);
				
				if (recursive)
					self.getNextInternalInteractions(self,doc);
			}
			if(self.manager.store.get('q').val()!="*:*" && json.response.numFound*1 > (json.response.start+json.response.docs.length)){
				var fq=(typeof json.responseHeader.params.fq=="undefined")?"":json.responseHeader.params.fq;
				var prevF=self.currentFilter;
				self.setFilter(fq);
				self.requestPaging(self.manager.store.get('q').val(),1+ json.response.start+json.response.docs.length);
				self.setFilter(prevF);
			}
			if(json.responseHeader.params.q!="*:*")
				self.requestedProteins[protein].numOfInteracts=json.response.start+json.response.docs.length;

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
			type= (typeof type=="undefined")?"normal":type;
			switch (type){
				case "normal":
					self.requestNormal(parameters[0]);
					break;
				case "explicit":
					self.requestExplicit(parameters[0]);
					break;
				case "recursive":
					self.requestRecursive(parameters[0]);
					break;
			}
		},
		requestedProteins:{},
		requestNormal: function(protein){
			var self =this;
			
			if (protein in self.requestedProteins) {
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				if (fq==self.currentFilter){
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
		requestPaging: function(query,start){
			var self =this;
			
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
				var fq=(self.requestedProteins[protein].doc==null ||typeof self.requestedProteins[protein].doc.responseHeader.params.fq=="undefined")?"":self.requestedProteins[protein].doc.responseHeader.params.fq;
				if (fq==self.currentFilter){
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
				self.proteins= Array();
				if (self.manager.store.addByValue('q', "*:*")) {
			        self.manager.store.remove('fq');
					if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
					self.manager.doRequest(0);
					for (prot in self.requestedProteins)
						self.requestedProteins[prot].type="removed";
				}
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
		removeQuery: function (facet,executeRandom) {
			var self = this; 
			executeRandom= (typeof executeRandom == "undefined")?true:executeRandom;
			
			return function () {
				var index = jQuery.inArray(facet,self.proteins);
				if (index==-1) return;
				self.proteins.splice(index, 1);
				var protein = facet;
//				var protein = (facet[0]=="*")?facet.substring(1):facet;
				self.requestedProteins[protein].type="removed";

				
				// if is the last protein then call the random query
				if (executeRandom && self.proteins.length==0 && self.manager.store.addByValue('q', "*:*")) {
			        self.manager.store.remove('fq');
					if(self.currentFilter!="") self.manager.store.addByValue('fq', self.currentFilter);
					self.manager.doRequest(0);
				}
				self.manager.facetRemoved(protein);
				return false;
			};
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
			var globalFilter=null,globalType=null;
			for (var type in json.queried)
				for (var i=0;i<json.queried[type].length;i++){
					if(json.queried[type][i]=="*"){
						globalFilter=json.filters[type][i];
						globalType=type;
						continue;
					}
					var prevFilter=self.currentFilter;
					self.setFilter("");
					if (typeof json.filters != "undefined") 
						self.setFilter(json.filters[type][i]);
					self.request([json.queried[type][i]],type);
					self.setFilter(prevFilter);
				}
			
			var prevFilter=self.currentFilter;
			self.setFilter("");
			if (typeof json.filters != "undefined") 
				self.setFilter(globalFilter);
			self.request(["*"],globalType);
			self.setFilter(prevFilter);
		},
		resetStatus:function(){
			var self = this;
			self.removeAll();
		}
	});
})(jQuery);