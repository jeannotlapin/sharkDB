sharksDB.Views.Map = Backbone.View.extend({
	el : "#map",

	initialize : function (options) {
		this.options = options || {};
		this.listenTo(sharksDB.Collections.entitiesCollection, 'update', this.renderEntitiesCountries);
		this.listenTo(sharksDB.Collections.speciesCollection, 'update', this.renderSpecies);
		this.listenTo(this.model, 'resetMap', this.resetMap);
		initMap();
	},

	renderEntitiesCountries : function (entitiesModel) { /* called after loading of RFMO info, so we now have the members countries list: display them */
		renderCountriesOnRFMOMap(entitiesModel.get('members'));
	},

	/* at map reset we shall : load background map if needed, then if it is a RFMO, load its marine area layer */
	/* in case of species, all this is managed by update event on speciesCollection as we must be sure there is a map to show */
	resetMap : function (showFlag, entitiesModel) {
		if (showFlag == true) {
			this.$el.show();
			resetMapLayers();
			if (entitiesModel != undefined) { /* there is a RFMO marine area layer to load */
				/* Add the rfmo area layer */
				d3.json("http://npasc.al:1337?figis/geoserver/rfb/ows?service=WFS&version=1.0.0&request=GetFeature&outputFormat=json&typeName=RFB_"+entitiesModel.get('acronym'), function(error, collection) {
					if (collection.bbox[1]<-85 && collection.bbox[3]<-40) {
						if (sharksDB.Map.projection === sharksDB.Map.projectionNatural) {
							var width = document.getElementById('map').offsetWidth;
							var height = width;
							sharksDB.Map.map.attr("height", width);
							sharksDB.Map.projection = sharksDB.Map.projectionPolar;
							sharksDB.Map.path = d3.geo.path().projection(sharksDB.Map.projection);
							sharksDB.Map.projection.rotate([0,0,0]).scale(width/4.2).translate([width/2,height/2]);
						}
					} else {
						if (sharksDB.Map.projection === sharksDB.Map.projectionPolar) {
							var width = document.getElementById('map').offsetWidth;
							var height = width/2;
							sharksDB.Map.map.attr("height", width/2);
							sharksDB.Map.projection = sharksDB.Map.projectionNatural;
							sharksDB.Map.path = d3.geo.path().projection(sharksDB.Map.projection);
							sharksDB.Map.projection.scale(width/6).translate([width/2,height/2]);
						}
						sharksDB.Map.projection.rotate([checkBbox(collection.objects.marineAreas.geometries),0,0]);
					}
					sharksDB.Map.map.selectAll("path").attr("d", sharksDB.Map.path); /* update all path on the map */

					d3.select("#layerMarineArea").append("path")
						.datum(topojson.feature(collection, collection.objects.marineAreas))
						.attr("d", sharksDB.Map.path)
						.attr("class", "rfmoMarineArea");
				});

			}
		} else { /* hide the map */
			this.$el.hide();
		}
	},

	renderSpecies : function (modelSpecies) { /* called after loading species information: check if there is a map to load, do it if needed */
		renderSpeciesDistributionMap(modelSpecies);
	}
});

/* call at init: create map, projection and paths */
function initMap() {
	var width = document.getElementById('mapContainer').offsetWidth; /* get width of mapContainer div as map is hidden at load and then has no width */
	var height = width / 2;

	var scale0 = width / 6;
	var zoom = d3.behavior.zoom()
		.translate([width / 2, height / 2])
		.scale(scale0)
		.scaleExtent([scale0, 4 * scale0])
		.on("zoom", zoomed);

	/* create projection */
	sharksDB.Map.projectionNatural = d3.geo.naturalEarth()
			.precision(.1)
			.center([0, 0])
			.translate([width/2,height/2])
			.scale(width / 6 )
			.rotate([0,0,0]);

	sharksDB.Map.projectionPolar = d3.geo.azimuthalEqualArea()
			.precision(.1)
			.center([0, 0])
			.translate([width/2,height/2])
			.scale(width / 8 )
			.rotate([0,0,0]);

	sharksDB.Map.projection = sharksDB.Map.projectionNatural; /* default is naturalEarth projection */

	sharksDB.Map.path = d3.geo.path().projection(sharksDB.Map.projection);

	/* create svg layer for sphere around the world and sea background */
	sharksDB.Map.map = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height);

	/* attach zoom and panning management */
	sharksDB.Map.map
		.call(zoom)
		.call(zoom.event);

	/* background and border: draw a sphere around the world */
	sharksDB.Map.map.append("g").append("path")
		.datum({type: "Sphere"})
		.attr("id", "sphere")
		.attr("d", sharksDB.Map.path);

	/* and groups layer */
	var svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layerLand");

	svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layer200nm");

	svg = d3.select("#map").select("svg"),
	    g = svg.append("g").attr("id", "layerMarineArea");

	/* manage zoom and panning */
	function zoomed() {
		sharksDB.Map.projection
			.translate(zoom.translate())
			.scale(zoom.scale());
		sharksDB.Map.map.selectAll("path").attr("d",sharksDB.Map.path);
	}

	/* redraw the map when the window has been resized */
	d3.select(window).on("resize", redraw);

	function redraw() {
		width = document.getElementById('map').offsetWidth;
		height = width / 2;
		sharksDB.Map.map
			.attr("width", width)
			.attr("height", height);
		sharksDB.Map.projection
			.translate([width/2,height/2])
			.scale(width / 6 );
		sharksDB.Map.map.selectAll("path").attr("d",sharksDB.Map.path);
	}
}

