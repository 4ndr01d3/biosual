(function ($) {
	AjaxSolr.TableWidget = AjaxSolr.AbstractFacetWidget.extend({
		textMore:"More Columns >>>",
		textLess:"<<< Less Columns",
		previousRequest:null,
		
		init: function () {
			$("#"+this.target).empty();
			
			var self=this;
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
				"iDisplayLength": 30,
				"bSortClasses": false,
				"bAutoWidth": false,
				"sDom": 'T<"clear">lfrtip',
				"oTableTools": {
					"aButtons": [ "copy", "csv" ],
					"sSwfPath": "../../widgets/TableWidget/copy_csv_xls_pdf.swf"
				}
		    });
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
				});
			}
			var colnum=0;
			for (var i=0;i<self.columns.length;i++){
				colnum++;
				if(typeof self.columns[i].subcolumns != "undefined")
					for (var j=0;j<self.columns[i].subcolumns.length;j++)
						oTable.fnSettings().aoColumns[colnum++].sClass="subcolumn";
			}
		},
		responses:[],
		afterRequest: function () {
			var self=this;
			if (self.previousRequest!=null && self.previousRequest=="*:*")
				self.afterRemove("*:*");
			self.processJson( this.manager.response);
			self.responses.push(this.manager.response);

			self.previousRequest=self.manager.store.get('q').val();
		},
		processJson: function(json){
			var self=this;
			var oTable=$("#"+self.target+"_table").dataTable();
			for (var i = 0, l = json.response.docs.length; i < l; i++) {
				var doc = json.response.docs[i];
				var doc_array=[];
				for (var j=0;j<self.columns.length;j++){
					doc_array.push(doc[self.columns[j].id]);
					if (typeof self.columns[j].subcolumns !="undefined")
						for (var k=0;k<self.columns[j].subcolumns.length;k++)
							doc_array.push(doc[self.columns[j].subcolumns[k]]);
				}
				oTable.fnAddData( doc_array,false);
			}			
			oTable.fnDraw();
		},
		afterRemove: function (facet) {
			var self=this;
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    if (doc.responseHeader.params.q.indexOf(facet)!=-1){
			    	self.responses.splice(i--,1);
			    }
			}
			self.restartTable();
//			self.visibleProteins = Object.keys(self.graph.proteins);
//			self.executeStylers();
		},
		restartTable: function(){
			var self = this;
			var oTable=$("#"+self.target+"_table").dataTable();
			oTable.fnClearTable();
			for (var i=0; i< self.responses.length; i++){
			    var doc = self.responses[i];
			    self.processJson(doc);
			}
		}
	});
})(jQuery);