sharksDB.Views.CentralPanel = Backbone.View.extend({
		el : '#centralPanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);
		},

		events : {
			"click td.doclink":"updateCurrentState"
		},

		countryTemplate : _.template($('#countrySelectedDocuments').html()),
		speciesTemplate : _.template($('#speciesSelectedDocuments').html()),
		rfmoTemplate : _.template($('#rfmoSelectedDocuments').html()),

		render : function () {
			this.$el.hide();
			if (this.model.get('country')!='') {
				/* render country table  */
				this.$el.html(this.countryTemplate({dataArray: sharksDB.Collections.countryList[this.model.get('country')].sort(yearSort)}));
				this.$el.show();
			}
			if (this.model.get('species')!='') {
				/* render species table  */
				this.$el.html(this.speciesTemplate({dataArray: sharksDB.Collections.speciesList[this.model.get('species')].sort(yearSort)}));
				this.$el.show();
			}
			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				/* render rfmo table  */
				this.$el.html(this.rfmoTemplate({dataArray: sharksDB.Collections.RFMOList[rfmo].sort(yearSort)}));
				/* render rfmo map */
				this.$el.append("<div id='map'></div>");
				this.$el.show(); /* display the map div before loading the map to get correct dimension */
				/* load map from mapbox */
				L.mapbox.accessToken = 'pk.eyJ1IjoiamVhbm5vdGxhcGluIiwiYSI6Im5qNTl1QXcifQ.fex2-4xMOYtkSgwtkwRGBQ';
				var map = L.mapbox.map('map', 'jeannotlapin.lcld15nl', {worldCopyJump: true}).setView(sharksDB.Collections.RFMOInfoList[rfmo].map, 2);

				/* add countries highlighting layer using d3 */
				var ue = ($.inArray(rfmo, sharksDB.Collections.countryInfoList[1001].rfmo) != -1); /* UE have the arbitrary 1001 iso code in the DB */
				var svg = d3.select(map.getPanes().overlayPane).append("svg"),
				g = svg.append("g").attr("class", "leaflet-zoom-hide");

				d3.json("data/geodata/countries110.json", function(collection) {
					var transform = d3.geo.transform({point: projectPoint}),
					path = d3.geo.path().projection(transform);

					var feature = g.selectAll("path")
						.data(collection.features)
						.enter()
						.append("path")
						.filter(function (d){
							/* check country */
							if (+d.properties.iso_n3 in sharksDB.Collections.countryInfoList && sharksDB.Collections.countryInfoList[+d.properties.iso_n3] != undefined) {
								if ($.inArray(rfmo, sharksDB.Collections.countryInfoList[+d.properties.iso_n3].rfmo) != -1) {
									return true
								}
							}

							/* check UE */
							if (ue==true && d.properties.UE==1) { /* geojson has been modified to include a UE property set to 1 for UE members */
								return true;
							}
							return false;
						})
						.style("fill", "#3dd5a8")
						.style("fill-opacity", 0.25)
						.style("stroke", "#3dd5a8")
						.style("stroke-opacity", 0.5);

					map.on("viewreset", reset);
					reset();

					// Reposition the SVG to cover the features.
					function reset() {
						var bounds = path.bounds(collection),
						topLeft = bounds[0],
						bottomRight = bounds[1];

						svg.attr("width", bottomRight[0] - topLeft[0])
							.attr("height", bottomRight[1] - topLeft[1])
							.style("left", topLeft[0] + "px")
							.style("top", topLeft[1] + "px");

						g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

						feature.attr("d", path);
					}

					// Use Leaflet to implement a D3 geometric transformation.
					function projectPoint(x, y) {
						var point = map.latLngToLayerPoint(new L.LatLng(y, x));
						this.stream.point(point.x, point.y);
					}
				});

				/* add the 200nm limit from FAO server */
				var nm200Layer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
							dpiMode: 7,
							layers: 'fifao:limit_200nm',
							featureCount: 10,
							format: 'image/png',
							transparent: true,
						})
						.setOpacity(0.15)
						.addTo(map);

				/* add the competence area from FAO server */
				var nm200Layer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
							dpiMode: 7,
							layers: 'rfb:RFB_'+rfmo,
							featureCount: 10,
							format: 'image/png',
							transparent: true,
						})
						.setOpacity(0.15)
						.addTo(map);

			}
			return this;
		},

		updateCurrentState : function (e) {
			this.model.set({country: ('country' in e.target.dataset)?e.target.dataset.country:'',
					rfmo: ('rfmo' in e.target.dataset)?e.target.dataset.rfmo:'',
					species: ('species' in e.target.dataset)?e.target.dataset.species:''});
		}
});

/* sort by most recent to less recent and alphabetical order of title for same year docs */
function yearSort(a,b) {
	 if (+a.year>+b.year) return -1;
	 if (+a.year<+b.year) return 1;
	 if (a.title>b.title) return 1;
	 return -1;
}