/* Load background map and 200nm limit */
function setBackgroundMap() {
	/* set the background layer : all countries (not European Union) */
	d3.json("data/geodata/countries110.json", function(error, collection) {
		d3.select("#layerLand").append("path")
			.datum(topojson.feature(collection, collection.objects.countries))
				.attr("d", sharksDB.Map.path);

		d3.select("#layerLand").selectAll(".backgroundLand")
				.data(topojson.feature(collection, collection.objects.countries).features)
				.enter()
				.append("path")
				.attr("class", "backgroundLand");

		sharksDB.Map.backgroundLoaded = true;

		d3.select("#layerLand").selectAll("path")
			.filter(function (d){
				if (d.id == 'EUR') {
					return true;
				}
				return false;
		}).attr("class", 'EURbackgroundLand');
	});

	/* add the 200nm limit from stored topojson file built from geojson retrieved on FAO server */
	d3.json("data/geodata/limit200nm.json", function(error, collection) {
		var features = d3.select("#layer200nm").append("path")
			.datum(topojson.feature(collection, collection.objects.limit200nm))
				.attr("d", sharksDB.Map.path)
				.attr("class", "limit200nm");
	});
}

/* TODO: this shall be performed on proxy/cache and stored in topojson bbox property */
function checkBbox(geometries) {
	var world360 = [];
	if (geometries.length == 1) {
		return -(geometries[0].properties.bbox[0]+geometries[0].properties.bbox[2])/2;
	}

	geometries.forEach(function (d) {
		var west = d.properties.bbox[0];
		var east = d.properties.bbox[2];
		for (i=Math.floor(west); i<=Math.round(east); i++) {
			world360.push((+i));
		}
	});

	var gap = 2, westBound=0, eastBound=360;
	var last=world360.sort(function (a,b) {return a-b;})[0];
	world360.push(last+360);

	world360.forEach(function (d) {
		if (d-last>gap) {
			gap = d-last;
			westBound=last;
			eastBound=d;
		}
		last = d;
	});

	return -(((westBound+eastBound)/2+180)%360);
}


/* set class for members countries on the RFMO maps */
function renderCountriesOnRFMOMap(modelMembers) {
	/* add countries highlighting layer using d3 */
	var entityCountryList = []; /* get all member iso_a3 code in an array */
	var isEUR = false;
	modelMembers.forEach(function(d){
		if (d.code!='EUR') {
			entityCountryList.push(d.code);
		} else {
			isEUR = true;
		}
	});

	d3.select("#layerLand").selectAll("path")
		.filter(function (d){
			if ($.inArray(d.id, entityCountryList) != -1) {
				return true;
			}
			return false;
		}).attr("class", 'backgroundLand countryHigh');

	if (isEUR) {
		$('path.EURbackgroundLand').attr("class", "EURcountryHigh");
	}
}

function renderSpeciesDistributionMap(modelSpecies) {
	if (modelSpecies.get('hasDistributionMap') == true) { /* render the distribution map if there is one */
		$('#map').show();
		resetMapLayers();

		if (sharksDB.Map.projection === sharksDB.Map.projectionPolar) {
			var width = document.getElementById('map').offsetWidth;
			var height = width/2;
			sharksDB.Map.map.attr("height", width/2);
			sharksDB.Map.projection = sharksDB.Map.projectionNatural;
			sharksDB.Map.path = d3.geo.path().projection(sharksDB.Map.projection);
			sharksDB.Map.projection.scale(width/6).translate([width/2,height/2]);
		}

		/* Add the species distribution layer */
		d3.json("http://npasc.al:1337?figis/geoserver/species/ows?service=WFS&version=1.0.0&request=GetFeature&outputFormat=json&typeName=SPECIES_DIST_"+modelSpecies.get('alphaCode'), function(error, collection) {
			sharksDB.Map.projection.rotate([checkBbox(collection.objects.marineAreas.geometries),0,0]);
			sharksDB.Map.map.selectAll("path").attr("d", sharksDB.Map.path); /* update all path on the map */

			var distributionAreas = d3.select("#layerMarineArea").selectAll("path")
				.data(topojson.feature(collection, collection.objects.marineAreas).features, function (d){return d.id});
			distributionAreas.exit().remove(); /* on selection exit remove the path elements */

			var area = distributionAreas.enter() /* append a g element on enter */
				.append("path").attr("d", sharksDB.Map.path).attr("class", "marineArea");

			/* add marineAreaHatched class to the path matching a PRESENCE==2 feature */
			area.filter(function (d){ if (d.properties.PRESENCE == 2) return true; return false}).attr("class", "marineAreaHatched");
		});
	}
}

/* If background map is not loaded do it otherwise just reset everything: remove marine area layer paths and reset countryHigh classes */
function resetMapLayers() {
	if (sharksDB.Map.backgroundLoaded == false) {
		setBackgroundMap();
	} else { /* map was already loaded */
		d3.select("#layerMarineArea").selectAll("path").remove(); /* remove previous marine Area layer, it would have been when new layer is loaded but it may be long so wipe it out now */
		var width = document.getElementById('map').offsetWidth;
		if  (sharksDB.Map.projection == sharksDB.Map.projectionNatural) {
			var height = width / 2;
			sharksDB.Map.projection.scale(width/6).translate([width/2,height/2]);
		} else {
			var height = width;
			sharksDB.Map.projection.scale(width/4.2).translate([width/2,height/2]);
		}
		$('path.countryHigh').attr("class", "backgroundLand");
		$('path.EURcountryHigh').attr("class", "EURbackgroundLand");
	}
}
