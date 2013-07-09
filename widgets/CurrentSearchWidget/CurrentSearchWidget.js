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
    if (qs.length>0) {
		for (var i = 0, l = qs.length; i < l; i++) {
			links.push($('<a href="#"  />').html(' <img src="images/delete.png" />').click(
				self.manager.widgets["requester"].removeQuery(qs[i])
			));
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
				item.append(qs[i]);
				var num = self.manager.widgets["requester"].getNumberOfResponsesPerQuery(qs[i]);
				if (num!=null) item.append(' ('+num+')');
			}
			item.append(links[i]);
		}
	} else {
		$(this.target+" .items").html('<div class="item">'+this.label_all+'</div>');
	}
  }
});

})(jQuery);
