window.sharksDB = {
	Models:{},
	Views:{},
	Collections:{},
	Map:{},
	Routers:{},

	initialize : function () {
		sharksDB.Collections.countryList = new Array();
		sharksDB.Collections.countryInfoList = new Array();
		sharksDB.Collections.speciesList = new Object();
		sharksDB.Collections.RFMOList = new Object();
		sharksDB.Collections.RFMOInfoList = new Object();

		sharksDB.Models.currentState = new sharksDB.Models.state();

		sharksDB.Collections.speciesGroupsCollection =  new sharksDB.Collections.speciesGroups();
		sharksDB.Collections.speciesGroupsCollection.comparator = 'name';
		sharksDB.Collections.speciesCollection =  new sharksDB.Collections.species();
		sharksDB.Collections.speciesCollection.comparator =  'englishName';

		/*sharksDB.Collections.speciesGroupsCollection.fetch({
			success : function () {
				console.log(sharksDB.Collections.speciesGroupsCollection.models);
			}
		});
*/
		/* maps: initialise mapbox token and set to undefined map and rfmoLayer variables */
		L.mapbox.accessToken = 'pk.eyJ1IjoiamVhbm5vdGxhcGluIiwiYSI6Im5qNTl1QXcifQ.fex2-4xMOYtkSgwtkwRGBQ';
		sharksDB.Map.map = undefined; /* this is useless, just to keep track of properties used in the Map object */
		sharksDB.Map.maritimeZoneLayer = undefined;

		/* fetch from figis server the species general information and species groups complete information */
		function getSpecies (callback) {
			/* this var are used to synchonise results and make sure everything arrived before we call the callback from d3 queue */
			var groupsNb = -1; /* store the groups number to check we've fetch them all */
			var speciesFetch = false;
			var speciesGroupFetch = false;

			/* fetch general information on all species, details will be fetched on demand, it's enough to build the menu */
			sharksDB.Collections.speciesCollection.fetch({
				success : function () {
					if (speciesGroupFetch == true) {
						callback(null, sharksDB.Collections.speciesGroupsCollection);
					} else {
						speciesFetch = true;
					}
				}
			});

			/* fetch general information on groups and then details on an of them because we need it to build the dropdown menu */
			sharksDB.Collections.speciesGroupsCollection.fetch({
				success : function () {
					groupsNb = sharksDB.Collections.speciesGroupsCollection.length;
					/* loop all the group collection and fetch details (fish which are parts of the group) on them */
					sharksDB.Collections.speciesGroupsCollection.forEach(function(model) {
						model.url = sharksDB.Collections.speciesGroupsCollection.url+'/'+model.get('code'); /* assing an url to the mnodel to fetch from it */
						model.fetch({
							success: function () {
								groupsNb--;
								if (groupsNb==0) { /* check we've got them all */
									if (speciesFetch == true) { /* be sure species fetch already ended */
										callback(null, sharksDB.Collections.speciesGroupsCollection);
									} else {
										speciesGroupFetch = true;
									}
								}
							}
						});
					});
				}
			});
		};


		queue(2)
		//.defer(d3.xml, "data/getcapabilities_1.1.1.xml", "application/xml")
		//.defer(d3.xml, "http://www.fao.org/figis/geoserver/wms?service=wms&version=1.1.1&request=GetCapabilities", "application/xml") // Enable this if figis server unlock cross origin request in their header
		.defer(getSpecies) /* fetch the groups and species information, all of these are stored in the dedicated collections: speciesCollection and speciesGroupCollection */
		.defer(d3.csv, "data/countryDocList.csv", function (d) {
			if (+d.isonumcode != 0 && !isNaN(d.isonumcode)) { /* skip invalid country code */
				if (!(+d.isonumcode in sharksDB.Collections.countryList)) {
					sharksDB.Collections.countryList[+d.isonumcode] = new Array();
				}
				sharksDB.Collections.countryList[+d.isonumcode].push({
					type: d.type,
					title: d.title,
					status: d.status,
					description: d.description,
					url: d.url,
					year: d.year
					});
			}
		})
		.defer(d3.csv, "data/RFMODocList.csv", function (d) {
			/* populate RFMOList */
			if (!(d.RFMO in sharksDB.Collections.RFMOList)) {
				sharksDB.Collections.RFMOList[d.RFMO] = new Array();
			}
			sharksDB.Collections.RFMOList[d.RFMO].push({
				type: d.type,
				measure: d.measure,
				species: d.species,
				title: d.title,
				description: d.description,
				url: d.url,
				year: d.year
			});

			/* populate SpeciesList */
			if (d.species != '') {
				if (!(d.species in sharksDB.Collections.speciesList)) {
					sharksDB.Collections.speciesList[d.species] = new Array();
				}
				sharksDB.Collections.speciesList[d.species].push({
					type: d.type,
					measure: d.measure,
					rfmo: d.RFMO,
					title: d.title,
					description: d.description,
					url: d.url,
					year: d.year
				});
			}
		})
		.defer(d3.csv, "data/countryMembership.csv", function (d) {
			if (+d.isonumcode != 0 && !isNaN(d.isonumcode)) { /* skip invalid country code */
				sharksDB.Collections.countryInfoList[+d.isonumcode] = {
					name: d.name,
					iso2: d.isocode2,
					iso3: d.isocode3,
					rfmo: (d.RFMO=='')?new Array():d.RFMO.split(',')
				};
			}
		})
		.defer(d3.csv, "data/RFMOSpecs.csv", function (d) {
			if (!(d.acronym in sharksDB.Collections.RFMOInfoList)) {
				sharksDB.Collections.RFMOInfoList[d.acronym] = {
					name: d.name,
					url: d.url,
					map: d.map.split(',')
				}
			}
		})
		.awaitAll(ready);
	}

};

//		.defer(d3.xml, "http://www.fao.org/figis/geoserver/wms?service=wms&version=1.1.1&request=GetCapabilities", function (d) {
function ready(error, results) {
	if (results) {
		//sharksDB.Collections.faoWMSCapabilitiesXml = results[0]; /* results[0] contains the xml capabilities file */
		/* add a groupCode field to the species model */
		sharksDB.Collections.speciesGroupsCollection.forEach(function (speciesGroups) {
			speciesGroups.get('species').forEach( function (species) {
				sharksDB.Collections.speciesCollection.get(species['alphaCode']).set('groupCode', speciesGroups.get('code'));
			});
		});
		/* Instantiate views, it will create dropdown from keys of the dataset */
		new sharksDB.Views.App();
		new sharksDB.Routers.App();
		Backbone.history.start();
	}
}

function centerModal() {
    $(this).css('display', 'block');
    var $dialog = $(this).find(".modal-dialog");
    var offset = ($(window).height() - $dialog.height()) / 2;
    // Center modal vertically in window
    $dialog.css("margin-top", offset);
}

$('.modal').on('show.bs.modal', centerModal);
$(window).on("resize", function () {
    $('.modal:visible').each(centerModal);
});

