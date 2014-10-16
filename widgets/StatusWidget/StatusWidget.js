(function ($) {
	AjaxSolr.StatusWidget = AjaxSolr.AbstractWidget.extend({
		init: function(){
			var self = this;
			var statusID = getURLParameter("status");
			if (statusID!=null && statusID!="null"  && jQuery.trim(statusID)!=""){
				var statusRequester=jQuery.getJSON(self.server_URL+"/"+statusID);
				statusRequester.done(function(response){
					self.loadStatus(response);
				});
				statusRequester.error(function(response){
					alert("ERROR: We could'nt find the configuration state that you are requesting. ("+statusID+")");
				});
				
			}

		},
		loadStatus:function(json){
			var self = this;
			self.status=json;
			coreURL=self.status.generalSettings.core;
			private_key=self.status.generalSettings.key;
			Manager.solrUrl=server+"/"+coreURL+"/";
			reloadModel();
			if (typeof self.reinit != "undefined")
				for (var i=0;i<self.reinit.length;i++){
					Manager.widgets[self.reinit[i]].init();
				}
			for (var widg in self.status.widgets){
				var widget = Manager.widgets[widg];
				if ( typeof widget.uploadStatus !="undefined"){
					widget.uploadStatus(self.status.widgets[widg]);
					
				}
			}
		},
		previousStatus:"",
		previousID:"",
		setSize: function(size){
			var self=this;
			var s=size.split("x");
			self.iframe_w=s[0];
			self.iframe_h=s[1];
		},
		iframe_w:640,
		iframe_h:480,
		_fillElements:function(elements,url){
			var self = this;
			for (var i=0;i<elements.length;i++){
				if (elements[i][0].localName=="textarea")
					elements[i].html ("<iframe width=\""+self.iframe_w+"\" height=\""+self.iframe_h+"\" src=\""+url+"&embedded=true\" frameborder=\"0\" allowfullscreen></iframe>");
				if (elements[i][0].localName=="input")
					elements[i].attr ("value",url);
			}
			
		},
		fillElementsWithCodeToEmbed: function(elements){
			var self = this;
			var json=self.getStatus();
			if (json==self.previousStatus)
				self._fillElements(elements,window.location.href.toString().split("?")[0]+"?status="+self.previousID);
			else{
				var form=	"<form id=\"tmpstatusform233\" method=\"POST\" name=\"comment_form\" controller=\"comment\" action=\""+self.uploader_URL+"save_settings\">";
				form += 	"	<textarea name=\"json_settings\">";
				form += 	json;
				form += 	"	</textarea><input type=\"submit\" value=\"Submit\"></form>";
				$("body").append(form);
				
				$('#tmpstatusform233').ajaxForm( {
				    success: function(responseText) {
				        //alert(responseText);
//						textarea.html ("<iframe width=\"640\" height=\"480\" src=\""+window.location.href.toString().split("?")[0]+"?status="+responseText+"&embedded=true\" frameborder=\"0\" allowfullscreen></iframe>");
						self._fillElements(elements,window.location.href.toString().split("?")[0]+"?status="+responseText);

				    },
				    error:  function() {
				        alert("Sorry, We couldn't save the full status of PINV, the link and code to embed only include the proteins queried. ");
						self._fillElements(elements,Manager.widgets["requester"].getURL());

//						textarea.html ("<iframe width=\"640\" height=\"480\" src=\""+Manager.widgets["requester"].getURL()+"&embedded=true\" frameborder=\"0\" allowfullscreen></iframe>");
				    },
					complete: function() {
						$('#tmpstatusform233').remove();
					}
	            }); 
				$('#tmpstatusform233').submit();
				
			}
		},
		getStatus:function(){
			var self = this;
			var widgetsStatus={};
			for (var widg in Manager.widgets){
				var widget = Manager.widgets[widg];
				if ( typeof widget.status2JSON !="undefined"){
					var st=widget.status2JSON();
					if (st!=STATUS.NO_APPLICABLE)
						widgetsStatus[widg]=st;
				}
			}
			self.status={"generalSettings":{"core":coreURL},"widgets":widgetsStatus};
			if ( typeof private_key != "undefined" && private_key != null && private_key != "null")
				self.status.generalSettings["key"]=private_key;
			return JSON.stringify(self.status);
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});
})(jQuery);