/**
 * This component allows to load a tab-delimited file on the client. it uses HTML5 to load the file into the browser, 
 * it does not require a server side. 
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="gustavoadolfo.salazar@gmail.com">Gustavo A. Salazar</a>
 * @version 1.0.0
 * 
 * @requires <a href='http://code.jquery.com/query-1.7.2.min.js'>jQuery Core 1.7.2</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.7.2.min.js"></script>
 * 
 * @requires <a href='http://jqueryui.com/download/jquery-ui-1.8.20.custom.zip'>jQuery UI 1.8.2</a>
 * @dependency <script src="../biojs/dependencies/jquery/jquery-ui-1.8.2.custom.min.js" type="text/javascript"></script>
 *
 * @requires <a href='http://jqueryui.com/download/jquery-ui-1.8.20.custom.zip'>jQuery UI CSS 1.8.2</a>
 * @dependency <link rel="stylesheet" href="../biojs/dependencies/jquery/jquery-ui-1.8.2.css" />
 * 
 * @requires <a href='http://www.ebi.ac.uk/~jgomez/biojs/biojs/css/biojs.expressionLoader.css'>Expression Loader CSS</a>
 * @dependency <link rel="stylesheet" href="../biojs/css/biojs.expressionLoader.css" />
 * 
 * @requires <a href='https://github.com/claviska/jquery-miniColors'>Color Selector CSS</a>
 * @dependency <link rel="stylesheet" href="../biojs/css/jquery.miniColors.css" />
 * 
 * @requires <a href='https://github.com/claviska/jquery-miniColors'>Color Selector</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery.miniColors.min.js"></script>
 * 
 * @param {Object} options An object with the options for the Expression Loader component.
 * 
 * @option {string} target
 *    Identifier of the DIV tag where the component should be displayed.
 * 
 * @option {String} label
 *    Text for the link that opens the file chooser dialog.
 * 
 * @example
 * 					var instance = new FileLoader({
 *					     target: "YourOwnDivId"
 *					});			
 * 
 */
