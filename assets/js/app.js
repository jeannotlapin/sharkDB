window.sharksDB = {
	Models:{},
	Views:{},
	Collections:{},

	initialize : function () {
		sharksDB.Collections.countryList = new Array();
		sharksDB.Collections.speciesList = new Object();
		sharksDB.Collections.RFMOList = new Object();
		sharksDB.Collections.countryInfoList = new Array();

		sharksDB.Models.currentState = new sharksDB.Models.state();

		queue(2)
		.defer(d3.csv, "data/countryList.csv", function (d) {
			if (+d.isonumcode != 0 && !isNaN(d.isonumcode)) { /* skip invalid country code */
				if (!(+d.isonumcode in sharksDB.Collections.countryList)) {
					sharksDB.Collections.countryList[+d.isonumcode] = new Array();
				}
				sharksDB.Collections.countryList[+d.isonumcode].push({
					type: d.type,
					title: d.title,
					description: d.description,
					url: d.symbol,
					year: d.year
					});
			}
		})
		.defer(d3.csv, "data/RFMOList.csv", function (d) {
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
		.awaitAll(ready);
	}

};

function ready(error, results) {
	/* Instantiate views, it will create dropdown from keys of the dataset */
	new sharksDB.Views.App();
}

