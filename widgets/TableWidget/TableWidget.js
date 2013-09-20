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
				modelrequester.done(function(p){
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
			if(self.manager.store.get('q').val()=="*:*"){
				self.ids=[];
				self.trIds=[];
				self.responses=[];
				self.restartTable();
			}
			if (self.previousRequest!=null && self.previousRequest=="*:*")
				self.afterRemove("*:*");
			if (typeof self.columns =="undefined"){
				modelrequester.done(function(p){
					self.processJson( self.manager.response);
				});
			}else
				self.processJson( this.manager.response);

			self.responses.push(this.manager.response);

			self.previousRequest=self.manager.store.get('q').val();
		},
		processJson: function(json){
			var self=this;
			for (var i = 0, l = json.response.docs.length; i < l; i++) {
				var doc = json.response.docs[i];
				var doc_array=[];
				var id = "cell_"+doc[self.fields["p1"]]+"_"+doc[self.fields["p2"]];
				if (self.trIds.indexOf(id)==-1)
					self.trIds.push(id);
				else
					continue;
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
				$(ntr.children).filter(".cell_"+self.columns[0].id).attr( "content", $(ntr.children).filter(".cell"+self.columns[0].id).text());
				$(ntr.children).filter(".cell_"+self.columns[2].id).attr( "content", $(ntr.children).filter(".cell_"+self.columns[2].id).text());
				$(ntr).data("doc",doc);
			}			
			self.oTable.fnDraw();
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
				self.colorBy(selectorTR,selectorTD);
			else
				self.borderBy(selectorTR,selectorTD);
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
			if (typeof type != "undefined" && type=="color")
				self.colorBy(selectorTR,selectorTD);
			else
				self.borderBy(selectorTR,selectorTD);
		},
		borderBy:function(selectorTR,selectorTD){
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('border', "1px solid "+self.colors[group]);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).children().filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('border', "1px solid "+self.colors[group]);
				});
			}
			self.oTable.fnFilter('');		
		},
		colorBy:function(selectorTR,selectorTD){
			var self = this;
			self.oTable.fnFilter("");
			if (selectorTR==null ||selectorTR=="") {
				self.oTable.$('td', {"filter": "applied"}).filter(selectorTD).each(function(i,td){
					var group=$(td).data("group");
					if(typeof group!="undefined" && group*1>-1) 
						$(td).css('color', self.colors[group]);
				});
			}else{
				self.oTable.$('tr', {"filter": "applied"}).filter(selectorTR).children().filter(selectorTD).each(function(i,td){
						var group=$(td).data("group");
						if(typeof group!="undefined" && group*1>-1) 
							$(td).css('color', self.colors[group]);
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
			self.oTable.fnFilter('');		
			self.oTable.$('tr', {"filter": "applied"}).css('backgroundColor', '');
			self.oTable.$('td', {"filter": "applied"}).css('color', '');
			self.oTable.$('td', {"filter": "applied"}).css('border', '');
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
		uploadStatus:function(json){
			var self = this;
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
		},
		colors: [ "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", 
		          "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5",
		          '#3399FF', '#99FF66', '#66FF99', '#CCFF00', '#6699CC', '#99CC00', '#99FFCC', '#993399', '#33FFFF', '#33CC33', 
		         '#66CCFF', '#009999', '#00FFFF', '#CC66CC', '#FF9966', '#CC3300', '#009966', '#660000', '#99FF33', '#330066', 
		         '#FFFF00', '#0099FF', '#FF6699', '#33FF00', '#FFFFCC', '#990000', '#99CC33', '#0033CC', '#006699', '#6699FF', 
		         '#FFCC00', '#330099', '#999999', '#666633', '#FFCC99', '#00CCCC', '#006633', '#CCCC99', '#3300FF', '#33CC66', 
		         '#339999', '#6666FF', '#33FF66', '#990033', '#33CC99', '#993300', '#00FF00', '#666699', '#00CC00', '#FF66CC', 
		         '#00FFCC', '#FF9999', '#66FF00', '#003366', '#CCFF33', '#660066', '#6633CC', '#FF3366', '#99FF00', '#FF33CC', 
		         '#CCFFCC', '#99CCCC', '#3300CC', '#0066FF', '#66CC33', '#3366CC', '#CCCCCC', '#FF0000', '#6666CC', '#336699', 
		         '#999966', '#FFFF99', '#66CC99', '#FF0033', '#999933', '#CC99FF', '#FF0099', '#6600CC', '#CC9966', '#00CC66', 
		         '#33CC00', '#666666', '#33CCCC', '#FF0066', '#00CC33', '#FFCC66', '#FF6600', '#9999FF', '#CC66FF', '#9933FF', 
		         '#FF00CC', '#CC3399', '#CC6633', '#33FFCC', '#FF33FF', '#009900', '#660099', '#669999', '#CC3366', '#0099CC', 
		         '#9900FF', '#669933', '#FFFFFF', '#CCCCFF', '#66CCCC', '#669966', '#0066CC', '#CC9900', '#663300', '#33FF99', 
		         '#996666', '#3399CC', '#99FF99', '#66CC66', '#CC0066', '#CCFF66', '#663366', '#99CC66', '#000033', '#003333', 
		         '#FF6666', '#009933', '#FFFF66', '#996699', '#FFCCCC', '#00CCFF', '#339966', '#3366FF', '#00CC99', '#336633', 
		         '#FF99FF', '#663333', '#CCFF99', '#CC99CC', '#339933', '#33CCFF', '#333366', '#006666', '#CC6600', '#333300', 
		         '#FFCC33', '#9966CC', '#003300', '#9966FF', '#996600', '#CC9933', '#9999CC', '#FF9933', '#006600', '#6633FF', 
		         '#CC6699', '#FF3399', '#993333', '#CCFFFF', '#330033', '#FFCCFF', '#FFFF33', '#990066', '#CCCC66', '#CC0099', 
		         '#CCCC00', '#339900', '#660033', '#FF00FF', '#333333', '#99CC99', '#66FFCC', '#003399', '#999900', '#99FFFF', 
		         '#990099', '#3333FF', '#CC33CC', '#CC6666', '#3333CC', '#9900CC', '#9933CC', '#CC0033', '#CC00FF', '#FF99CC', 
		         '#FF66FF', '#66FFFF', '#6600FF', '#66FF66', '#996633', '#669900', '#00FF99', '#CC9999', '#993366', '#CC33FF', 
		         '#336666', '#0033FF', '#336600', '#CC0000', '#FF9900', '#33FF33', '#000000', '#99CCFF', '#000066', '#0000CC', 
		         '#000099', '#00FF33', '#666600', '#66FF33', '#CCCC33', '#66CC00', '#FF3333', '#CC3333', '#663399', '#333399', 
		         '#FF3300', '#0000FF', '#CC00CC', '#00FF66', '#330000', '#FF6633']


	});
})(jQuery);