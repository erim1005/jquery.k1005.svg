(function($){
	var SVG_NS = 'http://www.w3.org/2000/svg';
	var XLINK_NS = 'http://www.w3.org/1999/xlink';
	var XML_EVENT_NS = 'http://www.w3.org/2001/xml-events';

	var getNumberUnit = function(n) {
		var unit = 1;
		
		if (n < 1) {
			while(n < 1) {
				unit *= 0.1;
				n = n * 10;
			}
		}
		else {
			while(n >= 10) {
				unit *= 10;
				n = n / 10;
			}
		}
		
		return unit;
	};
	
	$.svg = $.svg || function(){};
	$.svg.create = function(tag, attrs) {
		var element = document.createElementNS(SVG_NS, tag);
		return $(element).svgAttr(attrs);
	};
	
	$.fn.svgAttr = function(attrs) {
		return this.each(function(){
			if (attrs) {
				for (var key in attrs) {
					var ns = key.split(':')[0];
					
					if (ns == 'xlink') {
						this.setAttributeNS(XLINK_NS, key, attrs[key]);
					}
					else if (ns == 'ev') {
						this.setAttributeNS(XML_EVENT_NS, key, attrs[key]);
					}
					else {
						this.setAttributeNS(null, key, attrs[key]);
					}
				}
			}
		});
	}
	
	$.ViewBox = function(){
		this.x = 0;
		this.y = 0;
		this.w = 50;
		this.h = 50;
		
		this.set = function() {
			if (arguments.length == 1) {
				var value = arguments[0];
				
				if (typeof(arguments[0]) == 'string') {
					var arr = value.split(/[\s]+/);
					this.x = parseFloat(arr[0]);
					this.y = parseFloat(arr[1]);
					this.w = parseFloat(arr[2]);
					this.h = parseFloat(arr[3]);
				}
				else if (typeof(arguments[0]) == 'object') {
					this.x = parseFloat(value.x);
					this.y = parseFloat(value.y);
					this.w = parseFloat(value.w);
					this.h = parseFloat(value.h);
				}
			}
			else if (arguments.length > 3) {
				this.x = parseFloat(arguments[0]);
				this.y = parseFloat(arguments[1]);
				this.w = parseFloat(arguments[2]);
				this.h = parseFloat(arguments[3]);
			}
			
			return this;
		};
		this.toString = function() {
			return this.x + ' ' + this.y + ' ' + this.w + ' ' + this.h;
		};
	};
	
	$.fn.viewBox = function(viewBox) {
		if (viewBox) {
			return this.each(function(){
				var value = null;
				if (viewBox instanceof $.ViewBox) {
					value = viewBox.toString();
				}
				else {
					value = viewBox;
				}
				
				this.setAttribute('viewBox', value);
			});
		}
		else {
			viewBox = new $.ViewBox();
			return viewBox.set(this[0].getAttribute('viewBox'));
		}
	};
	
	$.fn.svgZoom = function(callback) {
		return this.each(function(){
			var self = $(this);
			var canvas = $(this);
			var viewBox = canvas.viewBox();
			canvas.data('svg-zoom', 100);
			canvas.wheel(function(evt) {
				/*up:1, down:-1*/
				var delta = evt.delta;
				var currentViewBox = canvas.viewBox();
				var zoom = canvas.data('svg-zoom');
				
				if (delta == 1) {
					zoom += getNumberUnit(zoom / 10);
				}
				else if (delta == -1) {
					zoom -= getNumberUnit((zoom / 10) - 1);
					if (zoom <= 1) {
						return;
					}
				}
				
				zoom = Math.round(zoom);
				canvas.data('svg-zoom', zoom);
				currentViewBox.w = viewBox.w / (zoom * 0.01);
				currentViewBox.h = viewBox.h / (zoom * 0.01);
				canvas.viewBox(currentViewBox);
				
				if (callback) {
					callback.call(self, evt);
				}
			}).keydown(function(evt){
				console.log(evt);
			});
		});
	};
	
	$.fn.grid = function() {
		var toStep = function(w) {
			var max = 10;
			while (w > max) {
				if (w < max * 2) {
					max = max * 2;
				}
				else if (w < max * 5) {
					max = max * 5;
				}
				else {
					max = max * 10
				}
			}
			
			return max / 20;
		}
		
		return this.each(function(){
			var self = this;
			var container = $(self).find('.gridLineContainer');
			
			if (container.length == 0) {
				container = $.svg.create("g", {
					"stroke": 'gray',
					"class": 'gridLineContainer'
				}).prependTo(this);
			}
			else {
				container.children().remove();
			}

			var viewBox = $(this).viewBox();
			var step = toStep(viewBox.w);
			
			$(this).data('grid-step', step);
			
			var standardX = Math.round(viewBox.x / step) * step;
			var standardY = Math.round(viewBox.y / step) * step;
			var standardW = Math.round(viewBox.w / step) * step;
			var standardH = Math.round(viewBox.h / step) * step;

			var x1 = standardX - standardW;
			var x2 = standardX + (standardW * 2);
			var y1 = standardY - standardH;
			var y2 = standardY + (standardH * 2);
			var fontSize = (step / 5) + "px";
			var strokeWidth = step / 200;
			
			var groupVirtical = $.svg.create('g', {
				"class": 'grid-virtical',
				"style": 'fill:gray; font-size:' + fontSize
			}).appendTo(container);
			
			for (var i = x1; i < x2; i+= step) {
				var lineElement = $.svg.create('line', {
					"x1": i,
					"x2": i,
					"y1": y1,
					"y2": y2,
					"class": 'grid-line',
					"stroke-width": strokeWidth
				}).appendTo(groupVirtical);
				
				if (i % standardX == 0) {
					lineElement.attr("stroke-color", 'blue');
				}

				var text = null;
				if (Math.abs(x1) > 100000) {
					text = (i / 100000) + 'km';
				}
				else if (Math.abs(x1) > 100) {
					text = (i / 100) + 'm';
				}
				else {
					i + 'cm'
				}
				
				$.svg.create('text', {
					"text-anchor": 'start',
					"x": i + (step / 10),
					"y": (viewBox.y + 10),
					"transform": 'rotate(60 ' + i + ',' + (viewBox.y + 10) + ')',
					"class": 'grid-text'
				}).text(text).appendTo(groupVirtical);
			}
			
			var groupHorizontal = $.svg.create('g').appendTo(container);
			for (var i = y1; i < y2; i+= step) {
				$.svg.create('line', {
					"y1": i,
					"y2": i,
					"x1": x1,
					"x2": x2,
					"class": 'grid-line',
					style: "stroke-width:" + strokeWidth
				}).appendTo(groupHorizontal);

				var text = null;
				if (Math.abs(y1) > 100000) {
					text = (i / 100000) + 'km';
				}
				else if (Math.abs(y1) > 100) {
					text = (i / 100) + 'm';
				}
				else {
					i + 'cm'
				}
				
				$.svg.create('text', {
					"text-anchor": 'start',
					"x": viewBox.x + (step / 10),
					"y": i,
					"class": 'grid-text',
					"style": 'fill:gray; font-size:' + fontSize
				}).text(text).appendTo(groupHorizontal);
			}
		});
	};
	
	$.fn.svgDraggable = function(callback) {
		
		return this.each(function(){
			var self = $(this);
			var svg = (this.tagName == 'svg') ? self : self.parents('svg');
			var viewBox = null;
			var startPoint = null;
			
			var moveElement = function(e) {
				var self = this;
				var tagName = this.tagName;
				var currentPoint = [e.clientX, e.clientY];

				var tempViewBox = new $.ViewBox();
				tempViewBox.set(
						viewBox.x + ((startPoint[0] - currentPoint[0]) * (viewBox.w / svg.width())),
						viewBox.y + ((startPoint[1] - currentPoint[1]) * (viewBox.w / svg.width())),
						viewBox.w,
						viewBox.h
				);
				svg.viewBox(tempViewBox);
				
				if (callback) {
					callback.call(self, e);
				}
			};
			var selectElement = function(e) {
				startPoint = [e.clientX, e.clientY];
				viewBox = svg.viewBox();
				svg.bind('mousemove', moveElement);
			};
			self.mousedown(selectElement);
			
			var deselectElement = function(e) {
				svg.unbind('mousemove', moveElement);

				if (callback) {
					callback.call(self, e);
				}
			};
			svg.mouseup(deselectElement);
			
		});
	};
})(jQuery);
