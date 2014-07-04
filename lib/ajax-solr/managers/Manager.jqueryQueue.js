//$Id$

/**
 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
 * @class Manager
 * @augments AjaxSolr.AbstractManager
 */
AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
/** @lends AjaxSolr.Manager.prototype */
{
	queue: [],
	_busy:false,
	executeRequest: function (servlet, string, handler) {
		var self = this;
		string = string || this.store.string();
		handler = function (data) {
			self.handleResponse(data);
		};
		var excObj = {"servlet":servlet, "string":string, "handler":handler};
		if (!self._busy)
			self._execute(excObj);
		else
			self.queue.push(excObj);
	},
	_execute: function (excObj) {
		var self = this;
		self._busy=true;
		if (this.proxyUrl) {
			jQuery.post(this.proxyUrl, { query: excObj.string }, excObj.handler, 'json');
		}
		else {
			jQuery.getJSON(this.solrUrl + excObj.servlet + '?' + excObj.string + '&wt=json&json.wrf=?', {}, excObj.handler).always(function() {
				self._busy=false;
				if (self.queue.length>0){
					var obj=self.queue[0];
					self.queue.splice(0,1);
					self._execute(obj);
				}
			}).error(function() { 
				alert("One of the server queries has an error."); 
			});
		}
	},
});
