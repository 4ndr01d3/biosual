(function ($) {
	$(function () {
	    for (var i in events){
	    	var event = events[i];
	    	Manager.widgets[event.source][event.object][event.event](function( objEvent ) {
				Manager.widgets[event.listener][event.method](objEvent);
			}); 
	    	
	    }

	});
})(jQuery);
