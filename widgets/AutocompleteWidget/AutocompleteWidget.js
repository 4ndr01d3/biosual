(function ($) {

AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractTextWidget.extend({
  init: function () {
	  var mult=false;
	  var type='input';
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

    var self = this;

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
        self.manager.widgets["requester"].request("",[facet.field + ':' + AjaxSolr.Parameter.escapeValue(facet.value)]);
//        if (self.manager.store.addByValue('fq', facet.field + ':' + AjaxSolr.Parameter.escapeValue(facet.value))) {
//          self.doRequest();
//        }
      });

      // This has lower priority so that requestSent is set.
      if (mult==false) $(self.target).find(type).bind('keydown', function(e) {
        if (self.requestSent === false && e.which == 13) {
          var value = $(this).val();
          self.manager.widgets["requester"].request("",[$(this).val()]);
//          if (value && self.set(value)) {
//            self.doRequest();
//          }
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
				self.manager.widgets["requester"].request(self.queries.basic,[ valuesClean[i] ]);
			else{
				var interactors= valuesClean.slice(0,i).concat(valuesClean.slice(i+1));
				self.manager.widgets["requester"].request(self.queries.filter,[valuesClean[i],interactors]);
			}
		}
		$(self.target).find('textarea').val('');
	});

	
    var params = [ 'q=*:*&rows=0&facet=true&facet.limit=-1&facet.mincount=1&json.nl=map' ];
    for (var i = 0; i < this.fields.length; i++) {
      params.push('facet.field=' + this.fields[i]);
    }
//    var values = this.manager.store.values('fq');
//    for (var i = 0; i < values.length; i++) {
//      params.push('fq=' + encodeURIComponent(values[i]));
//    }
    params.push('q=' + this.manager.store.get('q').val());
    jQuery.getJSON(this.manager.solrUrl + 'select?' + params.join('&') + '&wt=json&json.wrf=?', {}, callback);
  }
});

})(jQuery);
