(function ($) {
	AjaxSolr.SvgExporter = AjaxSolr.AbstractWidget.extend({
		supportedFormats:["PNG","SVG","Share"],
		afterRequest: function(){
			var self=this;
			$("#"+self.id).remove();
			var html ='<div id="'+self.id+'" class="svgexporter">';
			if (getURLParameter("embedded")=="true"){
				html += '<a  target="_parent" href ="'+Manager.widgets["requester"].getURL()+'" class="logo"><img src="biosual/widgets/SvgExporter/images/PINV_50.png" /></a>';
			}else

				for (var i=0;i<self.formats.length;i++){
					if (self.supportedFormats.indexOf(self.formats[i])!=-1){
						html += '<a class="'+self.formats[i]+'"><img src="biosual/widgets/SvgExporter/images/File_'+self.formats[i]+'_64.png" /></a>';
						if (self.formats[i]=="Share") html += '<div class="share">'+self.getHTML4ShareDIV()+'</div>';
					}
				}
			html += '</div>';
			$(self.target).append(html);

			$(self.target+" .SVG")
				.click(function(){
					var svgDom =$(self.target+" svg").clone()
						.attr("version", 1.1)
						.attr("xmlns", "http://www.w3.org/2000/svg");
					if (typeof self.css != "undefined" && self.css!=null && self.css!="")
						svgDom.prepend('<style type="text/css" ><![CDATA[  '+self.css+'  ]]></style>');
					var svg = $("<div />").append(svgDom).html();
					
					if(/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())){
						$("body").append("<a id='"+self.id+"_link' download='pinv_export.svg' title='pinv_export.svg' target='_blank'>downloading...</a>");
						$("#"+self.id+"_link").attr("href","data:application/octet-stream;title:export.svg;base64,\n" + btoa(svg));
						$("#"+self.id+"_link")[0].click();
						$("#"+self.id+"_link").remove();
					}else{
						window.open( "data:application/octet-stream;title:export.svg;base64,\n" + btoa(svg),"_blank","title=export.svg");
					}

				});
			$(self.target+" .PNG")
			.click(function(){
				var svgDom =$(self.target+" svg").clone()
					.attr("version", 1.1)
					.attr("xmlns", "http://www.w3.org/2000/svg");
				if (typeof self.css != "undefined" && self.css!=null && self.css!="")
					svgDom.prepend('<style type="text/css" ><![CDATA[  '+self.css+'  ]]></style>');
				var svg = $("<div />").append(svgDom).html();
				svg = svg.replace(/\)translate/g,") translate");
				var canvas = document.createElement("canvas");
				document.body.appendChild(canvas);
				
				canvg(canvas, svg);
				
				var img = canvas.toDataURL("image/png");
				if(/chrom(e|ium)/.test(navigator.userAgent.toLowerCase())){
					$("body").append("<a id='"+self.id+"_link' download='pinv_export.png' title='pinv_export.png' target='_blank'>downloading...</a>");
					$("#"+self.id+"_link").attr("href", img);
					$("#"+self.id+"_link")[0].click();
					$("#"+self.id+"_link").remove();
				}else{
					window.open( img,"_blank","title=export.png;download=export.png");
				}
				
				document.body.removeChild(canvas);

			});
			if (self.formats.indexOf("Share")!=-1){
				$(self.target+" .Share").click(function(){
					$(self.target+" div.share").css("left","1px");
				});
				$(self.target+" .share div.close").click(function(){
					$(self.target+" div.share").css("left","-999px");
				});
				$(self.target+" #getStatus").click(function(){
					self.status={};
					for (var widg in Manager.widgets){
						var widget = Manager.widgets[widg];
						if ( typeof widget.status2JSON !="undefined"){
							var st=widget.status2JSON();
							if (st!=STATUS.NO_APPLICABLE)
								self.status[widg]=st;
						}
					}
					$(self.target+" textarea").html(JSON.stringify(self.status));
				});
				$(self.target+" #loadStatus").click(function(){
					self.status=JSON.parse($(self.target+" textarea").val());
					for (var widg in self.status){
						var widget = Manager.widgets[widg];
						if ( typeof widget.uploadStatus !="undefined"){
							widget.uploadStatus(self.status[widg]);
							
						}
					}
				});
			}
		},
		status:{},
		shareByURL:true,
		shareByEmbed:true,
		shareBySocialNetworks:false,
		getHTML4ShareDIV: function(){
			var self = this;
			var html ="	<header>Share your Network</header>";
			html += "	<div class='close'/>";
			html += "	<ul>";
			if (self.shareByURL) {
				html += "		<li>URL (only proteins queried):<br/>" +
						"			<input type='text' class='tocopy' onClick='$(this).select()' value='"+Manager.widgets["requester"].getURL()+"'/><br/>" +
						"		</li>";
			}
			if (self.shareByEmbed) {
				html += "		<li><a id='getStatus'>GET</a> <a id='loadStatus'>LOAD</a><br/><textarea><iframe width=\"640\" height=\"480\" src=\""+Manager.widgets["requester"].getURL()+"&embedded=true\" frameborder=\"0\" allowfullscreen></iframe></textarea></li>";
			}
			if (self.shareBySocialNetworks) {
				html += "		<li>Social media</li>";
			}
			html += "	</ul>";
			html += "		";
			return html;
		},
		status2JSON:function(){
			return STATUS.NO_APPLICABLE;
		},
		uploadStatus:function(json){
			return STATUS.NO_APPLICABLE;
		}
	});
})(jQuery);