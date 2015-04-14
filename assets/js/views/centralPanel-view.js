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
					} else { /* map was already loaded, we must clean zone layer before adding new one */
						sharksDB.Map.map.removeLayer(sharksDB.Map.maritimeZoneLayer); /* remove the wms tile of rfmo competence zone */
						d3.select("#layerCountries").selectAll("g").remove(); /* remove all highlighted countries if needed */
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
				} else { /* map was already loaded, we must clean zone layers before adding new one */
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

				d3.json("data/geodata/countries110.json", function(collection) {
					var transform = d3.geo.transform({point: projectPoint}),
					path = d3.geo.path().projection(transform);
					var transform2 = d3.geo.transform({point: projectPoint2}),
					path2 = d3.geo.path().projection(transform2);
					
					var selectedCountries = d3.select("#layerCountries").selectAll("g")
						.data(collection.features.filter(function (d){
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
						}),
						function (d){return d.properties.iso_n3});

					selectedCountries.exit().remove(); /* on selection exit remove the g element */

					var countryGroups =selectedCountries.enter() /* append a g element on enter */
						.append("g");

					var countryPathsWorld1 = countryGroups.append("path"); /* on enter: append 2 path elements in each g one : duplicate the world at +360 */
					var countryPathsWorld2 = countryGroups.append("path");

					sharksDB.Map.map.on("viewreset", reset);

					/* Draw the SVG paths for countries. */
					function reset() {
						countryPathsWorld1.attr("d", path); /* on current world [-180,180]*/
						countryPathsWorld2.attr("d", path2); /* on another world [180, 540]*/
						sharksDB.Map.map._updateSvgViewport(); /* make sure we update correctly svg layer translate attribute */
					}

					/* Use Leaflet to implement a D3 geometric transformation */
					function projectPoint(x, y) {
						var point = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x));
						this.stream.point(point.x, point.y);
					}
					function projectPoint2(x, y) {
						var point2 = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x+360)); /* project on a world translated by 360° */
						this.stream.point(point2.x, point2.y);
					}

					reset();
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
	sharksDB.Map.map = L.mapbox.map('map', 'jeannotlapin.lcld15nl', {worldCopyJump: false}).setView([0,0], 2);

	/* initialise svg layer */
	sharksDB.Map.map._initPathRoot();
	var svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layerCountries");
	g.classed('countryHigh', true); /* set class to layerCountries g element */


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
