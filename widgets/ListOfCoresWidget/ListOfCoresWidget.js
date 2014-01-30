(function ($) {
	AjaxSolr.ListOfCoresWidget = AjaxSolr.AbstractTextWidget.extend({
		init: function () {
			var self = this;


			$('#'+self.target+ " header").html(self.header);
			var timeoutReference=0;
			var filter= function(x){
		        if (timeoutReference) clearTimeout(timeoutReference);
		        timeoutReference = setTimeout(function() {
			        var text = $('#'+self.target+ " input").val();
			        $('#'+self.target+ " li").hide();
					$('#'+self.target+ " li:contains('"+text+"')").show();
		        }, 100);
			};
			$('#'+self.target+ " input").keydown(filter);
			Manager.servlet=servlet;
			Manager.store.servlet=servlet;
			Manager.store.addByValue('q', '*');
			Manager.doRequest();
		},
		afterRequest: function(){
			var self =this;
			var html ="";
			for (var facet in self.manager.response.status) {
				if (facet=="") continue;
				var label = facet;
				var interactions = self.manager.response.status[facet].index.numDocs;
				var date = self.manager.response.status[facet].index.lastModified.substring(0,10);
				html += '<li><a href="'+self.url+'?core='+facet+'"><b>'+label+'</b> ('+interactions+' Interactions) - <i>'+date+'</i></a></li>';
			}
			$('#'+self.target+ " ul").html(html);
			
		}

	});

})(jQuery);