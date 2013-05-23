(function ($) {
	AjaxSolr.ProteinAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		proteins: Array(), 
		proteinsInGraphic: Array(), 
		numOfInteracts:{},
		previousRequest:null,ids:[],responses:[],
		features:["id"],
		init:function(){
			var self = this;
			modelrequester.done(function(p){
				for (var i=0;i<model[0].subcolumns.length;i++){
					self.features.push(model[0].subcolumns[i].substring(prefix[0].length));
				}
			});
		},
		afterRequest: function () {
			var self =this;
			if (this.manager.response!=null && typeof this.manager.response.responseHeader.params.q != 'undefined')
				self.numOfInteracts[this.manager.response.responseHeader.params.q.substr(5)]=this.manager.response.response.docs.length;

			if(self.manager.store.get('q').val()=="*:*"){
				self.ids=[];
				self.responses=[];
			}
			if (self.previousRequest!=null && self.previousRequest=="*:*")
				self.afterRemove("*:*");
			
			self.processJson( this.manager.response);
			self.responses.push(this.manager.response);

			self.previousRequest=self.manager.store.get('q').val();
			
		},
		processJson: function(json){
			var self=this;
			for (var i = 0, l = json.response.docs.length; i < l; i++) {
				var doc = json.response.docs[i];
				if (self.ids.indexOf(doc["protein1"])==-1)
					self.ids.push(doc["protein1"]);
				if (self.ids.indexOf(doc["protein2"])==-1)
					self.ids.push(doc["protein2"]);
			}			
		},
		afterRemove: function (facet) {
			var self=this; 
			self.ids=[];
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    if (doc.responseHeader.params.q.indexOf(facet)!=-1){
			    	self.responses.splice(i--,1);
			    }
			}
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    self.processJson(doc);
			}
		},
		
		requestInteractionsByProtein: function(protein){
			var self =this;
			if (jQuery.inArray(protein,self.proteins)!=-1) return false;
			var pos=jQuery.inArray("*"+protein,self.proteins);
			if (pos!=-1)
				self.proteins[pos]=protein;
			else
				self.proteins.push(protein);
			var q=self.manager.store.get('q').val();
			q = 'text:'+protein;
			if (self.manager.store.addByValue('q', q)) {
				self.manager.doRequest(0);
			}
			return true;
		},
		requestSingleProtein: function(protein){
			var self =this;
			if (jQuery.inArray(protein,self.proteins)!=-1) return false;
			self.proteins.push("*"+protein);
			var q=self.manager.store.get('q').val();
			q = 'text:'+protein;
			self.manager.store.addByValue('rows', 1);
			if (self.manager.store.addByValue('q', q)) {
				self.manager.doRequest(0);
				var rows =(typeof params != "undefined" && typeof params.rows != "undefined")?params.rows:300;
				self.manager.store.addByValue('rows', rows);
			}
			return true;
		},
		requestInteractionsBetweenProteins: function(protein,interactors){
			var self =this;
			if (jQuery.inArray(protein,self.proteins)!=-1) return false;
			var q=self.manager.store.get('q').val();
			var sep="";
			var interStr="";
			for (var i=0; i< interactors.length; i++){
				if (interactors[i]!=protein){
					interStr += sep+"text:"+interactors[i];
					sep=" OR ";
				}
			}
			q = 'text:'+protein;
			if (self.previousRequest!="*:*"){
				for (var i=0; i< self.ids.length; i++){
					if (self.ids[i]!=protein){
						interStr += sep+"text:"+self.ids[i];
						sep=" OR ";
					}
				}
			}
			if (interStr!="") q+=' AND ('+interStr+')';
			else return false;
			if (self.manager.store.addByValue('q', q)) {
				self.manager.doRequest(0);
			}
			return true;
		},
		
		/**
		 * Needs to be implemented
		 * 
		 * @param type
		 * @param parameters
		 */
		request: function(parameters,type){
			var self=this;
			type= (typeof type=="undefined")?"interactions":type;
			switch (type){
				case "interactions":
					self.requestInteractionsByProtein(parameters[0]);
					break;
				case "protein":
					self.requestSingleProtein(parameters[0]);
					self.requestInteractionsBetweenProteins(parameters[0],parameters[1]);
					break;
			}
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
					self.manager.doRequest(0);
				}
				return false;
			};

		},
		getNumberOfResponsesPerQuery: function(query){
			var self =this; 
			if (typeof self.numOfInteracts[query] != 'undefined')
				return self.numOfInteracts[query];
			if (typeof this.manager.response.responseHeader.params.q != 'undefined' && this.manager.response.responseHeader.params.q.substr(5)==query){
				self.numOfInteracts[this.manager.response.responseHeader.params.q.substr(5)]=this.manager.response.response.docs.length;
				return self.numOfInteracts[query];
			}
			return 0;
		},
		removeQuery: function (facet) {
			var self = this; 
			return function () {
				var index = jQuery.inArray(facet,self.proteins);
				if (index==-1) return;
				self.proteins.splice(index, 1);

				
				// if is the last protein then call the random query
				if (self.proteins.length==0 && self.manager.store.addByValue('q', "*:*")) 
					self.manager.doRequest(0);
				
				self.manager.facetRemoved(facet);
				return false;
			};
		}
	});
})(jQuery);