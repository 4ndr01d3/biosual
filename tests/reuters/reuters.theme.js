(function ($) {

AjaxSolr.theme.prototype.result = function (doc, snippet,attributeNames) {
  var output = '<div><h2>' + doc[attributeNames["title"]] + '</h2>';
  output += '<p id="links_' + doc[attributeNames["id"]] + '" class="links"></p>';
  output += '<p>' + snippet + '</p></div>';
  return output;
};

AjaxSolr.theme.prototype.snippet = function (doc,attributeNames) {
  var output = '';
  if (doc[attributeNames["text"]].length > 300) {
    output += doc[attributeNames["date"]] + ' ' + doc[attributeNames["text"]].substring(0, 300);
    output += '<span style="display:none;">' + doc[attributeNames["text"]].substring(300);
    output += '</span> <a href="#" class="more">more</a>';
  }
  else {
    output += doc[attributeNames["date"]] + ' ' + doc[attributeNames["text"]];
  }
  return output;
};

AjaxSolr.theme.prototype.tag = function (value, weight, handler) {
  return $('<a href="#" class="tagcloud_item"/>').text(value).addClass('tagcloud_size_' + weight).click(handler);
};

AjaxSolr.theme.prototype.facet_link = function (value, handler) {
  return $('<a href="#"/>').text(value).click(handler);
};

AjaxSolr.theme.prototype.no_items_found = function () {
  return 'no items found in current selection';
};

})(jQuery);
