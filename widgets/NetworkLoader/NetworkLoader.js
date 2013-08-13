(function ($) {
	AjaxSolr.NetworkLoader = AjaxSolr.AbstractWidget.extend({
		loader:null,
		dataFile:null,
		headers:null,
		column:-1,
		active:false,
		excludeNames:[],
		
		init: function(){
			var self=this;
			
			var timeoutReference=0;
			var filter= function(x){
		        if (timeoutReference) clearTimeout(timeoutReference);
		        timeoutReference = setTimeout(function() { 
		        	if (self.excludeNames.indexOf($('#'+self.targetN+ " .textField2Validate").val()) == -1){
		        		$('#'+self.targetN+ " output.coreValidation").html("");
						$("#"+self.targetN+" .ok").show();
						$("#"+self.targetN+" .error").hide();
						self.checkForm();
		        	}else{
		        		$('#'+self.targetN+ " output.coreValidation").html(" Unavailable Name");
						$("#"+self.targetN+" .ok").hide();
						$("#"+self.targetN+" .error").show();
						self.checkForm();
		        	}
		        }, 100);
			};
			$('#'+self.targetN+ " .textField2Validate").keydown(filter);

			
			
			self.loaderI = new Biojs.FileLoader({
				target: self.targetI,
				minCols:3,
				label: "Load Interactions File",
				name:"network_file",
				checkNLines:100
			});
			self.loaderI.onFileLoaded(function( objEvent ) {
				$("#"+self.targetI+" output").html(self.loaderI.getFormatedTable(5));
				$("#"+self.targetI+" output").append('<div class="sample"><p>- FIRST ROWS -</p></div>');
				$("#"+self.targetI+" .error").hide();
				$("#"+self.targetI+" .ok").show();
				self.checkForm();
			});
			self.loaderI.onError(function( objEvent ) {
				$("#"+self.targetI+" .ok").hide();
				$("#"+self.targetI+" .error").show();
				self.checkForm();
			});
			
			self.loaderF = new Biojs.FileLoader({
				target: self.targetF,
				minCols:2,
				label: "Load Features File",
				name:"annotations_file",
				checkNLines:100
			});
			self.loaderF.onFileLoaded(function( objEvent ) {
				$("#"+self.targetF+" output").html(self.loaderF.getFormatedTable(5));
				$("#"+self.targetF+" output").append('<div class="sample"><p>- FIRST ROWS -</p></div>');
				$("#"+self.targetF+" .ok").show();
				$("#"+self.targetF+" .error").hide();
				self.checkForm();
			});
			self.loaderF.onError(function( objEvent ) {
				$("#"+self.targetF+" .ok").hide();
				$("#"+self.targetF+" .error").show();
				self.checkForm();
			});
			$("#"+self.id+" li").each(function(i,e){
				$(e).prepend('<span class="index">'+(i+1)+'</span>');
				$(e).append('<span class="ok">&#x2713;</span>');
				$(e).append('<span class="error">&#x2718;</span>');
			});
			$("#"+self.id+" li .ok, #"+self.id+" li .error").hide();
			$("#"+self.id+" .progress").hide();
			var bar = $('.bar');
			var percent = $('.percent');
			var status = $('#status');
			var fail=true;
			$('form').ajaxForm({
			    beforeSend: function() {
			        status.empty();
			        var percentVal = '0%';
			        bar.width(percentVal);
			        percent.html(percentVal);
					$("#"+self.id+" .progress").show();
					$("#"+self.id+" form").hide();
			    },
			    uploadProgress: function(event, position, total, percentComplete) {
			        var percentVal = percentComplete + '%';
			        bar.width(percentVal);
			        percent.html(percentVal);
					//console.log(percentVal, position, total);
			        if (percentComplete==100){
						status.html("<p>File Loaded to our servers. Now the content is been proccess it.</p>");
				        bar.width("0%");
				        percent.html("0% (0/"+self.loaderI.numberOfLines+")");
				        self.checkInteractionsLoaded();
			        }
			    },
			    success: function() {
			        var percentVal = '100%';
			        bar.width(percentVal);
			        percent.html(percentVal);
			        fail=false;
			    },
			    error:  function() {
			        fail=true;			    	
			    },
				complete: function(xhr) {
					if (fail){
						if (xhr.responseText=="")
							status.html("<p>The HTTP connection has been lost, however if your file has been succefully loaded it keep loading, check the progress bar above.</p>");
						else{							
							status.html("<p>Error loading the files. please try again.</p>");
							status.append("<p>Server Response:</p><pre>"+xhr.responseText+"</pre>");
							$("#"+self.id+" form").show();
						}
					}else{
						status.html("<p>Your Files have been updated to our servers.</p>");
						status.append('<p>You can see your data set on PINV by clicking <a href="'+self.url+'?core='+$('#'+self.targetN+ " .textField2Validate").val()+'">HERE</a>.</p>');
//						status.append('<p><b>WARNING:</b> Although we receive your files, we are busy processing them, therefore the link above might not containt all the information yet.</p>');
						//TODO: Check the response to report about skipped interactions. 
					}
				}
			}); 
		},
		afterRequest: function(){
			var self =this;
			self.excludeNames=[];
			for (var facet in self.manager.response.status) {
				self.excludeNames.push(facet);
			}
			var val =$('#'+self.targetN+ " .textField2Validate").val();
			if (val!="" && self.excludeNames.indexOf(val)!=-1){
				var per=(100*(self.manager.response.status[val].index.numDocs/self.loaderI.numberOfLines)).toFixed(1);
				if(per>99){
					self.checkingProgress=false;
					per=100;
				}
				$('.bar').width(per+"%");
				$('.percent').html(per+"% ("+self.manager.response.status[val].index.numDocs+"/"+self.loaderI.numberOfLines+")");
			}
			if(self.checkingProgress)
				self.checkInteractionsLoaded();

		},
		checkingProgress:false,
		checkInteractionsLoaded: function(){
			var self = this;
			self.checkingProgress=true;
			var timeoutReference=0;
	        if (timeoutReference) clearTimeout(timeoutReference);
	        timeoutReference = setTimeout(function() {
	        	self.manager.doRequest(0);
	        },2000);			
		},

		onFileLoaded: function( objEvent ) {
			var self=this;
			self.dataFile =objEvent.expressions;
			self.headers=objEvent.headers;
			self.active=true;
		},
		
		onFileRemoved: function( objEvent ) {
			var self=this;
			self.active=false;
		},
		formIsOK:false,
		checkForm: function(){
			var self = this;
			if ($("#"+self.id+" .ok:visible").length==$("#"+self.id+" .ok").length){
				$("#"+self.id+" button").removeClass("inactive");
				$("#"+self.id+" button").addClass("active");
				$("#"+self.id+" button").removeAttr("disabled");
				self.formIsOK=true;
			}else{
				$("#"+self.id+" button").removeClass("active");
				$("#"+self.id+" button").addClass("inactive");
				$("#"+self.id+" button").attr("disabled", "disabled");
				self.formIsOK=false;
			}

		}
	});
})(jQuery);