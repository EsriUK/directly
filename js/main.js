 require([
           "esri/Map",
           "esri/views/MapView",
           "esri/layers/FeatureLayer",
           "esri/core/watchUtils",
		   "esri/geometry/support/webMercatorUtils",
		   "esri/tasks/support/Query",
           "esri/Graphic",
           "dojo/domReady!"
         ], function(Map, MapView, FeatureLayer, watchUtils, webMercatorUtils, Query, Graphic ) {
         	
         	var map = new Map({
         		basemap: "streets-navigation-vector"
         	});
         
         	var view = new MapView({
         		container: "viewDiv",
         		map: map,
         		zoom: 10,
         		center: [-5,55],
         		constraints: {
					rotationEnabled: false, //Rotation too complex for prototype...
         			minZoom: 10,
         			maxZoom: 10
         		}
			 });
			 
			 view.ui.remove("zoom");

         
            //Global vars
         	var feats;
         	var thePoints;
         	var board		= document.getElementById('contentContainer');
         	var w			= window;
         	var d			= document;
         	var e			= d.documentElement;
         	var g			= d.getElementsByTagName('body')[0];
         	var request		= new XMLHttpRequest();
         	var x = w.innerWidth || e.clientWidth || g.clientWidth;
         	var y = w.innerHeight|| e.clientHeight|| g.clientHeight;
         
			function addFeatureService(){
				var portsRenderer = {
					type: "simple",  // autocasts as new SimpleRenderer()
					symbol: {
						type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
						url: "images/portIcon.png",
						width: "64px",
						height: "64px",
						yOffset: "32px"
					}
				};
			
				var ukPorts = new FeatureLayer({
					url: "https://services.arcgis.com/EKJFXol2kjsIRba0/arcgis/rest/services/UK_Ports_Locations/FeatureServer/0",
					renderer: portsRenderer
				});
			
				map.add(ukPorts);
				queryFeatureService(ukPorts)
				
			};

			function queryFeatureService(featureService){
				var query = featureService.createQuery();
				featureService.queryFeatures(query)
				.then(function(response){
					feats = response
					 for(var i = 0; i < feats.features.length; i++){ 
						 var Outerpoint = document.createElement("div");
						 Outerpoint.className = 'point';
						 board.appendChild(Outerpoint);
					 }
		 
					 thePoints = document.querySelectorAll(".point");
					 calcDegree();	// once loaded, re-arrange points.
				});
			}

         	view.when(function() {
				addFeatureService();
         		watchUtils.when(view, "extent", calcDegree);
         	});
         
         	function calcDistance(i,lat1,lon1,lat2,lon2){
         		var distance = Math.sqrt(Math.pow((lon2-lon1),2) + Math.pow((lat2-lat1),2))
         		
         		//if it's visible - value hard coded for now. Next step would be to calculate it with scale. 
         		if(distance<50000){
					 document.getElementsByClassName('point')[i].style.backgroundColor = "rgba(0, 0, 0, 0.0)";
         		} else{
         			if(distance<100000 && distance>=50000){
         				document.getElementsByClassName('point')[i].classList.add('close');
         			}else{
         				document.getElementsByClassName('point')[i].classList.remove('close');
         			}
					 document.getElementsByClassName('point')[i].style.backgroundColor = "rgba(40, 121, 242, 0.5)";

         		}
         		return distance
         	}
            
            // This function works out the degree/angle the point is from the center of the view.
         	function calcDegree() {
         		for (var i = 0; i < feats.features.length; i++) {

                    var thePoint = thePoints[i];
                     
         			var pointA = {
         				x: feats.features[i].geometry.x,
         				y: feats.features[i].geometry.y
         			};
         
         			var pointB = {
         				x: view.center.x,
         				y: view.center.y
         			};
					
					//This changes the scale of the points
         			var sizer = calcDistance(i,feats.features[i].geometry.y,feats.features[i].geometry.x,view.center.y,view.center.x);
					 
					var angleDeg = (Math.atan2(pointB.x - pointA.x, pointB.y - pointA.y) * 180 / Math.PI) + 180;
         			var circleOffset = 25; // Padding in pixels
					var borderOffset = 40;
					var hypot = Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2));
					var sinOfAngleA = Math.asin(y / hypot) * 180 / Math.PI;
					var sinOfAngleB = Math.asin(x / hypot) * 180 / Math.PI;
					 
					var pixels = "px";
					var distanceFromTop
					var distanceFromLeft
         			
         			//TOPRIGHT
         			if(0 < angleDeg && angleDeg < sinOfAngleB) {
						 distanceFromTop =  0 + pixels;
						 distanceFromLeft = ((angleDeg - 0) / (sinOfAngleB - 0) * (x / 2)) + (x/2) - borderOffset + pixels;
         			} 
         			
         			//RIGHT            
         			else if(angleDeg > sinOfAngleB && angleDeg < sinOfAngleB + (2 * sinOfAngleA)) {
						distanceFromLeft = x -borderOffset + pixels;
						distanceFromTop = ((angleDeg - sinOfAngleB) / ((sinOfAngleB + (2 * sinOfAngleA)) - sinOfAngleB) * y) + pixels;
         			}
         			
         			//BOTTOM            
         			else if(angleDeg > sinOfAngleB + (2 * sinOfAngleA) && angleDeg < (3 * sinOfAngleB) + (2 * sinOfAngleA)) {
						distanceFromTop = y - borderOffset + pixels;
						distanceFromLeft = x -(angleDeg - (sinOfAngleB + (2 * sinOfAngleA))) / (((3 * sinOfAngleB) + (2 * sinOfAngleA)) - (sinOfAngleB + (2 * sinOfAngleA))) * x + pixels;
         			}
         			
         			//LEFT            
         			else if(angleDeg > (3 * sinOfAngleB) + (2 * sinOfAngleA) && angleDeg < (3 * sinOfAngleB) + (4 * sinOfAngleA)) {
						 distanceFromLeft = 0 + pixels;
						 distanceFromTop = y - (angleDeg - ((3 * sinOfAngleB) + (2 * sinOfAngleA))) / (((3 * sinOfAngleB) + (4 * sinOfAngleA)) - ((3 * sinOfAngleB) + (2 * sinOfAngleA))) * y - circleOffset + pixels;
         			}
         			
         			//TOP LEFT
         			else if(angleDeg > (3 * sinOfAngleB) + (4 * sinOfAngleA) && angleDeg < 360) {
						 distanceFromTop = 0 + pixels;
						 distanceFromLeft = (angleDeg - ((3 * sinOfAngleB) + (4 * sinOfAngleA))) / (360 - ((3 * sinOfAngleB) + (4 * sinOfAngleA))) * (x / 2) + pixels;
					 }
					 
					thePoint.style.top = distanceFromTop;
					thePoint.style.left = distanceFromLeft;
         		}
         	}
         });