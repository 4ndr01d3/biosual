(function ($) {
	AjaxSolr.AutocompleteTextAreaWidget = AjaxSolr.AbstractTextWidget.extend({
		init: function () {
			var self = this;

			self.queries=self.manager.widgets["requester"].queries;
			$(this.target).append('<textarea id="query" name="query" ></textarea><br/>');
			var mode="normal";
			$(this.target).append('<button type="button">Search</button>');

			//TODO: change for modes
			$(this.target).append('<div id="modes" style="display: inline-block;"/>');
			if (typeof self.modes!="undefined"){
				var modes=$(this.target).find("#modes");
				modes.html("<ul class='drop_menu_container'><li>" +
						"<a class='drop'>Mode: <span class='mode_label'>Normal</span></a>" +
						"<div class='dropdown_"+self.modes.length+"columns'></li></ul>");
				var optionsdiv=modes.find('.dropdown_'+self.modes.length+'columns');
				optionsdiv.html('<div class="col_3"><h2>Choose the mode to query</h2></div>');
				for (var i = 0; i < self.modes.length; i++) {
					var selected =(typeof self.modes[i].selected != "undefined" && self.modes[i].selected==true)?" selected":"";
					if (selected!="") modes.find('span').html(self.modes[i].label);
					optionsdiv.append(	"<div class='col_1 option"+selected+"'>" +
											"<h3>"+self.modes[i].label+"</h3>" +
											"<img src='"+self.modes[i].img+"' width='95' alt='"+self.modes.label+"' />" +
											"<p>"+self.modes[i].description+"</p>" +
										"</div>");
				}
				modes.find('.option').click(function(){
					modes.find('.selected').removeClass("selected");
					$(this).addClass("selected");
					modes.find('span').html($(this).find("h3").html());
					mode = $(this).find("h3").html().toLowerCase();
				});
			}

			var area= $(this.target).find('textarea');

			$(this.target).find('textarea').unbind().removeData('events').val('');
			

			var gotOptions = function (response) {
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
				$(self.target).find('textarea').unautocomplete().autocomplete(list, {
					formatItem: function(facet) {
						return facet[self.facet];
					},
					multiple: true
				});
				
			}; // end callback

			$(this.target).find('button').click(function(e){
				var values=area.val().split(",");
				var valuesClean=[];
				for (var i=0; i<values.length; i++){
					var value=$.trim(values[i]);
					if (value!="")
						valuesClean.push(value);
				}
				for (var i=0; i<valuesClean.length; i++){
					self.requestSent = true;
					self.manager.widgets["requester"].request([ valuesClean[i] ],mode);
				}
				$(self.target).find('textarea').val('');
			});


			var paramsL = [ 'q=*:*&rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
			if (typeof self.fields == "undefined")
				self.fields = params['facet.field'];
			for (var i = 0; i < self.fields.length; i++) 
				paramsL.push('facet.field=' + self.fields[i]);
			paramsL.push('q=' + this.manager.store.get('q').val());
			jQuery.getJSON(this.manager.solrUrl + 'select?' + paramsL.join('&') + '&wt=json&json.wrf=?', {}, gotOptions);
		}
	});

})(jQuery);
