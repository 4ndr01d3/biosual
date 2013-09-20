function unitTests() {
	test( "checking the model", function() {
		modelrequester.done(function(p){
			ok( model.length>0, "We expect the model to not be empty" );
			for (var i=0;i<mainfields.length;i++){
				var inModel=false;
				for (var j=0;j<model.length;j++)
					if (mainfields[i]==model[j].id)
						inModel=true;
				ok( inModel, "We expect the main field "+mainfields[i]+" to be in the model" );
			}
		});
	});
	
	test( "Checking the template", function(){
		ok( typeof htmlTemplate !="undefined", "We expect the variable htmlTemplate to be defined" );
		ok( htmlTemplate!=null && htmlTemplate!="","We expect the variable html not to be empty nor null");
		ok( typeof target !="undefined", "We expect the variable target to be defined" );
		ok( target!=null && target!="","We expect the variable html not to be empty nor null");
		equal($("#"+target).html().substring(0,10), htmlTemplate.substring(0,10), "The begining of the content of the element target should be the same of the one gotten from the template");
	});
	test( "Checking json configuration variables", function(){
		ok( typeof json !="undefined", "We expect the variable json to be defined" );
		ok( json!=null && json!="","We expect the variable json not to be empty nor null");
		ok( typeof params !="undefined", "We expect the variable params to be defined" );
		ok( target!=null && params!="","We expect the variable params not to be empty nor null");
		ok( typeof server !="undefined", "We expect the variable server to be defined" );
		ok( target!=null && server!="","We expect the variable server not to be empty nor null");
		ok( typeof events !="undefined", "We expect the variable events to be defined" );
		ok( $.isArray(json), "The JSon variable should be an array" );
	});	
	var protein ="O32956";
	test( "Checking the widgets are been loaded to the AjaxSolr Object" ,function(){ 
		for (var i = 0; i < json.length; i++) {
			ok( typeof Manager.widgets[json[i].parameters.id] !="undefined", "the widget "+json[i].parameters.id+" ("+json[i]['widget']+") has been loaded to AjaxSolr" );
		};
	});
	
	test( "Checking initialization values of all the widgets" ,function(){ 
		for (var i = 0; i < json.length; i++) {
			var widget4test = Manager.widgets[json[i].parameters.id];
			if (typeof widget4test.initTest != "undefined")
				widget4test.initTest();
		};
	});
	// callback function for the request test.
	var callbackProteinNormal= function(){
		for (var i = 0; i < json.length; i++) {
			var widget4test = Manager.widgets[json[i].parameters.id];
			if (typeof widget4test.afterRequestTest != "undefined")
				widget4test.afterRequestTest();
		}
		start();
	};
	
	
//	asyncTest("Checking request-normal for widget "+json[i].parameters.id+" ("+json[i]['widget']+")",4,function(widget) {
	asyncTest("request protein(normal)", function(){
		Manager.widgets["qunit"].test={"test":"request","value":protein,"type":"normal","callback":callbackProteinNormal};
		Manager.widgets["requester"].request([ protein ],"normal");
	});
	
//				test ("Checking removing protein for widget "+json[i].parameters.id+" ("+json[i]['widget']+")", function(widget) {
//					return function(){ 
//							widget.removeQuery(protein);
//							ok( protein in Manager.widgets["requester"].requestedProteins, "The protein still in the cache array" );
//							ok(Manager.widgets["requester"].requestedProteins[protein].type=="removed","The status of the protein is now removed");
//					};
//				}(widget4test) );
//				break;
	test( "Checking status saving/loading of all the widgets" ,function(){ 
		for (var i = 0; i < json.length; i++) {
			var widget4test = Manager.widgets[json[i].parameters.id];
			ok( typeof widget4test.status2JSON !="undefined", "the widget "+json[i].parameters.id+" has a 'status2JSON' method" );
			ok( typeof widget4test.uploadStatus !="undefined", "the widget "+json[i].parameters.id+" has a 'uploadStatus' method" );
			//ok( typeof widget4test.resetStatus !="undefined", "the widget "+json[i].parameters.id+" has a 'resetStatus' method" );
//			if (typeof widget4test.statusTest != "undefined")
//				widget4test.statusTest();
//			var status =widget4test.status2JSON();
//			if (status!=STATUS.NO_APPLICABLE){
//				widget4test.resetStatus();
//				widget4test.uploadStatus(status);
//				equal(status, widget4test.status2JSON(),"STATUS test: saving->reseting->relaoding->comparing the widget "+json[i].parameters.id );
//			}
				
		};
	});
}
