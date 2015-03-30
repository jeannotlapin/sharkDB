window.sharksDB = {
	Models:{},
	Views:{},
	Collections:{},
	Map:{},

	initialize : function () {
		sharksDB.Collections.countryList = new Array();
		sharksDB.Collections.countryInfoList = new Array();
		sharksDB.Collections.speciesList = new Object();
		sharksDB.Collections.speciesInfoList = new Object();
		sharksDB.Collections.RFMOList = new Object();
		sharksDB.Collections.RFMOInfoList = new Object();

		sharksDB.Models.currentState = new sharksDB.Models.state();

		/* maps: initialise mapbox token and set to undefined map and rfmoLayer variables */
		L.mapbox.accessToken = 'pk.eyJ1IjoiamVhbm5vdGxhcGluIiwiYSI6Im5qNTl1QXcifQ.fex2-4xMOYtkSgwtkwRGBQ';
		sharksDB.Map.map = undefined; /* this is useless, just to keep track of properties used in the Map object */
		sharksDB.Map.rfmoLayer = undefined;


		queue(2)
		.defer(d3.csv, "data/countryDocList.csv", function (d) {
			if (+d.isonumcode != 0 && !isNaN(d.isonumcode)) { /* skip invalid country code */
				if (!(+d.isonumcode in sharksDB.Collections.countryList)) {
					sharksDB.Collections.countryList[+d.isonumcode] = new Array();
				}
				sharksDB.Collections.countryList[+d.isonumcode].push({
					type: d.type,
					title: d.title,
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
				url: d.symbol,
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
					url: d.symbol,
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
		.defer(d3.csv, "data/speciesSpecs.csv", function (d) {
			if ((!(d.name in sharksDB.Collections.speciesInfoList)) && (d.name != '')) {
				sharksDB.Collections.speciesInfoList[d.name] = {
					family: d.Family,
					EN: d.EN,
					FR: d.FR,
					SP: d.SP,
					description: d.Description,
					factsheet: d.factsheet,
					map: d.map,
					img: d.img
				}
			}
		})

		.awaitAll(ready);
	}

};

function ready(error, results) {
	/* Instantiate views, it will create dropdown from keys of the dataset */
	new sharksDB.Views.App();
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

