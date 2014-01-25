(function ($) {
	AjaxSolr.TableWidget = AjaxSolr.AbstractFacetWidget.extend({
		textMore:"More Columns >>>",
		textLess:"<<< Less Columns",
		previousRequest:null,
		oTable:null,
		ids:[],trIds:[],
		
		init: function () {
			var self=this;
			self.fields=self.manager.widgets["requester"].fields;
			self.prefixes=self.manager.widgets["requester"].prefixes;
			$("#"+this.target).empty();
			if (typeof self.columns =="undefined"){
				if (modelrequester!=null) modelrequester.done(function(p){
					self.columns=model;
					self.builtTable();
				});
			}else
				self.builtTable();
		},
		
		builtTable:function() {
			var self = this;
			var html ='<div class="clear"></div><table cellpadding="0" cellspacing="0" border="0" class="display" id="'+self.target+'_table" width="100%">';
				html +='	<thead>';
				html +='		<tr>';
				var cols=0;
				for (var i=0;i<self.columns.length;i++){
					html +='			<th class="more">';
					if(typeof self.columns[i].subcolumns != "undefined") 
						html+='<span id="header_'+self.columns[i].id+'" class="'+self.columns[i].id+'">'+self.textMore+'</span>';
					html+='</th>';
					cols++;
					if(typeof self.columns[i].subcolumns != "undefined")
						for (var j=0;j<self.columns[i].subcolumns.length;j++){
							html +='			<th class="'+self.columns[i].id+'" col_num="'+cols+'"></th>';
							cols++;
						}
				}
				html +='		</tr>';
				html +='		<tr>';
				var cols=0;
				for (var i=0;i<self.columns.length;i++){
					html +='			<th>'+self.columns[i].label+'</th>';
					cols++;
					if(typeof self.columns[i].subcolumns != "undefined")
						for (var j=0;j<self.columns[i].subcolumns.length;j++){
							html +='			<th class="subcolumn '+self.columns[i].id+'" col_num="'+cols+'">'+self.columns[i].subcolumns[j]+'</th>';
							cols++;
						}
				}
				html +='		</tr>';
				html +='	</thead>';
				html +='	<tbody>';
				html +='	</tbody>';
				html +='</table>';
			$("#"+this.target).html(html);
			var oTable=$("#"+self.target+"_table").dataTable( {
		        "sPaginationType": "full_numbers",
				"bFilter": true,
				"bSortClasses": false,
				"bAutoWidth": false,
				"sDom": 'T<"clear">lfrtip',
				"oTableTools": {
					"aButtons": [ "copy", "csv" ],
					"sSwfPath": "biosual/widgets/TableWidget/copy_csv_xls_pdf.swf"
				}
		    });
			self.oTable= oTable;
			for (var i=0;i<self.columns.length;i++){
				$('#'+self.target+'_table th.'+self.columns[i].id).each(function(i,l){
					oTable.fnSetColumnVis( $(l).attr("col_num"), false );
				});
				$('#'+self.target+'_table span.'+self.columns[i].id).click(function(e){
					
					for (var j=0;j<oTable.fnSettings().aoColumns.length;j++){
						if ( $(oTable.fnSettings().aoColumns[j].nTh).hasClass($(this).attr("class"))){
							var bVis = oTable.fnSettings().aoColumns[j].bVisible;
							oTable.fnSetColumnVis( j, bVis ? false : true );
						}
					}
					if ($(this).text()==self.textMore)
						$(this).text(self.textLess);
					else
						$(this).text(self.textMore);
					//self.refreshButtons();
				});
			}
			var colnum=0;
			for (var i=0;i<self.columns.length;i++){
				oTable.fnSettings().aoColumns[colnum].sClass="cell_"+self.columns[i].id;
				colnum++;
				if(typeof self.columns[i].subcolumns != "undefined")
					for (var j=0;j<self.columns[i].subcolumns.length;j++)
						oTable.fnSettings().aoColumns[colnum++].sClass="subcolumn";
			}
		    for (var i in self.predefined_stylers){
		    	var styler = self.predefined_stylers[i];
		    	self.registerStyler(styler.id,function(styler){ 
		    		return function () {
		    			$.fn[styler.id][styler.method](self);
		    		};
		    	}(styler));
		    }			

		},
		responses:[],
		refreshButtons:function(){
			var self = this; //div#table vs table#table_table
			var table= (self instanceof AjaxSolr.TableWidget)?$(self.target)[0]:$(self).find("table")[0];
			var oTableTools = TableTools.fnGetInstance( table );
			if (oTableTools!=null) oTableTools.fnResizeButtons();
		},
		afterRequest: function () {
			var self=this;
//			if(self.manager.store.get('q').val()=="*:*"){
//				self.ids=[];
//				self.trIds=[];
//				self.responses=[];
//				self.restartTable();
//			}
//			if (self.previousRequest!=null && self.previousRequest=="*:*")
//				self.afterRemove("*:*");
			var currentQ=self.manager.response.responseHeader.params.q;
			var type = "";
//			if(currentQ=="*:*")
//				type = "normal";
//			else{
				currentQ=currentQ.substr(5);
				type =self.manager.widgets["requester"].requestedProteins[currentQ].type;
//			}
			this.manager.response.type=type;
			this.manager.response.currentQ=currentQ;
			if (typeof self.columns =="undefined"){
				if (modelrequester!=null) modelrequester.done(function(p){
					self.processJson( self.manager.response);
				});
			}else
				self.processJson( this.manager.response);

			self.responses.push(this.manager.response);

			self.previousRequest=self.manager.store.get('q').val();
			if (self.onceOffStatus!=null){
				self.uploadStatus(self.onceOffStatus);
				self.executeStylers();
				self.onceOffStatus=null;
			}

		},
		processJson: function(json){
			var self=this;
			var currentQ=json.currentQ;
			var type =json.type;

			if (type=="normal" || type=="recursive"){
				for (var i = 0, l = json.response.docs.length; i < l; i++) 
					self._addRow(json.response.docs[i]);
			}else{
				var recursiveAdded=false;
				for (var i = 0, l = json.response.docs.length; i < l; i++) {
					var doc=json.response.docs[i];
					if ( (currentQ==doc[self.columns[0].id] && self.ids.indexOf(doc[self.columns[2].id])!=-1)||
							 (currentQ==doc[self.columns[2].id] && self.ids.indexOf(doc[self.columns[0].id])!=-1)){
							self._addRow(doc);
							recursiveAdded=true;
					}
				}
				if (recursiveAdded==false){
					self._addSingleProteinRow(json.response.docs[0],json.currentQ);
				}
			}
			self.oTable.fnDraw();
		},
		_addRow: function(doc){
			var self = this;
			var doc_array=[];
			var id = "cell_"+doc[self.fields["p1"]]+"_"+doc[self.fields["p2"]];
			if (self.trIds.indexOf(id)==-1)
				self.trIds.push(id);
			else
				return;
			for (var j=0;j<self.columns.length;j++){
				doc_array.push(doc[self.columns[j].id]);
				if (typeof self.columns[j].subcolumns !="undefined")
					for (var k=0;k<self.columns[j].subcolumns.length;k++)
						doc_array.push(doc[self.columns[j].subcolumns[k]]);
				if (self.ids.indexOf(doc[self.columns[j].id])==-1)
					self.ids.push(doc[self.columns[j].id]);
			}
			self.oTable.fnAddData( doc_array,false);
			var ntr = self.oTable.fnSettings().aoData.slice(-1)[0].nTr;
			$(ntr).attr("id",id);
			$(ntr.children).filter(".cell_"+self.columns[0].id).attr( "content", $(ntr.children).filter(".cell_"+self.columns[0].id).text());
			$(ntr.children).filter(".cell_"+self.columns[2].id).attr( "content", $(ntr.children).filter(".cell_"+self.columns[2].id).text());
			$(ntr).data("doc",doc);
			
		},
		_addSingleProteinRow:function(doc,currentQ){
			//TODO: Check why is a null document coming here!
			if (typeof doc=="undefined") return;
			
			var self=this;
			var doc_array=[];

			//if one id is the query and the other is already on the graphic
			//add the line
			var id = "cell_"+currentQ+"_";
			if (currentQ!="*" && self.trIds.indexOf(id)==-1)
				self.trIds.push(id);
			else
				return;
			
			var index=0;
			if (currentQ.indexOf(doc[self.fields["p2"]])!=-1)
				index=2;
			doc_array.push(doc[self.columns[index].id]);
			if (typeof self.columns[index].subcolumns !="undefined")
				for (var k=0;k<self.columns[index].subcolumns.length;k++)
					doc_array.push(doc[self.columns[index].subcolumns[k]]);
			if (self.ids.indexOf(doc[self.columns[index].id])==-1)
				self.ids.push(doc[self.columns[index].id]);

			doc_array.push(doc[self.columns[index+1].id]);
			for (var j=2;j<self.columns.length;j++){
				doc_array.push("");
				if (typeof self.columns[j].subcolumns !="undefined")
					for (var k=0;k<self.columns[j].subcolumns.length;k++)
						doc_array.push("");
				if (self.ids.indexOf(doc[self.columns[j].id])==-1)
					self.ids.push("");
			}


			self.oTable.fnAddData( doc_array,false);
			var ntr = self.oTable.fnSettings().aoData.slice(-1)[0].nTr;
			$(ntr).attr("id",id);
			$(ntr.children).filter(".cell_"+self.columns[0].id).attr( "content", $(ntr.children).filter(".cell_"+self.columns[0].id).text());
			$(ntr.children).filter(".cell_"+self.columns[2].id).attr( "content", $(ntr.children).filter(".cell_"+self.columns[2].id).text());
			$(ntr).data("doc",doc);
		},
		afterRemove: function (facet) {
			var self=this;
			self.ids=[];
			self.trIds=[];
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    if (doc.responseHeader.params.q.indexOf(facet)!=-1){
			    	self.responses.splice(i--,1);
			    }
			}
			self.restartTable();
		},
		restartTable: function(){
			var self = this;
			self.oTable.fnClearTable();
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    self.processJson(doc);
			}
		},
		paintRowBackground:function(selectorTR,color){ //paint interaction
			var self = this;
			self.oTable.fnFilter('');
			self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).css('backgroundColor', color);
			self.oTable.fnFilter('');		
		},
		resizeCell:function(selectorTR,selectorTD,size){ //paint protein
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					$(td).css('font-size', Math.sqrt(size)+"em");
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).each(function(i,tr){
					$(tr.children).filter(selectorTD).css('font-size', Math.sqrt(size)+"em");
				});
				
			}
			self.oTable.fnFilter('');		
		},
		resizeByFeature: function(selectorTR,selectorTD,feature,type){
			var self = this;
			selectorTR = (typeof selectorTR=="undefined")?"tr[id*=cell_]":selectorTR;
			var classes =[];
			var from = 0.3, to =5.0;
			//get max and min
			var max=-99999999,min=999999999;
//			console.debug((new Date()).getTime());
			for (var i=0;i<self.ids.length;i++){
				//ignoring the scores that have id and have a '.'
				var trs=[];
				if (self.ids[i].indexOf(".")==-1) trs= self.oTable.$('tr', {"filter": "applied"}).filter("[id*='"+self.ids[i]+"']");
				if (trs.length>0){
					var doc = $(trs[0]).data("doc");
					var c=""; 
					if (doc.protein1==self.ids[i])
						c=(feature=="organism")?doc["organism1"]:doc["p1_"+feature];
					else
						c=(feature=="organism")?doc["organism2"]:doc["p2_"+feature];

					doc.c=c;
					if (c=="Unknown") break;

					if (typeof c=="undefined" || !isNumber(c))
						throw "not a number"; 
					if (c>max) max = c*1;
					if (c<min) min = c*1;
				}
			}
			var m=(from-to)/(min-max);
			var b=to-m*max;
//			console.debug((new Date()).getTime());
			for (var i=0;i<self.ids.length;i++){
				//ignoring the scores that have id and have a '.'
				var trs=[];
				if (self.ids[i].indexOf(".")==-1) trs= self.oTable.$('tr', {"filter": "applied"}).filter("[id*='"+self.ids[i]+"']");
				if (trs.length>0){
//					var doc = $(trs[0]).data("doc");
					var c=$(trs[0]).data("doc").c; //""
//					if (doc.protein1==self.ids[i])
//						c=(feature=="organism")?doc["organism1"]:doc["p1_"+feature];
//					else
//						c=(feature=="organism")?doc["organism2"]:doc["p2_"+feature];

					if (c=="Unknown") 
						trs.children().filter("[content="+self.ids[i]+"]").data("size",1);
					else
						trs.children().filter("[content="+self.ids[i]+"]").data("size",Math.sqrt(m*c+b));
				}
			}
//			console.debug((new Date()).getTime());
			self.resizeBy(selectorTR,selectorTD);
//			console.debug((new Date()).getTime());
		},
		paintCell:function(selectorTR,selectorTD,color){ //paint protein
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					$(td).css('color', color);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).each(function(i,tr){
					$(tr.children).filter(selectorTD).css('color', color);
				});
				
			}
			self.oTable.fnFilter('');		
		},
		hideCell:function(selectorTR,selectorTD){ //paint protein
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					$(td).css('color', "transparent");
					$(td).css('border-color', "transparent");
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).each(function(i,tr){
					$(tr.children).filter(selectorTD).css('color', "transparent");
					$(tr.children).filter(selectorTD).css('border-color', "transparent");
				});
				
			}
			self.oTable.fnFilter('');		
		},
		showCell:function(selectorTR,selectorTD){ //paint protein
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					$(td).css('color', "");
					$(td).css('border-color', "");
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).each(function(i,tr){
					$(tr.children).filter(selectorTD).css('color', "");
					$(tr.children).filter(selectorTD).css('border-color', "");
				});
				
			}
			self.oTable.fnFilter('');		
		},
		paintBorderCell:function(selectorTR,selectorTD,color){ //paint border protein
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					$(td).css('border', "1px solid "+color);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).each(function(i,tr){
					$(tr.children).filter(selectorTD).css('border', "1px solid "+color);
				});
				
			}
			self.oTable.fnFilter('');		
		},
		colorBySeed:function(selectorTR,selectorTD,type){
			var self=this;
			selectorTR = (typeof selectorTR=="undefined")?"tr[id*=cell_]":selectorTR;
			var proteins = self.manager.widgets["requester"].getQueries();
			for (var j=proteins.length-1;j>=0;j--){
				for (var i=0;i<self.trIds.length;i++){
					if (self.trIds[i].indexOf(proteins[j])!=-1)
						self.oTable.$('tr', {"filter": "applied"}).filter("#"+self.trIds[i]).children().filter(selectorTD).data("group",j);
				}
			}
			if (typeof type != "undefined" && type=="color")
				self.colorBy(selectorTR,selectorTD,proteins.length);
			else
				self.borderBy(selectorTR,selectorTD,proteins.length);
		},
		colorByFeature: function(selectorTR,selectorTD,feature,type){
			var self = this;
			selectorTR = (typeof selectorTR=="undefined")?"tr[id*=cell_]":selectorTR;
			var classes =[];
			for (var i=0;i<self.ids.length;i++){
				//ignoring the scores that have id and have a '.'
				var trs=[];
				if (self.ids[i].indexOf(".")==-1) trs= self.oTable.$('tr', {"filter": "applied"}).filter("[id*='"+self.ids[i]+"']");
				if (trs.length>0){
					var doc = $(trs[0]).data("doc");
					var c=""; 
					if (doc.protein1==self.ids[i])
						c=(feature=="organism")?doc["organism1"]:doc["p1_"+feature];
					else
						c=(feature=="organism")?doc["organism2"]:doc["p2_"+feature];
					var g = classes.indexOf(c);
					if (g==-1){
						g = classes.length;
						classes.push(c);
					}
					trs.children().filter("[content="+self.ids[i]+"]").data("group",g);
				}
			}
			
			var classesS=classes.slice(0);
			if (isNumberArray(classesS))
				classesS.sort(function(a,b){return a-b;});
			else
				classesS.sort();
			for (var i=0;i<self.ids.length;i++){
				var trs=[];
				if (self.ids[i].indexOf(".")==-1) trs= self.oTable.$('tr', {"filter": "applied"}).filter("[id*='"+self.ids[i]+"']");
				if (trs.length>0){
					var g =trs.children().filter("[content="+self.ids[i]+"]").data("group");
					trs.children().filter("[content="+self.ids[i]+"]").data("group",classesS.indexOf(classes[g]));
				}
			}
			
			if (typeof type != "undefined" && type=="color")
				self.colorBy(selectorTR,selectorTD,classes.length);
			else
				self.borderBy(selectorTR,selectorTD,classes.length);
		},
		borderBy:function(selectorTR,selectorTD,numberOfClasses){
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('border', "1px solid "+getDistinctColors(numberOfClasses)[group]);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).children().filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('border', "1px solid "+getDistinctColors(numberOfClasses)[group]);
				});
			}
			self.oTable.fnFilter('');		
		},
		colorBy:function(selectorTR,selectorTD,numberOfClasses){
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('color', getDistinctColors(numberOfClasses)[group]);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).children().filter(selectorTD).each(function(i,td){
						var group=$(td).data("group");
						if(typeof group!="undefined" && group*1>-1) 
							$(td).css('color', getDistinctColors(numberOfClasses)[group]);
				});
			}
			self.oTable.fnFilter('');		
		},
		resizeBy:function(selectorTR,selectorTD){
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					var size=$(td).data("size");
					if(typeof size!="undefined" && size*1>-1) 
						$(td).css('font-size', size+"em");
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).children().filter(selectorTD).each(function(i,td){
						var size=$(td).data("size");
						if(typeof size!="undefined" && size*1>-1) 
							$(td).css('font-size', size+"em");
				});
			}
			self.oTable.fnFilter('');		
		},
		registerStyler:function(name,styler){
			var self = this;
			self.stylers[name]=styler;
		},
		executeStylers: function(){
			var self = this;
			if (self.oTable==null) return;
			self.oTable.fnFilter('');		
			self.oTable.$('tr', {"filter": "applied"}).css('backgroundColor', '');
			self.oTable.$('td', {"filter": "applied"}).css('color', '');
			self.oTable.$('td', {"filter": "applied"}).css('border', '');
			self.oTable.$('td', {"filter": "applied"}).css('font-size', '1em');
			//self.oTable.$('td', {"filter": "applied"}).css('border', 'border-left: 3px solid white;');
			
			//clean table
			for (var i in self.stylers){
//				console.debug("styler:"+i);
				self.stylers[i]();
			}
		},
		stylers:{},
		initTest: function(){
			var self = this;
			ok($("#"+self.target).html()!="", "Widget("+self.id+"-TableWidget): The target element has been loaded and its not empty");
			ok($("#"+self.target+" table").length>0,"Widget("+self.id+"-TableWidget): The target contains at least a TABLE element");
			var oTable=$("#"+self.target+"_table");
			ok(typeof oTable != "undefined","Widget("+self.id+"-TableWidget): The jquery plugin datatable has been initializated in the expected element");
			var oSettings = oTable.dataTable().fnSettings();
			ok(typeof oSettings != "undefined","Widget("+self.id+"-TableWidget): The settings datatable have been recovered");
			equal(oSettings.sPaginationType, "full_numbers","Widget("+self.id+"-TableWidget): The setting value for sPaginationType is as expected");
			equal( $("#"+self.target+" th[role=columnheader]").length ,model.length,"Widget("+self.id+"-TableWidget): Number of visible columns equal to the number of main fields");
			equal(Object.keys(self.stylers).length,self.predefined_stylers.length,"Widget("+self.id+"-TableWidget): the number of stylers is according to the json");
		},
		status2JSON:function(){
			var self = this;
			var visible=[];
			$("#"+self.target+" th.more span").each(function(i,v){
				if ($(v).text()==self.textLess)
					visible.push($(v).attr("class"));
			});
			return {"visibleClasses":visible,
					"numberOfRows":self.oTable.fnSettings()._iDisplayLength,
					"startsAt":self.oTable.fnSettings()._iDisplayStart};
		},
		onceOffStatus:null,
		uploadStatus:function(json){
			var self = this;
			if (self.oTable==null){
				self.onceOffStatus=json;
				return;
			} 
			for(var i=0;i<json.visibleClasses.length;i++)
				$("#"+self.target+" th.more span."+json.visibleClasses[i]).click();
			self.oTable.fnSettings()._iDisplayLength = json.numberOfRows;
			self.oTable.fnSettings()._iDisplayStart = json.startsAt;
			$("#"+self.target+" .dataTables_length select option").each(function(){
				 if ($(this).text() == json.numberOfRows) {
				        $(this).attr("selected",true);
			    } else {
			        $(this).removeAttr("selected");
			    }
			});
			self.oTable.fnPageChange( json.startsAt/json.numberOfRows );
		}


	});
})(jQuery);