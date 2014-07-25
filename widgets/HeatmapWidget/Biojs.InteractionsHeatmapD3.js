/**
 * This component uses the D3 library to create a heat map that represents the interactions between proteins 
 * 
 * @class
 * @extends Biojs
 * 
 * @author <a href="mailto:gustavoadolfo.salazar@gmail.com">Gustavo A. Salazar</a>
 * @version 0.0.1
 * @category 1
 * 
 * @requires <a href='http://code.jquery.com/query-1.7.2.min.js'>jQuery Core 1.7.2</a>
 * @dependency <script language="JavaScript" type="text/javascript" src="../biojs/dependencies/jquery/jquery-1.7.2.min.js"></script>
 * 
 * @requires <a href='http://d3js.org/'>D3</a>
 * @dependency <script src="http://d3js.org/d3.v2.min.js" type="text/javascript"></script>
 *
 * @requires <a href='../css/biojs.InteractionsheatmapD3.css'>Interactions heatmap CSS</a>
 * @dependency <link rel="stylesheet" href="../biojs/css/biojs.InteractionsheatmapD3.css" />
 * 
 * @param {Object} options An object with the options for the InteractionsHeatmapD3 component.
 * 
 * @option {string} target
 *    Identifier of the DIV tag where the component should be displayed.
 * @option {int} width
 *    Width of the SVG element, if given in percentage it will use it on proportion of the container 
 * @option {int} height
 *    Height of the SVG element, if given in percentage it will use it on proportion of the container 
 * @option {Object} margin
 *    Margin around the component before rotating it 45 degrees. The attributes of the object should be integers and are named top, right, bottom and left 
 * 
 * @example
 * 			var instance = new Biojs.InteractionsHeatmapD3({
 * 				target: "YourOwnDivId",
 * 			});	
 * 			for (var pid=1;pid<=15;pid++)
 *				instance.addProtein({ "id":pid,"name":pid,"showLegend":false,"typeLegend":"id","group":pid%4,"organism":"human"+pid%3,"features":{"f1":"val1","f2":"val2","f3":"val3"}});
 *			
 * 			for (var pid=1;pid<=30;pid++)
 *				instance.addInteraction(Math.floor((Math.random()*15)+1),Math.floor((Math.random()*15)+1) ,{score:Math.random()});
 * 			instance.restart();
 */
