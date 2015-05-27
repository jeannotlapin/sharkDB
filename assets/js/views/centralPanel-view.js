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
			$('#displayTitle').html(''); /* clear title */
			$('#map').hide();
			if (this.model.get('country')!='') {
				var country = this.model.get('country');
				var countriesModel = sharksDB.Collections.countriesCollection.get(country);
				var targetView = this;
				if (countriesModel.get('completed') == false) { /* we have to fetch the data*/
					countriesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/countries'+'/'+country;
					countriesModel.fetch({
						success : function () {
							countriesModel.set('completed', true);
							$('#displayTitle').html(countriesModel.get('name'));
							targetView.$el.html(targetView.countryTemplate({poasArray: countriesModel.get('poas').sort(poayearSort), othersArray: countriesModel.get('others').sort(yearSort)}));
							sharksDB.Models.currentState.trigger("modelUpdated");
						}
					});
				} else {
					$('#displayTitle').html(countriesModel.get('name'));
					this.$el.html(this.countryTemplate({dataArray: countriesModel.get('poas').sort(poayearSort)}));
				}

				this.$el.show();
			}

			if (this.model.get('species')!='') {
				var species = this.model.get('species');
				if (!isNaN(+species)) { /* this is a species group, data has already been fetched at loading, just display the table */
					$('#displayTitle').html(sharksDB.Collections.speciesGroupsCollection.get(species).get('name'));
					this.$el.html(this.speciesTemplate({dataArray: sharksDB.Collections.speciesGroupsCollection.get(species).get('measures').sort(yearSort)}));
					this.$el.show();
				} else { /* this is not a species group : fetch the complete information about it if needed */
					var speciesModel = sharksDB.Collections.speciesCollection.get(species);
					$('#displayTitle').html(speciesModel.get('englishName'));
					if (speciesModel.get('completed') == false) { /* we have to fetch the data*/
						speciesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/species'+'/'+species;
						speciesModel.fetch({
							success : function () {
								speciesModel.set('completed', true);
								$('#centralPanel').html(sharksDB.Views.CentralPanel.prototype.speciesTemplate({dataArray: speciesModel.get('measures').sort(yearSort)}));
								sharksDB.Models.currentState.trigger("modelUpdated");
							}
						});
					} else {
						this.$el.html(this.speciesTemplate({dataArray: speciesModel.get('measures').sort(yearSort)}));
					}

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

					/* get the distribution area from FAO server */
					sharksDB.Map.maritimeZoneLayer = L.tileLayer.wms('http://www.fao.org/figis/geoserver/wms', {
						dpiMode: 7,
						layers: 'fifao:SPECIES_DIST',
						cql_filter: "ALPHACODE='"+species+"'",
						featureCount: 10,
						format: 'image/png',
						transparent: true,
						zIndex: 1
					}).setOpacity(0.85)
					.addTo(sharksDB.Map.map);
				}

							}
			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				var entitiesModel = sharksDB.Collections.entitiesCollection.get(rfmo);
				var targetView = this;
				if (entitiesModel.get('completed') == false) { /* we have to fetch the data*/
					entitiesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/managemententities'+'/'+rfmo;
					entitiesModel.fetch({
						success : function () {
							entitiesModel.set('completed', true);
							$('#displayTitle').html("<a target='_blank' href='"+entitiesModel.get('webSite')+"'>"+entitiesModel.get('name')+"</a>");
							targetView.$el.html(targetView.rfmoTemplate({dataArray: entitiesModel.get('measures').sort(yearSort)}));
							sharksDB.Models.currentState.trigger("modelUpdated");
							renderCountriesOnRFMOMap(entitiesModel.get('members'));
						}
					});
				} else {
					$('#displayTitle').html("<a target='_blank' href='"+entitiesModel.get('webSite')+"'>"+entitiesModel.get('name')+"</a>");
					this.$el.html(this.rfmoTemplate({dataArray: entitiesModel.get('measures').sort(yearSort)}));
					renderCountriesOnRFMOMap(entitiesModel.get('members'));
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

				//sharksDB.Map.map.setView(sharksDB.Collections.RFMOInfoList[rfmo].map, 2); TODO: get the zoom from a geaFeature call
				sharksDB.Map.map.setView([0, 25], 2);

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
function poayearSort(a,b) {
	 if (+a.poAYear>+b.poAYear) return -1;
	 if (+a.poAYear<+b.poAYear) return 1;
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

/* render countries on the RFMO maps, is out of the render function because must wait for the asynchronous fetch of entity data */
function renderCountriesOnRFMOMap(modelMembers) {
	/* add countries highlighting layer using d3 */
	var entityCountryList = []; /* get all member iso_a3 code in an array */
	modelMembers.forEach(function(d){
		entityCountryList.push(d.code);
	});

	d3.json("data/geodata/countries110.json", function(collection) {
		var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);
		var transform2 = d3.geo.transform({point: projectPoint2}),
		path2 = d3.geo.path().projection(transform2);

		var selectedCountries = d3.select("#layerCountries").selectAll("g")
			.data(collection.features.filter(function (d){
				/* check country */
				if ($.inArray(d.properties.iso_a3, entityCountryList) != -1) {
					return true;
				}
				return false;
			}),
			function (d){return d.properties.iso_a3});

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
