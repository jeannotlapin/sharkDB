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
			$('#map').hide();
			if (this.model.get('country')!='') {
				/* render country table  */
				this.$el.html(this.countryTemplate({dataArray: sharksDB.Collections.countryList[this.model.get('country')].sort(yearSort)}));
				this.$el.show();
			}
			if (this.model.get('species')!='') {
				var species = this.model.get('species');
				/* render species table  */
				if (sharksDB.Collections.speciesList[this.model.get('species')] != undefined) {
					this.$el.html(this.speciesTemplate({dataArray: sharksDB.Collections.speciesList[species].sort(yearSort)}));
				} else {
					this.$el.html(this.speciesTemplate({dataArray: new Array()}));
				}
				/* render distribution map if exists */
				if (sharksDB.Collections.speciesInfoList[species].map != '') {
					$('#map').show();
					this.$el.show(); /* display the map div before loading the map to get correct dimension */

					/* load map from mapbox if needed */
					if (sharksDB.Map.map == undefined) {
						setBackgroundMap();
					} else { /* map was already loaded, we must clean countries and zone layers before adding new ones */
						if ($('#layerCountries')) {
							$('#layerCountries').remove();/* remove countries layer(the svg added using d3 with id layerCountries) */
						}
						sharksDB.Map.map.removeLayer(sharksDB.Map.maritimeZoneLayer); /* remove the wms tile of rfmo competence zone */
					}
					sharksDB.Map.map.setView([25,0], 2);

					/* add the distribution area from FAO server */
					sharksDB.Map.maritimeZoneLayer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
							dpiMode: 7,
							layers: 'species:SPECIES_DIST_'+sharksDB.Collections.speciesInfoList[species].map,
							featureCount: 10,
							format: 'image/png',
							transparent: true,
							zIndex: 1
						})
						.setOpacity(0.85)
						.addTo(sharksDB.Map.map);
				} else {
					this.$el.show();
				}

			}
			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				/* render rfmo table  */
				if (sharksDB.Collections.RFMOList[rfmo] != undefined) {
					this.$el.html(this.rfmoTemplate({dataArray: sharksDB.Collections.RFMOList[rfmo].sort(yearSort)}));
				} else {
					this.$el.html(this.rfmoTemplate({dataArray: new Array()}));
				}
				/* render rfmo map */
				$('#map').show();
				this.$el.show(); /* display the map div before loading the map to get correct dimension */

				/* load map from mapbox if needed */
				if (sharksDB.Map.map == undefined) {
					setBackgroundMap();
				} else { /* map was already loaded, we must clean countries and zone layers before adding new ones */
					if ($('#layerCountries')) {
						$('#layerCountries').remove();/* remove countries layer(the svg added using d3 with id layerCountries) */
					}
					sharksDB.Map.map.removeLayer(sharksDB.Map.maritimeZoneLayer); /* remove the wms tile of rfmo competence zone */
				}
				sharksDB.Map.map.setView(sharksDB.Collections.RFMOInfoList[rfmo].map, 2);

				/* add the competence area from FAO server */
				sharksDB.Map.maritimeZoneLayer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
							dpiMode: 7,
							layers: 'rfb:RFB_'+rfmo,
							featureCount: 10,
							format: 'image/png',
							transparent: true,
							zIndex: 1
						})
						.setOpacity(0.15)
						.addTo(sharksDB.Map.map);

				/* add countries highlighting layer using d3 */
				var ue = ($.inArray(rfmo, sharksDB.Collections.countryInfoList[1001].rfmo) != -1); /* UE have the arbitrary 1001 iso code in the DB */
				var svg = d3.select(sharksDB.Map.map.getPanes().overlayPane).append("svg").attr("id", "layerCountries"),
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

					sharksDB.Map.map.on("viewreset", reset);
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
						var point = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x));
						this.stream.point(point.x, point.y);
					}
				});
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

/* Load background map and 200nm limit WMS layer from FAO server */
function setBackgroundMap() {
	sharksDB.Map.map = L.mapbox.map('map', 'jeannotlapin.lcld15nl', {worldCopyJump: true});

	/* add the 200nm limit from FAO server */
	var nm200Layer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
			dpiMode: 7,
			layers: 'fifao:limit_200nm',
			featureCount: 10,
			format: 'image/png',
			transparent: true,
			zIndex: 5
		})
		.setOpacity(0.20)
		.addTo(sharksDB.Map.map);
}