Biojs.InteractionsHeatmapD3 = Biojs.extend (
	/** @lends Biojs.InteractionsHeatmapD3# */
	{
		
		interactions:[],
		interactionsA:{},
		proteins:[],
		proteinsA:{},

		constructor: function (options) {
			var self =this;
			
			self.initialize();
			var width  = self.opt.width,
				height = self.opt.height,
				margin = self.opt.margin,
				side = self.side;
			
			
			
			self.svg_p = d3.select("#"+self.opt.target).append("svg")
				.attr("class","heatmap_network")
				.attr("width", width)
				.attr("height", height );
			
			self.svg_p.append('svg:rect')
			    .attr('width', width)
			    .attr('height', height)
			    .attr('x', 0)
			    .attr('y', 0)
			    .attr('fill', 'white')
			    .attr('stroke','white');

			self.info=self.svg_p.append("g")
			.attr("class","info");
	
			self._createInfoFrame("left");
			self._createInfoFrame("right");
		
			
			self.svg=self.svg_p.append("g")
			    	.attr("transform", "translate(" + (width/2 -self.h/2) +"," + (height)+ ")rotate(-45)");
			self.perspective=d3.select("#"+self.opt.target + " svg").append('svg:g');

		},
		initialize: function(){
			var self =this;
			var width  = Number(self.opt.width),
				height = Number(self.opt.height),
				margin = self.opt.margin;
			
			self.side =height;
			if (height<width/2){
				self.side = Math.floor(Math.sqrt(2)*(height-margin.left));
			} else {
				self.side = Math.floor(Math.sqrt(2)*(width/2-margin.left));
			}
		
			self.x = d3.scale.ordinal().rangeBands([0, self.side]),
			self.z = d3.scale.linear().domain([0, 4]).clamp(true),
			self.c = d3.scale.category10().domain(d3.range(10));
	
			self.h = Math.sqrt(2)*self.side;
			self.htop = Math.sqrt(margin.left*margin.left + margin.top*margin.top);
			
		},
		_createInfoFrame: function(side){
			var self=this;
			var frame = self.info.insert("rect")
				.attr("class",side+"_frame info_frame")
		    	.attr("rx", "20")
		    	.attr("ry", "20")
				.style("fill", "rgba(30,60,200,0.01)");
			self.info.append('text')
				.attr('x', 0)
			    .attr('y', 0)
			    .attr("class", side+"_title info_title");
			self.info.append('text')
				.attr('x', 0)
			    .attr('y', 0)
			    .attr("class", side+"_content info_content");
			self.info.append("clipPath")
				.attr("id","clip_"+side).append("rect")
				.attr("y",5);
		},
		/**
		 *  Default values for the options
		 *  @name Biojs.InteractionsHeatmapD3-opt
		 */
		opt: {
			target: "YourOwnDivId",
			width: 720,
			height: 720,
			margin: {
				top: 80, 
				right: 80, 
				bottom: 10, 
				left: 80
			}
		},

		/**
		 * Array containing the supported event names
		 * @name Biojs.InteractionsHeatmapD3-eventTypes
		 */
		eventTypes : [
			/**
			 * @name Biojs.InteractionsHeatmapD3#proteinClick
			 * @event
			 * @param {function} actionPerformed It is triggered when the user clicks on a protein
			 * @eventData {@link Biojs.Event} objEvent Object containing the information of the event
			 * @eventData {Object} objEvent.source The component which did triggered the event.
			 * @eventData {Object} objEvent.protein the information of the protein that has been clicked.
			 * @example 
			 * instance.proteinClick(
			 *    function( objEvent ) {
			 *       alert("The protein " + objEvent.protein.id + " was clicked.");
			 *    }
			 * ); 
			 * 
			 * */
			"proteinClick",
			/**
			 * @name Biojs.InteractionsHeatmapD3#proteinMouseOver
			 * @event
			 * @param {function} actionPerformed It is triggered when the mouse pointer is over a protein
			 * @eventData {@link Biojs.Event} objEvent Object containing the information of the event
			 * @eventData {Object} objEvent.source The component which did triggered the event.
			 * @eventData {Object} objEvent.protein the information of the protein that has been mouseover.
			 * @example 
			 * instance.proteinMouseOver(
			 *    function( objEvent ) {
			 *       alert("The mouse is over the protein " + objEvent.protein.id);
			 *    }
			 * ); 
			 * 
			 * */
			"proteinMouseOver",
			/**
			 * @name Biojs.InteractionsHeatmapD3#proteinMouseOut
			 * @event
			 * @param {function} actionPerformed It is triggered when the mouse pointer leave the area of a protein
			 * @eventData {@link Biojs.Event} objEvent Object containing the information of the event
			 * @eventData {Object} objEvent.source The component which did triggered the event.
			 * @eventData {Object} objEvent.protein the information of the protein that has been mouseout.
			 * @example 
			 * instance.proteinMouseOut(
			 *    function( objEvent ) {
			 *       alert("The mouse is out the protein " + objEvent.protein.id);
			 *    }
			 * ); 
			 * 
			 * */
			"proteinMouseOut",
			/**
			 * @name Biojs.InteractionsHeatmapD3#interactionClick
			 * @event
			 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
			 * @eventData {Object} source The component which did triggered the event.
			 * @eventData {Object} interaction the information of the interaction that has been clicked.
			 * @example 
			 * instance.interactionClick(
			 *    function( objEvent ) {
			 *       alert("Click on the interaction " + objEvent.interaction.source.id +" - "+ objEvent.interaction.target.id);
			 *    }
			 * ); 
			 * 
			 * */
			"interactionClick",
			/**
			 * @name Biojs.InteractionsHeatmapD3#interactionMouseOver
			 * @event
			 * @param {function} actionPerformed A function which receives an {@link Biojs.Event} object as argument.
			 * @eventData {Object} source The component which did triggered the event.
			 * @eventData {Object} interaction the information of the interaction that has been mouseover.
			 * @example 
			 * instance.interactionMouseOver(
			 *    function( objEvent ) {
			 *       alert("The mouse is over the interaction " + objEvent.interaction.source.id +" - "+ objEvent.interaction.target.id);
			 *    }
			 * ); 
			 * 
			 * */
			"interactionMouseOver",
			/**
			 * @name Biojs.InteractionsHeatmapD3#interactionMouseOut
			 * @event
			 * @param {function} actionPerformed It is triggered when the mouse pointer leave an interaction
			 * @eventData {@link Biojs.Event} objEvent Object containing the information of the event
			 * @eventData {Object} source The component which did triggered the event.
			 * @eventData {Object} interaction the information of the interaction that has been mouseout.
			 * @example 
			 * instance.interactionMouseOut(
			 *    function( objEvent ) {
			 *      alert("The mouse is out of the interaction " + objEvent.interaction.source.id +" - "+ objEvent.interaction.target.id);
			 *    }
			 * ); 
			 * 
			 * */
			"interactionMouseOut",
			/**
			 * @name Biojs.InteractionsHeatmapD3#sizeChanged
			 * @event
			 * @param {function} actionPerformed It is triggered when the size of the SVG element has been changed. 
			 * @eventData {@link Biojs.Event} objEvent Object containing the information of the event
			 * @eventData {Object} source The component which did triggered the event.
			 * @eventData {Object} width The width of the new size
			 * @eventData {Object} height The height of the new size
			 * @example 
			 * instance.sizeChanged(
			 *    function( objEvent ) {
			 *      alert("The size has changed: ("+objEvent.width+","+objEvent.height+")" );
			 *    }
			 * ); 
			 * 
			 * */
			"sizeChanged"
		], 
		/**
		 * 
		 * allows to resize the SVG element updating the gravity points
		 * @param {string} width value of width to be assign to the SVG
		 * @param {string} height value of height to be assign to the SVG
		 *
		 * @example 
		 * instance.setSize(400,400);
		 * instance.restart();
		 */
		setSize:function(width,height){
			var self =this;
			self.opt.width=width;
			self.opt.height=height;
			self.initialize();
			self.svg_p
				.attr("width", width)
				.attr("height", height );
			self.svg
				.attr("width", self.h + self.opt.margin.left + self.opt.margin.right)
				.attr("height", self.h/2 + self.htop/2 )
				.attr("transform", "translate(" + (width/2 -self.h/2) +"," + (height)+ ")rotate(-45)");;
			self.svg.selectAll("rect.background").transition()
				.attr("width", self.side)
				.attr("height", self.side);
			self.svg.selectAll(".row .transversal")
				.attr("x2", self.side);
			self.svg.selectAll(".column .transversal")
				.attr("x2", -self.side);

			self.svg.selectAll(".row text")
				.attr("transform", "translate(" + (self.side + self.opt.margin.left)+",0)");
				
			
			self.restart();
			self.raiseEvent('sizeChanged', {
				width:width,
				height:height
			});
		},
		/**
		 * Adds an interaction between 2 proteins that are already in the graphic using their IDs
		 * 
		 * @param {string} proteinId1 Id of the first protein in the interaction
		 * @param {string} proteinId2 Id of the second protein in the interaction
		 * @param {Object} [extraAtributes={}] An object containing meta information of the interaction 
		 * 					to be stored in the interaction itself. useful for triggered events
		 *
		 * @example 
		 * instance.addInteraction(Math.floor((Math.random()*15)+1),Math.floor((Math.random()*15)+1) ,{score:Math.random()});
		 * instance.restart();
		 */
		addInteraction: function(proteinId1,proteinId2,extraAtributes) {
			var self=this;

			// Getting the protein with the first id and checking exists in the graphic
			var protein1= self.getProtein(proteinId1);
			if (typeof protein1=="undefined")return false;
			
			// Getting the protein with the second id and checking exists in the graphic
			var protein2= self.getProtein(proteinId2);
			if (typeof protein2=="undefined")return false;
			
			//Checking there is not an interaction between those proteins already in the graphic
			if (typeof self.interactionsA[proteinId1]!="undefined" && self.interactionsA[proteinId1].indexOf(protein2)!=-1)
				return self.interactionsA[proteinId1].indexOf(protein2);
				
			//creating and adding an interaction
			var interaction = {source:protein1,target:protein2,id:protein1.id+"_"+protein2.id};
			//adding any parameters from the object extraAtributes to the interaction object
			if (typeof extraAtributes!="undefined")
				for (var key in extraAtributes)
					interaction[key]=extraAtributes[key];

			var n= self.interactions.push(interaction);
			
			//Saving the interaction in the associative array
			if (typeof self.interactionsA[interaction.source.id] == "undefined")
				self.interactionsA[interaction.source.id]=[interaction.target];
			else
				self.interactionsA[interaction.source.id].push(interaction.target);
			if (typeof self.interactionsA[interaction.target.id] == "undefined")
				self.interactionsA[interaction.target.id]=[interaction.source];
			else
				self.interactionsA[interaction.target.id].push(interaction.source);

			return n;
		},
		/**
		 * Adds a protein to the graphic
		 * 
		 * @param {Object} protein An object containing information of the protein 
		 *
		 * @example 
		 *  instance.addProtein({ "id":"new","name":"new","showLegend":true,"typeLegend":"id","organism":"human"+pid%3,"features":{"f1":"val1","f2":"val2","f3":"val3"}});
		 * instance.restart();
		 */
		addProtein: function(protein) {
			var self=this;
			var n = self.proteins.indexOf(self.proteinsA[protein.id]);
			if (n!=-1)
				return n;

			n= self.proteins.push(protein) -1;
			protein.index=n;
			self.proteinsA[protein.id]=protein;
			if (typeof self.interactionsA[protein.id] == "undefined")
				self.interactionsA[protein.id]=[];
			return n;
		},
		/**
		 * Gets the protein object by its id
		 * 
		 * @param {string} proteinId The id of the protein
		 *  
		 * @return {Object} protein An object containing information of the protein 
		 *
		 * @example 
		 * alert(instance.getProtein('3'));
		 */
		getProtein: function(proteinId) {
			var self=this;
			return self.proteinsA[proteinId];
		},
		/**
		 * Gets the array index of the interaction object by the ids of the interactors
		 * 
		 * @param {string} proteinId1 The id of the first protein interacting
		 * @param {string} proteinId2 The id of the second protein interacting
		 *  
		 * @return {Integer} An int value indicating the index of the interaction in the array this.interactions 
		 *
		 * @example 
		 * alert(instance.getInteractionIndex('3','5'));
		 */
		getInteractionIndex: function(proteinId1,proteinId2){
			var self =this;
			for (var i=0; i<self.interactions.length; i++){
				var sourceId=self.interactions[i].source.id;
				var targetId=self.interactions[i].target.id;
				if ((sourceId==proteinId1 && targetId==proteinId2)||(sourceId==proteinId2 && targetId==proteinId1))
					return i;
			}
			return null;
		},
		/**
		 * gets the interaction object by the id of its proteins
		 * 
		 * @param {string} proteinId1 The id of the first protein
		 * @param {string} proteinId2 The id of the second protein
		 *  
		 * @return {Object} An object containing information of the interaction 
		 *
		 * @example 
		 * alert(instance.getInteraction('1','3'));
		 */
		getInteraction: function(proteinId1,proteinId2){
			var self =this;
			var pos =self.getInteractionIndex(proteinId1,proteinId2);
			return (pos==null)?null:self.interactions[pos];
		},
		/**
		 * Removes from the graphic the interaction by the id of its proteins
		 * 
		 * @param {string} proteinId1 The id of the first protein
		 * @param {string} proteinId2 The id of the second protein
		 *  
		 * @example 
		 * instance.removeInteraction('2','3');
		 */
		removeInteraction: function(proteinId1,proteinId2){
			var self = this;
			var intIndex = self.getInteractionIndex(proteinId1,proteinId2);
			self.interactions.splice(intIndex--, 1);
			
			var p1=self.getProtein(proteinId1),
				p2=self.getProtein(proteinId2);
			
			intIndex = self.interactionsA[proteinId1].indexOf(p2);
			if (intIndex!=-1) self.interactionsA[proteinId1].splice(intIndex--, 1);

			intIndex = self.interactionsA[proteinId2].indexOf(p1);
			if (intIndex!=-1) self.interactionsA[proteinId2].splice(intIndex--, 1);
		},
		/**
		 * removes a protein from the graphic with all the interactions unless the interactor 
		 * is also interacting with another protein that is visible. 
		 * 
		 * @param {string} proteinId The id of the protein to delete
		 *  
		 * @example 
		 * instance.removeProtein('2');
		 */
		removeProtein: function(proteinId, excludelist){
			var self=this;
			excludelist = (typeof excludelist == "undefined")?[]:excludelist;

			if (typeof self.interactionsA[proteinId] != "undefined"){
				for (var i=0;i<self.interactionsA[proteinId].length;i++){
					var targetid=self.interactionsA[proteinId][i].id;
					if (excludelist.indexOf(targetid) == -1){
						self.removeInteraction(proteinId,targetid);
						i--;
						if (self.interactionsA[targetid].length==0)
							self.removeProtein(targetid);
					}
				}
				if (self.interactionsA[proteinId].length==0){
					delete self.interactionsA[proteinId];
					for(var i=0; i<self.proteins.length; i++) {
						if(self.proteins[i].id == proteinId) {
							self.proteins.splice(i, 1);
							self._reduceInteractionIndexes(i);
							break;
						}
					}
					delete self.proteinsA[proteinId];
				}else{
					self.proteinsA[proteinId].fixed=false;
				}
			}
		},
		_reduceInteractionIndexes:function(from){
			var self=this;
			
			for (var i=0; i<self.interactions.length; i++){
				if (self.interactions[i].source.index>from)
					self.interactions[i].source.index--;
				if (self.interactions[i].target.index>from)
					self.interactions[i].target.index--;
			}
			
		},
		/**
		 * 
		 * Resets the graphic to zero proteins - zero interactions
		 * 
		 * @example 
		 * instance.resetGraphic();
		 */
		resetGraphic: function(){
			var self=this;
			self.proteins=[];
			self.proteinsA={};
			self.interactions=[];
			self.restart();
		},
		selectAdded:false,
		_addSelect: function(){
			var self=this;
			var select ="<select id=\""+self.opt.target+"_sort\" style='display:none;' class='sort-select'>";
			select += "<option value='default'>default</option>";
			if (self.proteins.length>0){
				for (var f in self.proteins[0].features){
					select += "<option value='"+f+"'>"+f+"</option>";
				}
			}
			select += "</select>";
		    $("#"+self.opt.target).before("<label for=\""+self.opt.target+"_sort\"  style='display:none;'>Sort By:</label>"+select);
			self.selectAdded=true;
		},
		/**
		 * Restart the graphic to materialize the changes done on it(e.g. add/remove proteins)
		 * It is here where the SVG elemnts are created.
		 * 
		 * @example 
		 * instance.restart();
		 */
		restart: function(){
			var self = this;

			var width  = self.opt.width,
				height = self.opt.height,
				margin = self.opt.margin;
			
			self.matrix = [];
			self.nodes=self.proteins;
			self.links=self.interactions;
			
			var n = self.nodes.length;

			// Compute index per node.
			self.nodes.forEach(function(node, i) {
			    node.index = i;
			    node.count = 0;
			    self.matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0,i:-1}; });
			});

			// Convert links to matrix; count character occurrences.
			self.links.forEach(function(link,i) {
				self.matrix[link.source.index][link.target.index].z += link.score*1;
				self.matrix[link.target.index][link.source.index].z += link.score*1;
				self.matrix[link.source.index][link.source.index].z += link.score*1;
				self.matrix[link.target.index][link.target.index].z += link.score*1;
				self.nodes[link.source.index].count += link.score*1;
				self.nodes[link.target.index].count += link.score*1;
				self.matrix[link.source.index][link.target.index].i = i;
				self.matrix[link.target.index][link.source.index].i = i;
				self.matrix[link.source.index][link.source.index].i = i;
				self.matrix[link.target.index][link.target.index].i = i;
			});

			// Precompute the orders.
			self.orders = {};
			self.orders["default"]=d3.range(n);
			if (self.proteins.length>0){
				if (!self.selectAdded) self._addSelect();
				
				for (var f in self.proteins[0].features){
					self.orders[f] = d3.range(n).sort(function(a, b) { 
						if (!isNaN(self.nodes[a].features[f]) && !isNaN(self.nodes[b].features[f]))
							return self.nodes[b].features[f] - self.nodes[a].features[f] ;
						return d3.ascending(self.nodes[a].features[f],self.nodes[b].features[f]); 
					});
				}
			  d3.select("#"+self.opt.target+"_sort").on("change", function() {
				    order(self.orders[this.value]);
			  });
			}