Biojs.FileLoader = Biojs.extend (
	/** @lends Biojs.FileLoader# */
	{
		tabdata:[],
		constructor: function (options) {
			var self 	= this;
			if (window.File && window.FileReader && window.FileList && window.Blob) {
				$("#"+self.opt.target).html('<input type="file" name="'+self.opt.name+'" class="button-link" /><div class="fakefile">'+self.opt.label+'</div><br/><output></output>');
				$("#"+self.opt.target).addClass("fileloader");
				$("#"+self.opt.target+' .fakefile').click(function(){
					$("#"+self.opt.target+" .button-link").click();
				});
				$("#"+self.opt.target+" .button-link").change(function(evt){
					self.headers=[];
					self.tabdata=[];
					self._handleFileSelect(evt);
				});
			} else {
				self.raiseEvent('onError', {
					error: 'Files can\'t be validated in your browser.'
				});
			}
		},
		/**
		 *  Default values for the options
		 *  @name Biojs.ExpressionLoader-opt
		 */
		opt: {
			target: "YourOwnDivId",
			label: "Load File...",
			minCols:2,
			name: "files[]"
		},

		/**
		 * Array containing the supported event names
		 * @name Biojs.ExpressionLoader-eventTypes
		 */
		eventTypes : [
		  			/**
					 * @name Biojs.ExpressionLoader#onFileLoaded
					 * @event
					 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
					 * @eventData {Object} source The component which did triggered the event.
					 * @eventData {Object} expressions a hash array containing the values loaded with the protein id(first column in the file) as the key and an array of numbers(expression data) as the value.
					 * @example 
					 * instance.onFileLoaded(function( objEvent ) {
					    alert("File loaded");
						var tabdata =objEvent.tabdata;
						var i=0;
						$('output').append("<br/><br/>");
						for (var p in tabdata){
							if (i++==40) break;
							$('output').append("<br/>"+tabdata[p].join(" - "));
						}						
					}); 
					 * 
					 * */
					"onFileLoaded",
		  			/**
					 * @name Biojs.ExpressionLoader#onFileRemoved
					 * @event
					 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
					 * @eventData {Object} source The component which did triggered the event.
					 * @example 
					instance.onFileRemoved(function( objEvent ) {
					    alert("File removed");
						$('output').html("");
					}); 
					 * 
					 * */
					"onFileRemoved",
		  			/**
					 * @name Biojs.ExpressionLoader#onError
					 * @event
					 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
					 * @eventData {Object} source The component which did triggered the event.
					 * @eventData {String} error a string describing the type of error.
					 * @example 
					 * instance.onError(
					 *    function( objEvent ) {
					 *    	alert("ERROR: "+ objEvent.error);
					 *    }
					 * ); 
					 * 
					 * */
					"onError",
					
				], 
		_handleFileSelect: function(evt){
			var self = this;
			var files = evt.target.files; // FileList object
			
			// files is a FileList of File objects. List some properties.
			for (var i = 0, f; f = files[i]; i++) {
				if (!f.type.match('text.*')) {
					$('#'+self.opt.target+' output').html("The selected file is not text, its type is "+f.type);
					self.raiseEvent('onError', {
						error: "The selected file is not text, its type is "+f.type
					});
					continue;
				}
				var reader = new FileReader();
				reader.onload = (function(theFile) {
					return function(e) {
						var exp = self.parseTabDelimitedString(e.target.result);
						if (exp!=null) self.raiseEvent('onFileLoaded', {
							tabdata: self.tabdata
						});
						
					};
				})(f);
				reader.readAsText(f);
			}

		},
		headers:[],
		 /**
		  * Parse a String with tab delimited format into a hash, where the first column is treated as the key, 
		  * and the value are all the other columns grouped as an array 
		  * 
		  * @param {string} text the tab delimited string
		  * 
		  * @example 
		  * instance.parseTabDelimitedString('p1\t0.5\t0.3\t0.2\np2\t0.4\t0.2\t0.9');
		  */
		parseTabDelimitedString: function(text){
			var self = this;

			var lines = text.split("\n");
			var columns =-1;
			for (var i=0; i< lines.length; i++){
				if (lines[i].indexOf("#")==0)
					self.parseHeader(lines[i]);
				else{
					if ($.trim(lines[i])=="")
						continue;
					var line = lines[i].split("\t");
					if (columns==-1){
						columns = line.length;
						if (columns<self.opt.minCols){
							self.raiseEvent('onError', {
								error: "The file at requires at least 2 columns"
							});
							$('#'+self.opt.target+' output').html("The file at requires at least 2 columns.");
							return null;
						}else if (columns!=self.headers.length){
							self.raiseEvent('onError', {
								error: "The number of columns("+columns+") is diferent to the number of headers("+self.headers.length+")"
							});
							$('#'+self.opt.target+' output').html("The number of columns("+columns+") is diferent to the number of headers("+self.headers.length+")");
							return null;
						}
					}else if (columns!=line.length){
						self.raiseEvent('onError', {
							error: "The number of columns is different between lines "+i+" and "+(i+1)
						});
						$('#'+self.opt.target+' output').html("The number of columns is different between lines "+i+" and "+(i+1));
						columns=-1;
						return null;
					}
					self.tabdata.push(line);
				}
			}
			return self.tabdata;
		},
		 /**
		  * Parse a String with tab delimited format into a hash, where the first column is treated as the key, 
		  * and the value are all the other columns grouped as an array 
		  * 
		  * @param {string} text the tab delimited string
		  * 
		  * @example 
		  * instance.parseTabDelimitedString('p1\t0.5\t0.3\t0.2\np2\t0.4\t0.2\t0.9');
		  */
		parseHeader: function(text){
			var self = this;
			if (self.headers.length!=0)
				return;		
			if (text[0]!="#")
				return;		
			text = text.substring(1);
			
			var lines = text.split("\t");
			for (var i=0; i< lines.length; i++){
				self.headers.push($.trim(lines[i]));
			}
			return self.headers;
		},
		 /**
		  * Build a HTML string that displays a given number of rows as a table, including a last row of radio buttons 
		  * to select a column
		  * 
		  * @param {int} rows the number of rows to be included in the table.
		  * 
		  * @example 
		  * instance.getFormatedTable(3);
		  */
		getFormatedTable: function(rows){
			var self=this;
			var loadedText="<table>";
			loadedText += "<tr><th>"+self.headers.join("</th><th>")+"</th></tr>";
			for (var p in self.tabdata){
				if (typeof rows != "undefined" && rows--==0)
					break;
				loadedText += "<tr><td>"+self.tabdata[p].join("</td><td>")+"</td></tr>";
			}
			loadedText += "</table>";
			return loadedText;
		}
	});
