// $Id$

/**
 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
 * @class Manager
 * @augments AjaxSolr.AbstractManager
 */
AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
  /** @lends AjaxSolr.Manager.prototype */
  {
  executeRequest: function (servlet, string, handler) {
    var self = this;
    string = string || this.store.string();
    handler = handler || function (data) {
      self.handleResponse(data);
    };
    
    var blob = new Blob([
                         "self.addEventListener('message', function(e) {" +
                         "\n	fetch(e.data, function(xhr) {	" +
                         "\n		var result = xhr.responseText;" +
                         "\n		var object = JSON.parse(result);" +
                         "\n		self.postMessage(JSON.stringify(object));" +
                         "\n	});" +
                         "\n}, false);" +
                         "\n" +
                         "\nfunction fetch(url, callback) {" +
                         "\n		var xhr;" +
                         "\n		if(typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();" +
                         "\n		else {" +
                         "\n			var versions = [\"MSXML2.XmlHttp.5.0\", \"MSXML2.XmlHttp.4.0\",\"MSXML2.XmlHttp.3.0\", \"MSXML2.XmlHttp.2.0\",\"Microsoft.XmlHttp\"];" +
                         "\n			for(var i = 0, len = versions.length; i < len; i++) {" +
                         "\n				try {" +
                         "\n					xhr = new ActiveXObject(versions[i]);" +
                         "\n					break;" +
                         "\n				} catch(e){}" +
                         "\n			} " +
                         "\n		}" +
                         "\n		xhr.onreadystatechange = ensureReadiness;" +
                         "\n		function ensureReadiness() {" +
                         "\n			if(xhr.readyState < 4) " +
                         "\n				return;" +
                         "\n			if(xhr.status !== 200) " +
                         "\n				return;" +
                         "\n			if(xhr.readyState === 4) {" +
                         "\n				callback(xhr);" +
                         "\n			}			" +
                         "\n		}" +
                         "\n		xhr.open('GET', url, true);" +
                         "\n		xhr.send('');" +
                         "\n}" +
                         ""]);

                     // Obtain a blob URL reference to our worker 'file'.
                     var blobURL = window.URL.createObjectURL(blob);

                     var worker = new Worker(blobURL);
                     worker.onmessage = function(e) {
                    	 handler(JSON.parse(e.data));
                     };
                     worker.postMessage(this.solrUrl + servlet + '?' + string + '&wt=json'); // Start the worker.
    
    
  }
});