//					name: d3.range(n).sort(function(a, b) { return d3.ascending(self.nodes[a].name, self.nodes[b].name); }),
//					count: d3.range(n).sort(function(a, b) { return self.nodes[b].count - self.nodes[a].count; }),
//					group: d3.range(n).sort(function(a, b) { return self.nodes[b].group - self.nodes[a].group; })
//			};

			// The default sort order.
			self.x.domain(d3.range(n));
		    var t = self.svg.transition().duration(2500);

			self.bg= self.svg.selectAll(".background").
				data([1])
				.enter().append("rect")
				.attr("class", "background")
				.attr("width", self.side)
				.attr("height", self.side);

			var row = self.svg.selectAll(".row")
				.data(self.matrix);
			var row_g=row.enter().append("g")
					.attr("class", "row");
			row_g.attr("transform", function(d, i) { return "translate(0,0)"; }).transition()
					.attr("transform", function(d, i) { return "translate(0," + self.x(i) + ")"; });
			
			row.each(processRow);
			row.exit().remove();
			
			row.selectAll(".transversal")
				.data([1])
				.enter().append("line")
				.attr("class", "transversal")
				.attr("x2", self.side);
			row.selectAll(".transversal")
				.attr("y1", self.x.rangeBand()/2)
				.attr("y2", self.x.rangeBand()/2);

			row_g.append("text")
				.attr("id", function(d,i){ 
					return "label_right_"+self.nodes[i].id;
				})
				.attr("class", "legend")
				.attr("x", -6)
				.attr("dy", ".32em")
				.attr("text-anchor", "end")
				.attr("transform", "translate(" + (self.side + margin.left)+",0)")
				.on("click", function(d,i){ 
					self.raiseEvent('proteinClick', {
						protein: self.nodes[i],
						side:"right"
					});
				})
				.on("mouseover", function(d,i){ 
					self.raiseEvent('proteinMouseOver', {
						protein: self.nodes[i],
						side:"right"
					});
				})
				.on("mouseout",  function(d,i){ 
					self.raiseEvent('proteinMouseOut', {
						protein: self.nodes[i],
						side:"right"
					});
				});
			
			self.svg.selectAll(".row text")
				.attr("y", self.x.rangeBand() / 2)
				.text(function(d, i) { 
					return (self.nodes[i].typeLegend=="id")?self.nodes[i][self.nodes[i].typeLegend]:self.nodes[i].features[self.nodes[i].typeLegend]; 
				});

			var column_p = self.svg.selectAll(".column")
				.data(self.matrix);
			var column = column_p.enter().append("g")
					.attr("class", "column")
					.attr("transform", function(d, i) { return "translate(" + self.x(i) + ")rotate(-90)"; });
			column_p.exit().remove();
			column.selectAll(".transversal")
				.data([1])
				.enter().append("line")
				.attr("class", "transversal")
				.attr("x2", -self.side);
			self.svg.selectAll(".column .transversal")
				.attr("y1", self.x.rangeBand()/2)
				.attr("y2", self.x.rangeBand()/2);
			

			column.append("text")
				.attr("id", function(d,i){ 
					return "label_left_"+self.nodes[i].id;
				})
				.attr("x", 6)
				.attr("dy", ".32em")
				.attr("class", "legend")
				.attr("text-anchor", "start")
				.on("click", function(d,i){ 
					self.raiseEvent('proteinClick', {
						protein: self.nodes[i],
						side:"left"
					});
				})
				.on("mouseover", function(d,i){ 
					self.raiseEvent('proteinMouseOver', {
						protein: self.nodes[i],
						side:"left"
					});
				})
				.on("mouseout",  function(d,i){ 
					self.raiseEvent('proteinMouseOut', {
						protein: self.nodes[i],
						side:"left"
					});
				});
			self.svg.selectAll(".column text")
				.attr("transform", function(d, i) { 
					return "rotate(180,"+margin.top/2+","+self.x.rangeBand()/2+")"; 
				}) 
				.attr("y", self.x.rangeBand() / 2)
				.text(function(d, i) { 
					return (self.nodes[i].typeLegend=="id")?self.nodes[i][self.nodes[i].typeLegend]:self.nodes[i].features[self.nodes[i].typeLegend]; 
				});
			
			self.perspective.selectAll(".legendBlock, .legendZoomBlock").remove();
			if (typeof self.legends!="undefined" && self.legends!=null)
				self._paintLegends();
			
