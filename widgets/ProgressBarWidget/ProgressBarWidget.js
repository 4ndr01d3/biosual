(function ($) {
	AjaxSolr.ProgressBarWidget = AjaxSolr.AbstractWidget.extend({
		bars:{},
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
			var top=50+$(".pgb_container").size()*152;
			$("#"+self.target).append(html);
			$("#"+self.target+" .progress_mask").show();
			$("#pgb_"+id).show();
			$("#pgb_"+id).css("top",top+"px");
		},
		updateProgressBarValue: function(id,progress,total){
			var per =100.0*progress/total;
			$("#pgb_"+id+" progress").attr("value",per);
			$("#pgb_"+id+" progress .progress-bar span").css("width",per+"%");
			$("#pgb_"+id+" progress .progress-bar span").html("Progress: "+per+"%");
			$("#pgb_"+id+" p.pgb_progress_label").html("Progress: "+progress+"/"+total+"");
			if (total==progress){
				$("#pgb_"+id).remove();
				if ($(".pgb_container").size()==0)
					$("#"+self.target+" .progress_mask").hide();
			}
		}
	});
})(jQuery);