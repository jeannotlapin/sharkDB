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
					var targetView = this;
					$('#displayTitle').html(speciesModel.get('englishName'));
					if (speciesModel.get('completed') == false) { /* we have to fetch the data*/
						speciesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/species'+'/'+species;
						speciesModel.fetch({
							success : function () {
								speciesModel.set('completed', true);
								$('#centralPanel').html(targetView.speciesTemplate({dataArray: speciesModel.get('measures').sort(yearSort)}));
								sharksDB.Models.currentState.trigger("modelUpdated");
								targetView.$el.show(); /* display the map div before loading the map to get correct dimension */
								renderSpeciesDistributionMap(speciesModel, species);
							}
						});
					} else {
						this.$el.html(this.speciesTemplate({dataArray: speciesModel.get('measures').sort(yearSort)}));
						this.$el.show(); /* display the map div before loading the map to get correct dimension */
						renderSpeciesDistributionMap(speciesModel, species);
					}

				}
			}

			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				var entitiesModel = sharksDB.Collections.entitiesCollection.get(rfmo);

				/* render rfmo map */
				$('#map').show();
				this.$el.show(); /* display the map div before loading the map to get correct dimension */

				/* load background map from mapbox if needed */
				if (sharksDB.Map.map == undefined) {
					setBackgroundMap();
				} else { /* map was already loaded */
					d3.select("#layerMarineArea").selectAll("g").remove(); /* remove previous marine Area layer, it would have been when new layer is loaded but it may be long so wipe it out now */
				}

				/* get extent information(do we really need that when switched to all d3?) */
				/*if (entitiesModel.extent == undefined) {
					d3.xml("http://npasc.al:1337?geonetwork/srv/en/csw?service=CSW&request=GetRecordById&Version=2.0.2&elementSetName=brief&outputSchema=http://www.isotc211.org/2005/gmd&id=fao-rfb-map-"+rfmo, "application/xml", function(error, d){
						//console.log(d);
						//console.log(d3.select(d));
					})
				}*/

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

				//sharksDB.Map.map.setView(sharksDB.Collections.RFMOInfoList[rfmo].map, 2); TODO: get the zoom from a geaFeature call
				sharksDB.Map.map.setView([0, 25], 2);

				/* Add the rfmo area layer */
				d3.json("http://npasc.al:1337?figis/geoserver/rfb/ows?service=WFS&version=1.0.0&request=GetFeature&outputFormat=json&typeName=RFB_"+rfmo, function(error, collection) {
					var transform = d3.geo.transform({point: projectPoint}),
					path = d3.geo.path().projection(transform);

					var selectedCountries = d3.select("#layerMarineArea").selectAll("path")
						.data(collection.features, function (d){return d.id});

					selectedCountries.exit().remove(); /* on selection exit remove the g element */

					var rfmoArea = selectedCountries.enter() /* append a g element on enter */
						.append("path");

					sharksDB.Map.map.on("viewreset", reset);

					/* Draw the SVG paths for countries. */
					function reset() {
						rfmoArea.attr("d", path); /* on current world [-180,180]*/
						sharksDB.Map.map._updateSvgViewport(); /* make sure we update correctly svg layer translate attribute */
					}

					/* Use Leaflet to implement a D3 geometric transformation */
					function projectPoint(x, y) {
						var point = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x));
						this.stream.point(point.x, point.y);
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
	svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layerMarineArea");
	g.classed('marineArea', true); /* set class to layerMarineArea g element */
	svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layer200nm");
	g.classed('limit200nm', true); /* set class to layer200nm g element */


	/* add the 200nm limit from stored topojson file built from geojson retrieved on FAO server */
	d3.json("data/geodata/limit200nm.json", function(error, collection) {
		var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);

		var features = d3.select("#layer200nm").selectAll("path")
			//.data(collection.features).enter().append("path");
			.data(topojson.feature(collection, collection.objects.limit200nm).features).enter().append("path");

		sharksDB.Map.map.on("viewreset", reset);

		/* Draw the SVG paths for countries. */
		function reset() {
			features.attr("d", path); /* on current world [-180,180]*/
			sharksDB.Map.map._updateSvgViewport(); /* make sure we update correctly svg layer translate attribute */
		}

		/* Use Leaflet to implement a D3 geometric transformation */
		function projectPoint(x, y) {
			var point = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x));
			this.stream.point(point.x, point.y);
		}

		reset();
	});
}

/* render countries on the RFMO maps, is out of the render function because must wait for the asynchronous fetch of entity data */
function renderCountriesOnRFMOMap(modelMembers) {
	/* add countries highlighting layer using d3 */
	var entityCountryList = []; /* get all member iso_a3 code in an array */
	modelMembers.forEach(function(d){
		entityCountryList.push(d.code);
	});

	d3.json("data/geodata/countries110.json", function(error, collection) {
		var transform = d3.geo.transform({point: projectPoint}),
		path = d3.geo.path().projection(transform);
		var transform2 = d3.geo.transform({point: projectPoint2}),
		path2 = d3.geo.path().projection(transform2);

		var selectedCountries = d3.select("#layerCountries").selectAll("g")
			.data(topojson.feature(collection, collection.objects.countries).features.filter(function (d){
				/* check country */
				if ($.inArray(d.id, entityCountryList) != -1) {
					return true;
				}
				return false;
			}),
			function (d){return d.id});

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

function renderSpeciesDistributionMap(modelSpecies, species) {
	if (modelSpecies.get('hasDistributionMap') == true) { /* render the distribution map if there is one */
		$('#map').show();

		/* load map from mapbox if needed */
		if (sharksDB.Map.map == undefined) {
			setBackgroundMap();
		} else { /* map was already loaded */
			d3.select("#layerCountries").selectAll("g").remove(); /* remove all highlighted countries if needed */
			d3.select("#layerMarineArea").selectAll("g").remove(); /* remove previous marine Area layer, it would have been when new layer is loaded but it may be long so wipe it out now */
		}
		sharksDB.Map.map.setView([25,0], 2);

		/* Add the species distribution layer */
		d3.json("http://npasc.al:1337?figis/geoserver/species/ows?service=WFS&version=1.0.0&request=GetFeature&outputFormat=json&typeName=SPECIES_DIST_"+species, function(error, collection) {
			var transform = d3.geo.transform({point: projectPoint}),
			path = d3.geo.path().projection(transform);

			var distributionAreas = d3.select("#layerMarineArea").selectAll("path")
				.data(collection.features, function (d){return d.id});

			distributionAreas.exit().remove(); /* on selection exit remove the path element */

			var area = distributionAreas.enter() /* append a path element on enter */
				.append("path");

			/* add marineAreaHatched class to the path matching a PRESENCE==2 feature */
			area.filter(function (d){ if (d.properties.PRESENCE == 2) return true; return false}).attr("class", "marineAreaHatched");

			sharksDB.Map.map.on("viewreset", reset);

			/* Draw the SVG paths for countries. */
			function reset() {
				area.attr("d", path); /* on current world [-180,180]*/
				sharksDB.Map.map._updateSvgViewport(); /* make sure we update correctly svg layer translate attribute */
			}

			/* Use Leaflet to implement a D3 geometric transformation */
			function projectPoint(x, y) {
				var point = sharksDB.Map.map.latLngToLayerPoint(new L.LatLng(y, x));
				this.stream.point(point.x, point.y);
			}

			reset();
		});
	}
}
