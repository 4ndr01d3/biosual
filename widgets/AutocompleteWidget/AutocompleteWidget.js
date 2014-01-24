(function ($) {
	AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractTextWidget.extend({
		init: function () {
			var self = this;
			var mult=false;
			var type='input';
			self.queries=self.manager.widgets["requester"].queries;
			if (typeof this.multiple=="undefined" || this.multiple==false){
				$(this.target).append('        <input type="text" id="query" name="query" />');
			}else if (this.multiple==true){
				$(this.target).append('<textarea id="query" name="query" ></textarea><br/>');
				if (typeof this.checkbox!="undefined" && this.checkbox!=""){
					$(this.target).append('<label for="checkbox">'+this.checkbox+'</label>');
					$(this.target).append('<input type="checkbox" id="checkbox" checked/>');
				}
				$(this.target).append('<button type="button">Search</button>');
				mult=true;
				var area= $(this.target).find('textarea');
				type='textarea';
			}
			$(this.target).find(type).unbind().removeData('events').val('');


			var callback = function (response) {
				var list = [];
				for (var i = 0; i < self.fields.length; i++) {
					var field = self.fields[i];
					for (var facet in response.facet_counts.facet_fields[field]) {
						list.push({
							field: field,
							value: facet,
							text: facet + ' (' + response.facet_counts.facet_fields[field][facet] + ') - ' + field
						});
					}
				}

				self.requestSent = false;
				$(self.target).find(type).unautocomplete().autocomplete(list, {
					formatItem: function(facet) {
						return facet[self.facet];
					},
					multiple: mult
				});
				if (mult==false) $(self.target).find(type).result(function(e, facet) {
					self.requestSent = true;
					self.manager.widgets["requester"].request([facet.field + ':' + AjaxSolr.Parameter.escapeValue(facet.value)],"");
				});

				// This has lower priority so that requestSent is set.
				if (mult==false) $(self.target).find(type).bind('keydown', function(e) {
					if (self.requestSent === false && e.which == 13) {
						var value = $(this).val();
						self.manager.widgets["requester"].request([value],"");
					}
				});
			}; // end callback

			if (mult) $(this.target).find('button').click(function(e){
				var values=area.val().split(",");
				var valuesClean=[];
				for (var i=0; i<values.length; i++){
					var value=$.trim(values[i]);
					if (value!="")
						valuesClean.push(value);
				}
				for (var i=0; i<valuesClean.length; i++){
					self.requestSent = true;

					if (typeof $(self.target).find('input').attr("checked") != 'undefined')
						self.manager.widgets["requester"].request([ valuesClean[i] ],self.queries.basic);
					else{
						var interactors= valuesClean.slice(0,i).concat(valuesClean.slice(i+1));
						self.manager.widgets["requester"].request([valuesClean[i],interactors],self.queries.filter);
					}
				}
				$(self.target).find('textarea').val('');
			});


			var paramsL = [ 'q=*&rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
			if (typeof self.fields == "undefined")
				self.fields = params['facet.field'];
			for (var i = 0; i < self.fields.length; i++) 
				paramsL.push('facet.field=' + self.fields[i]);
			paramsL.push('q=' + this.manager.store.get('q').val());
			jQuery.getJSON(this.manager.solrUrl + 'select?' + paramsL.join('&') + '&wt=json&json.wrf=?', {}, callback);
		}
	});

})(jQuery);
