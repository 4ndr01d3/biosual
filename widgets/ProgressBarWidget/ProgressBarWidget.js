(function ($) {
	AjaxSolr.ProgressBarWidget = AjaxSolr.AbstractWidget.extend({
		bars:{},
		pgbNum:0,
		addProgressBar: function(id,subtitle){
			subtitle = subtitle || "";
			var self = this;
			html =	"<div id =\"pgb_"+id+"\" class=\"pgb_container\">" +
					"	<header>Reported Progress</header>" +
					"	<p class=\"pgb_subtitle\">"+subtitle+"</p>" +
					"	<progress max=\"100\" value=\"0\"  class=\"pgb\">" +
					"		<div class=\"progress-bar\">" +
					"			<span style=\"width: 0%;\">Progress: 0%</span>" +
					"		</div>" +
					"	</progress>" +
					"	<p class=\"pgb_progress_label\"></p>" +
					"</div>";
			var top=50+(self.pgbNum%4)*160;
			var left=-620+parseInt(self.pgbNum/4)*420;
			$("#"+self.target).append(html);
			$("#"+self.target+" .progress_mask").show();
			$("#pgb_"+id).show();
			$("#pgb_"+id).css("top",top+"px");
			$("#pgb_"+id).css("margin-left",left+"px");
			self.pgbNum=(self.pgbNum>12)?0:self.pgbNum+1;
		},
		updateProgressBarValue: function(idOri,progress,total){
			var id=idOri.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
			var per =100.0*progress/total;
			$("#pgb_"+id+" progress").attr("value",per);
			$("#pgb_"+id+" progress .progress-bar span").css("width",per+"%");
			$("#pgb_"+id+" progress .progress-bar span").html("Progress: "+per+"%");
			$("#pgb_"+id+" p.pgb_progress_label").html("Progress: "+progress+"/"+total+"");
			if (total<=progress){
				$("#pgb_"+id).remove();
				if ($(".pgb_container").size()==0)
					$("#"+self.target+" .progress_mask").hide();
			}
		},
		isProgressBarSet:function(id){
			var self = this;
			return (typeof self.bars[id]!="undefined");
		}
	});
})(jQuery);