(function ($) {
	AjaxSolr.ProteinAjaxRequesterWidget = AjaxSolr.AbstractFacetWidget.extend({
		proteins: Array(), 
		numOfInteracts:{},
		afterRequest: function () {
			var self =this;
			if (this.manager.response!=null && typeof this.manager.response.responseHeader.params.q != 'undefined')
				self.numOfInteracts[this.manager.response.responseHeader.params.q.substr(5)]=this.manager.response.response.docs.length;
			
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
				self.manager.store.addByValue('rows', self.manager.limitPerQuery);
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
				interStr += sep+"text:"+interactors[i];
				sep=" OR ";
			}
			q = 'text:'+protein;
			//TODO: Change to avoid to use direct reference to the widget graph
			if (self.manager.widgets["graph"].previousRequest!="*:*"){
				for (var i=0; i< self.manager.widgets["graph"].graph.proteins.length; i++){
					interStr += sep+"text:"+self.manager.widgets["graph"].graph.proteins[i].id;
					sep=" OR ";
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
//				self.manager.widgets["ruler"].afterRequest();
				
				// if is the last protein then call the random query
				if (self.proteins.length==0 && self.manager.store.addByValue('q', "*:*")) 
					self.manager.doRequest(0);
				
				self.manager.facetRemoved(facet);
				return false;
			};
		}
	});
})(jQuery);