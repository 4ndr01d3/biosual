(function ($) {

	AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		afterRemove: function (facet) {
			var self=this;
			self.afterRequest();
		},
		afterRequest: function () {
			var self = this;
			var links = [];

			var qs= self.manager.widgets["requester"].getQueries();
			var requestedProteins= self.manager.widgets["requester"].requestedProteins;
			qs.sort(function(a,b){
				if (requestedProteins[a.query][a.filter].type=="recursive")
					return -1;
				else if (requestedProteins[b.query][b.filter].type=="recursive")
					return 1;
				else if (requestedProteins[a.query][a.filter].type=="normal")
					return -1;
				else if (requestedProteins[b.query][b.filter].type=="normal")
					return 1;
				return 0;
			});
			if (qs.length>0) {
				for (var i = 0, l = qs.length; i < l; i++) {
					links.push($('<a href="#"  />')
						.html(' <img src="biosual/images/delete.png" /><span class="tooltip">Remove the protein</span>')
						.click(function(q){
							return function(){
								self.manager.widgets["requester"].removeQuery(q);
								if ( typeof Manager.widgets["provenance"] != "undefined") {
									Manager.widgets["provenance"].addAction("Removing protein",self.id,q);
								}
							};
						}(qs[i]))
					);
				}
				if (links.length > 1) {
					links.push($('<a href="#"/>').text('remove all').click(
							self.manager.widgets["requester"].removeAll()
					));
				}
				$(this.target+" .items").empty();
				for (var i = 0, l = links.length; i < l; i++) {
					var item = $("<div class='item' >").appendTo($(this.target+" .items")); 
					if (i<links.length-1 || links.length==1){
						item.append(qs[i].query);
						var num = self.manager.widgets["requester"].getNumberOfResponsesPerQuery(qs[i].query,qs[i].filter);
						var mode=requestedProteins[qs[i].query][qs[i].filter].type;
						num =(mode=="explicit")?" ":' ('+num+') ';
						var filter="";
						if (qs[i].filter!="")
							filter = '<span><img src="biosual/images/filter.png" /><span class="tooltip">'+qs[i].filter+'</span></span>';
						if (num!=null) item.append(num+filter+' <span><img src="biosual/images/mode_'+mode+'.png" /><span class="tooltip">Mode: '+mode+'</span></span>');
					}
					item.append(links[i]);
				}
			} else {
				$(this.target+" .items").html('<div class="item">'+this.label_all+'</div>');
			}
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});

})(jQuery);
