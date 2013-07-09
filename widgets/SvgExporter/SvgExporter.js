(function ($) {
	AjaxSolr.SvgExporter = AjaxSolr.AbstractWidget.extend({
		supportedFormats:["PNG","SVG"],
		afterRequest: function(){
			var self=this;
			$("#"+self.id).remove();
			var html ='<div id="'+self.id+'" class="svgexporter">';
			for (var i=0;i<self.formats.length;i++){
				if (self.supportedFormats.indexOf(self.formats[i])!=-1)
					html += '<a class="'+self.formats[i]+'"><img src="widgets/SvgExporter/images/File_'+self.formats[i]+'_64.png" /></a>';
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
		}
	});
})(jQuery);