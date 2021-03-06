(function ($) {
	AjaxSolr.NetworkLoader = AjaxSolr.AbstractWidget.extend({
		loader:null,
		dataFile:null,
		headers:null,
		column:-1,
		active:false,
		excludeNames:[],
		textPublic: "The data set will be accessible for everybody and listed in the DATA SETS page.",
		textPrivate: "A link will be sent to your email and only users who have the link can access the data set",
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

			selected =$('#'+self.id+ " input[type='radio']").click(function(){
				self._refreshPrivacyMessage();
			});

			var filterEmail= function(x){
		        if (timeoutReference) clearTimeout(timeoutReference);
		        timeoutReference = setTimeout(function() { 
		        	if (self.isEmail($('#'+self.id+ " .email2Validate").val())){
		        		$('#'+self.id+ " output.emailValidation").html("");
						$("#"+self.id+" .emailTF .ok").show();
						$("#"+self.id+" .emailTF .error").hide();
						self.checkForm();
		        	}else{
		        		$('#'+self.id+ " output.emailValidation").html("The email syntax is not valid");
						$("#"+self.id+" .emailTF .ok").hide();
						$("#"+self.id+" .emailTF .error").show();
						self.checkForm();
		        	}
		        }, 100);
			};
			$('#'+self.id+ " .email2Validate").keydown(filterEmail);
			$('#'+self.id+ " .email2Validate").bind("input",filterEmail);
			
			
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
						status.html("<p>File Loaded to our servers. Now the content is being proccessed. Please don't close this window.</p>");
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
							status.html("<p>The HTTP connection has been lost, however if your file has been succefully loaded the proccess will keep runnin, check the progress bar above.</p>");
						else{							
							status.html("<p>Error loading the files. please try again.</p>");
							status.append("<p>Server Response:</p><pre>"+xhr.responseText+"</pre>");
							$("#"+self.id+" form").show();
						}
					}else{
						status.html("<p>Your Files have been updated to our servers.</p>");
						var selected =$('#'+self.id+ " input[name=type]:checked").val();
						if (selected=="public")
							status.append('<p>You can see your data set on PINV by clicking <a href="'+self.url+'?core='+$('#'+self.targetN+ " .textField2Validate").val()+'">HERE</a>.</p><p>An email has been sent to <i>'+$('#'+self.id+ " .email2Validate").val()+'</i> with a link in case you decide to remove this data set.</p>');
						else
							status.append("<p>Your data set has been successfuly updated to our servers, you will recive an email in <i>"+$('#'+self.id+ " .email2Validate").val()+"</i> with the private link to access your data</p><p>The email also contains a link to remove this data set</p>");
//						status.append('<p><b>WARNING:</b> Although we receive your files, we are busy processing them, therefore the link above might not containt all the information yet.</p>');
						//TODO: Check the response to report about skipped interactions. 
					}
				}
			}); 
			self.addInfoTip($('#'+self.targetN+ " .textField2Validate"),'<b>Dataset Name:</b><br/>The name is required to be unique. <br/>Spaces are discouraged. ');
			self.addInfoTip($('#'+self.id+ " .privacy2"),'<b>Privacy settings:</b><br/>If you choose <b>Public</b> your dataset will be listed in the this website and anyone can use your data.<br/>Choosing <b>Protected</b> makes the dataset only available for whom have the link to accessed. You can still view and share your visualizations, but only people with valid links will be able to get to it');
			self.addInfoTip($('#'+self.id+ " .email2Validate"),'<b>Email:</b><br/>A valid email is required.');
			self.addInfoTip($("#"+self.targetI+" .fakefile"),'<b>Interactions File:</b><br/>It should be a tab separated file.<br/>The first line correspond to the headers and should start with the character "#", spaces(besides the tabs) are discouraged.<br/>The first two column of the file should have the accession numbers of the interacting proteins. We sugest to use UniProt IDs.<br/>Any following column is expected to be a float number and will represent an evidence score<br/>The final score should be an aggreagete and this one is the only mandatory score. This implies you can use as many partial scores as you wish, as long as all the interactions have the same amount');
			self.addInfoTip($("#"+self.targetF+" .fakefile"),'<b>Features File:</b><br/>It should be a tab separated file.<br/>The first line correspond to the headers and should start with the character "#", spaces(besides the tabs) are discouraged.<br/>The first column of the file should have the accession number of the protein. <br/>This IDs should correspond to the ones added in the interaction file.<br/>The following column should be the organism of the protein.<br/>Any following column is a protein feature <br/>Categorical features are encourage to exploit the "Color By" functionality<br/>Numeric features can be used to resize nodes.');
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

		},
		addInfoTip: function(selector,content){
			selector.after('<span class="infoLink">i<span class="tooltip">'+content+'</span></span><br /> ');
		},
		_refreshPrivacyMessage:function(){
			var self = this;
			var selected =$('#'+self.id+ " input[name=type]:checked").val();
			if (selected=="public")
				$('#'+self.id+ " .typeMessage").html(self.textPublic);
			else
				$('#'+self.id+ " .typeMessage").html(self.textPrivate);
			
			$('#'+self.id+ " .privacy .ok").show();
		},
		isEmail: function (email) {
			var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			return regex.test(email);
		}
	});
})(jQuery);