//			self._paintZoomLegend();
			
			self._adjustInfoFrame("left");
			self._adjustInfoFrame("right");



			function processRow(row) {
				var cell = d3.select(this).selectAll(".cell")
					.data(row.filter(function(d) { 
						return (d.x!=d.y)?d.z:0; 
					}));
				cell.enter().insert("rect", ".transversal")
					.on("mouseover", function(p){
						self.raiseEvent('interactionMouseOver', {
							interaction: self.getInteraction(self.nodes[p.x].id, self.nodes[p.y].id)
						});
					})
					.on("mouseout",  function(d){ 
						self.raiseEvent('interactionMouseOut', {
							interaction: self.getInteraction(self.nodes[d.x].id, self.nodes[d.y].id)
						});
					})
					.on("click", function(d){ 
						self.raiseEvent('interactionClick', {
							interaction: self.getInteraction(self.nodes[d.x].id, self.nodes[d.y].id)
						});
					})
					.attr("class", "cell")
					.attr("id", function(p){
						return "cell_"+self.getInteraction(self.nodes[p.x].id, self.nodes[p.y].id).id;
					});
				cell.exit().remove();
				cell
					.attr("width", function(d) { return self.x.rangeBand();})
					.attr("height", function(d) { return self.x.rangeBand();});
//					.style("fill", function(d) { return self.nodes[d.x].group == self.nodes[d.y].group ? self.c(self.nodes[d.x].group) : null; });
				cell.transition().attr("x", function(d) { return self.x(d.x); });
			}



		  function order(value) {
		    self.x.domain(value);

		    var t = self.svg.transition().duration(2500);

		    t.selectAll(".row")
		        .attr("transform", function(d, i) { return "translate(0," + self.x(i) + ")"; })
		      .selectAll(".cell")
		        .delay(function(d) { return self.x(d.x) * 4; })
		        .attr("x", function(d) { return self.x(d.x); });

		    t.selectAll(".column")
		        .attr("transform", function(d, i) { return "translate(" + self.x(i) + ")rotate(-90)"; });
		  }

		  if (d3.select("#"+self.opt.target+"_sort").node()!=null)
			  order(self.orders[d3.select("#"+self.opt.target+"_sort").node().value]);
		},
		updateInfoFrame: function(protein,side){
			var self = this;
			var title = (protein==null)?"":protein.id;
			d3.selectAll("."+side+"_title").text(title);
			var keys = (protein==null)?[]:Object.keys(protein.features);
			d3.selectAll(".info_frame")
				.style("fill",  (protein==null)?"rgba(30,60,200,0.01)":"rgba(30,60,200,0.1)");


			keys.sort();
			d3.selectAll("."+side+"_content").text("");
			for (var i=0;i<keys.length;i++){
				d3.selectAll("."+side+"_content").append("tspan")
					.attr("dy",18)
					.text(keys[i]+": "+protein.features[keys[i]]);
			}
			self._adjustInfoFrame(side);
		},
		_adjustInfoFrame: function(side){
			var self =this;
			var width  = self.opt.width,
				height = self.opt.height,
				margin = self.opt.margin;
			var x1=1,
				y1=10,
				xA=1,yA=1,xB=1,yB=1;
			
			if (side=="left"){
				x1=10;
				xA=width/2-self.h/2-self.htop;
				yA=height;
				xB=width/2;
				yB=height-self.h/2-self.htop;
			}else{
				x1=width-10;
				xA=width/2;
				yA=height-self.h/2-self.htop;
				xB=width/2+self.h/2+self.htop;
				yB=height;
			}
			var m=(yA-yB)/(xA-xB);
			var b=yA-m*xA;
			var x=(m*x1+y1-b)/(2*m); //maximizing the area of a square from x1,y1 to a point in the line y=m*x+b, by the first derivate equals to zerro

			//the frame should never go over half the graphic space
			if (side=="left" && x>xB-x1) x=xB-x1;
			if (side=="right" && x<xA+10) x=xA+10;

			var y=m*x+b;
			if (side=="left") self.info.selectAll(".left_frame")
				.attr("width", x-x1)
				.attr("height", y-y1)
		    	.attr("transform", "translate("+x1+","+y1+")");
			if (side=="right") self.info.selectAll(".right_frame")
				.attr("width", x1-x)
				.attr("height", y-y1)
		    	.attr("transform", "translate("+x+","+y1+")");
			
			self.info.selectAll("."+side+"_title")
				.attr("y",y1*4)
				.attr("x",function(d,i){ 
					return (x+x1)/2-this.getComputedTextLength()/2;
				});
			self.info.selectAll("#clip_"+side+" rect")
				.attr("x",function(){ return (side=="left")?y1*2:x+y1*1;})
				.attr("width",function(){ return (side=="left")?x-3*y1:x1-x-3*y1;})
				.attr("height",y-3*y1);

			self.info.selectAll("."+side+"_content")
				.attr("y",y1*6)
				.attr("clip-path","url(#clip_"+side+")")
				.attr("x",function(){ return (side=="left")?y1*3:x+y1*2;});
			self.info.selectAll("."+side+"_content tspan")
				.attr("x",function(){ return (side=="left")?y1*3:x+y1*2;});
		},
		activateProteins:function(proteins){
			var indexes=[];
			for (var i=0;i<proteins.length;i++)
				indexes.push(proteins[i].index);
			d3.selectAll(".row text.legend").classed("active", function(d, i) { return indexes.indexOf(i)!=-1; });
			d3.selectAll(".column text.legend").classed("active", function(d, i) { return indexes.indexOf(i)!=-1;  });
			d3.selectAll(".row line.transversal").classed("active", function(d, i) { return indexes.indexOf(i)!=-1; });
			d3.selectAll(".column line.transversal").classed("active", function(d, i) { return indexes.indexOf(i)!=-1; });
		},
		deactivateProteins:function(){
			d3.selectAll("text").classed("active", false);
			d3.selectAll("line").classed("active", false);
		},
		
		_sortLegends:function(){
			var self = this;
			self.legends.sort(function(a,b){
				if (a[1]==b[1]){
					if (a[0]=="label") return -1;
					if (b[0]=="label") return 1;
				}else if (a[1]>b[1]){
					return -1;
				}else
					return 1;
				return a[0]-b[0];
			});
		},
		_paintLegend:function(legend,type,w){
			var self = this;
			legend.filter(function(d) { return d[0]== "label" && d[1]==type; }).append("text")
				.attr("x", self.opt.width/2 +w/2- 6)
				.attr("y", 7)
				.attr("dy", ".35em")
				.style("text-anchor", "end")
				.style("font-size", "1.2em")
				.text(type+":");
			if (type.indexOf("Resize By")==0){

				legend.filter(function(d) { return d[0]!="label" && d[1]==type; }).append("path")
					.attr("class", "figure")
					.attr("d", function(d) {
							var h=2*self.opt.radius*Math.sqrt(d[0][2]);
							return "M0,0L0,10M0,5L"+h+",5M"+h+",0L"+h+",10 ";
					})
					.attr("transform", function(d) { 
						return "translate(" +  (self.opt.width/2+w/2 - 18 - 2*self.opt.radius*Math.sqrt(d[0][2])) + "," +  0 + ")"; 
					})
					.style("fill", "transparent")
					.style("stroke", "black");
				legend.filter(function(d) { return d[0]!="label" && d[1]== type; }).append("text")
					.attr("x", function(d) { 
						return (self.opt.width/2+w/2 - 22 - 5*self.opt.radius); 
					})
					.attr("y", 7)
					.attr("dy", ".35em")
					.style("text-anchor", "end")
					.text(function(d) { return (d[0][1]*1.0).toFixed(2); });
				
			}else{
				legend.filter(function(d) { return d[0]!="label" && d[1]==type; }).append("rect")
					.attr("x", self.opt.width/2 +w/2- 18) 
					.attr("width", 13)
					.attr("height", 13)
					.style("fill", function(d,i) {
						if (typeof d[2]== "undefined")
							return self.colors[i];
						return d[2];
					});
				legend.filter(function(d) { return d[0]!="label" && d[1]== type; }).append("text")
					.attr("x", self.opt.width/2+w/2 - 24)
					.attr("y", 7)
					.attr("dy", ".35em")
					.style("text-anchor", "end")
					.text(function(d) { return d[0]; });
			}
		},
		_paintLegends: function(){
			var self = this;
			var w=18 + self.longestLegend*7 + 10;
			var legendBlock = self.perspective.insert("g",".link")
				.attr("class", "legendBlock");
			self._sortLegends();
			legendBlock.append("rect")
				.attr("class", "bg")
				.attr("x", self.opt.width/2 -w/2)
				.attr("height", 6 + self.legends.length *16)
				.attr("width", w)
				.style("fill", "#eee")
				.style("stroke", "#000");

			var button =legendBlock.append("g")
		      .attr("class", "button");
			button.visible=true;
			
			button.append("circle")
				.attr("r", 3)
				.attr("cx",self.opt.width/2 -w/2+6)
				.attr('cy', 6)
				.on("click",function(){
					button.visible= !button.visible;
					button.selectAll("circle").style("fill",function(){ 
						return (button.visible)?"#0f0":"#f00";
					});
					legendBlock.selectAll("rect.bg").transition()
						.attr("height", (button.visible)?6 + self.legends.length *16:10);
					legendBlock.selectAll(".mainLegend")
						.style("display", (button.visible)?"block":"none");
				});
			
//			button.append("path")
//				.attr("d","m 50,15 140,0 c 11.08,0 22.51667,10.914 20,20 C 208.16563,41.622482 201.08,40 190,40 L 50,40 C 38.92,40 31.834332,41.622512 30,35 27.483323,25.914 38.92,15 50,15 z");
//			button.attr("transform","scale(0.3)");

			var legend = legendBlock.selectAll(".mainLegend") 
				.data(self.legends)
				.enter().insert("g")
				.attr("class", "mainLegend")
				.attr("transform", function(d, i) { 
					return "translate(0," + (3 + i * 16) + ")"; 
				});
			for (var i=0; i< self.legendTypes.length; i++)
				self._paintLegend(legend,self.legendTypes[i],w);

		},
		longestLegend:4,
		legendTypes:[],
		/**
		 * Adds a legend to the graphic
		 * 
		 * @example 						
		 * instance.addLegends(["Legend red"],"Color","#FF0000");
		 * instance.restart();
		 */
		addLegends:function(legends,type,color){
			var self = this;
			if (self.legends==null) self.legends=[],self.legendTypes=[];
			
			if (legends==null) {
				self.legends = null;
				self.legendTypes=[];
				self.longestLegend=4;
				return;
			}
			if (type=="Resize By") 
				type = type+ " "+legends[0];
			if (self.legendTypes.indexOf(type)==-1) {
				self.legends.push(["label",type]);
				self.legendTypes.push(type);
				if (type.length>self.longestLegend)
					self.longestLegend=type.length;
			}
			
			if (type.indexOf("Resize By")==0){ //is a size label
				self.legends.push([legends,type]);
			} else //is a color label
				for (var i=0;i<legends.length;i++){
					if (typeof color=="undefined"){
						if (typeof getDistinctColors != "undefined")
							self.legends.push([legends[i],type,getDistinctColors(legends.length)[i]]);
						else
							self.legends.push([legends[i],type]);
					}else
						self.legends.push([legends[i],type,color]);
					
					if (legends[i].length>self.longestLegend)
						self.longestLegend=legends[i].length;
				}
		},
		_paintZoomLegend: function(){
			var self = this;
			var w=70;
			var legendBlock = self.perspective.insert("g",".link")
				.attr("class", "legendZoomBlock");
			legendBlock.append("rect")
				.attr("x", 0)
				.attr("height", 22)
				.attr("width", w)
				.style("fill", "#fff")
				.style("fill-opacity","0.0");

			

			self.zoomLegend = legendBlock.selectAll(".mainLegend") 
				.data(["1.00 :",self.tScale])
				.enter().insert("g")
				.attr("class", "mainLegend")
				.attr("transform", function(d,i){
					return "translate("+i*30+",15)";
				}) 
				.append("text");
			self._refreshZoomLegend();
					
//			for (var i=0; i< self.legendTypes.length; i++)
//				self._paintLegend(legend,self.legendTypes[i]);

		},
		_refreshZoomLegend: function(){
			var self = this;
			self.zoomLegend.text(function(d,i) { 
				return (i==0)?d:(self.tScale*1.0).toFixed(2); 
			}).attr("font-size", function(d,i){
				return (i==0)?"1em":((self.tScale*1<1)?"0.8em":"1.5em");
			});		},
		/**
		 * Hides the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 *  
		 * @example 
		 * instance.hide("[id = node_10]");
		 */
		hide: function(selector){
			var self=this;
			self.svg.selectAll(selector).attr("visibility", 'hidden');
			self.svg.selectAll(selector).selectAll(" .legend").attr("visibility", 'hidden');
		},
		/**
		 * Shows the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 *  
		 * @example 
		 * instance.show("[id = node_10]");
		 */
		show: function(selector){
			var self=this;
			self.svg.selectAll(selector).attr("visibility", 'visible');
			self.svg.selectAll(selector).selectAll(" .legend").attr("visibility",function(d) { return (d.showLegend)?"visible":"hidden";});
		},
		/**
		 * Highlight the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 *  
		 * @example 
		 * instance.highlight("[id *= node_1]");
		 */
		highlight: function(selector,on){
			var self=this;
			on = (typeof on =="undefined")?true:on;
			self.svg.selectAll(selector).classed("highlight",on);
		},
		/**
		 * Set the fill's color of the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 * @param {string} color a color in web format eg. #FF0000
		 *  
		 * @example 
		 * instance.setFillColor(".figure","#FF0000");
		 */
		setFillColor: function(selector,color){
			var self=this;
			self.svg.selectAll(selector).style("fill", color);
		},
		/**
		 * Set the stroke's color of the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 * @param {string} color a color in web format eg. #FF0000
		 *  
		 * @example 
		 * instance.setColor("[id *= node_2]","#FF0000");
		 */
		setColor: function(selector,color){
			var self=this;
			self.svg.selectAll(selector).style("stroke", color);
		},
		/**
		 * Set the opacity of the elements on the graphic that match the selector. 
		 * Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string 
		 * 
		 * @param {string} selector a string to represent a set of elements. Check the <a href="http://www.w3.org/TR/css3-selectors/">CSS3 selectors documentation</a> to build a selector string
		 * @param {string} opacity value between 0 (transparent) and 1 (fully vissible)
		 *  
		 * @example 
		 * instance.setOpacity("[id *= node_2]",0.3);
		 */
		setOpacity: function(selector,level){
			var self=this;
			self.svg.selectAll(selector).style("opacity", level);
		},

		/**
		 * Shows the legend(id) of the protein
		 * 
		 * @param {string} protein the id of the protein to swap the visibility of the legend
		 *  
		 * @example 
		 * instance.swapShowLegend("#node_5 .legend");
		 */
		showLegend: function(selector,typeLegend){
			var self=this;
			self.svg.selectAll(selector).attr("visibility", "visible").text(function(d,i) {
				var protein = self.getProtein(this.id.substring(this.id.lastIndexOf("_")+1));
				protein.typeLegend=typeLegend;
				if (typeLegend=="id") 
					return protein.id;
				else
					return protein.features[typeLegend];
				});
		}, 
		
		setLabelFontSize: function(selector,fontSize){
			var self=this;
			self.svg.selectAll(selector).selectAll(".legend").style("font-size", fontSize+"px");
		}, 
		/**
		 * Scales the area of a protein
		 * 
		 * @param {string} protein the id of the protein to scale
		 * @param {integer} scale value to scale a node
		 *  
		 * @example 
		 * instance.setSizeScale("#figure_1",4);
		 */
		setSizeScale: function(selector,scale){
			var self=this;
			self.svg.selectAll(selector).style("font-size", scale+"em");
		}, 
		/**
		 * Scales the size of the proteins which value has been modify by other means
		 * 
		 * @param {string} selector a CSS3 selector to choose the nodes to resize
		 *  
		 * @example 
		 * var j=0;
		 * for (var i in instance.proteins)
		 * 	instance.proteins[i].size=1+(j++)%4;
		 * instance.refreshSizeScale(".figure");
		 */
		refreshSizeScale: function(selector){
			var self=this;
			self.svg.selectAll(selector).style("font-size", function(d,i) {
				var size=(typeof self.nodes[i].size=="undefined")?1:self.nodes[i].size;
				
				return size+"em"; 
			});
		}, 
		refreshOpacity: function(selector){
			var self=this;
			self.svg.selectAll(selector).style("opacity", function(d,i) {
				if (selector.indexOf("cell")!=-1){
					var interaction = self.getInteraction(self.nodes[d.x].id, self.nodes[d.y].id);
					return (typeof interaction.alpha=="undefined")?1:interaction.alpha;
				}
				var protein = self.getProtein(this.id.substring(this.id.lastIndexOf("_")+1));
				return (typeof protein.alpha=="undefined")?1:protein.alpha;
			});
		}, 

		/**
		 * Hide the legend(id) of the protein
		 * 
		 * @param {string} selector a CSS3 selector to choose the nodes to hide its legend
		 *  
		 * @example 
		 * instance.hideLegend("#node_5 .legend");
		 */
		hideLegend: function(selector){
			var self=this;
			self.svg.selectAll(selector).selectAll(".legend").attr("visibility", "hidden");
		},
		/**
		 * Is the legend of the protein visible
		 * 
		 * @param {string} selector a CSS3 selector to choose the  legend
		 *  
		 * @example 
		 * alert(instance.isLegendVisible("#node_5 .legend"));
		 */
		isLegendVisible: function(selector){
			var self=this;
			return (self.svg.selectAll(selector).selectAll(".legend").attr("visibility")=="visible");
		},
		/**
		 * Shows/Hide the legend(id) of the protein
		 * 
		 * @param {string} protein the id of the protein to swap the visibility of the legend
		 *  
		 * @example 
		 * instance.swapShowLegend("#node_5 .legend");
		 */
		swapShowLegend: function(selector){
			var self=this;
			self.svg.selectAll(selector).attr("visibility", function(d) {
				return (typeof this.visibility=="undefined" || this.visibility=="visible" )?"hidden":"visible";
			});
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




