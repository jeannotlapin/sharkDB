window.sharksDB = {
	Models:{},
	Views:{},
	Collections:{},
	Map:{},
	Routers:{},
	Mediator: {},

	initialize : function () {
		sharksDB.Models.currentState = new sharksDB.Models.state();

		sharksDB.Mediator = _({}).extend(Backbone.Events); /* used to transfert view triggered events */

		sharksDB.Collections.speciesGroupsCollection =  new sharksDB.Collections.speciesGroups();
		sharksDB.Collections.speciesGroupsCollection.comparator = 'name';
		sharksDB.Collections.speciesCollection =  new sharksDB.Collections.species();
		sharksDB.Collections.speciesCollection.comparator =  'englishName';
		sharksDB.Collections.entitiesCollection =  new sharksDB.Collections.entities();
		sharksDB.Collections.entitiesCollection.comparator = 'acronym';
		sharksDB.Collections.countriesCollection =  new sharksDB.Collections.countries();
		sharksDB.Collections.countriesCollection.comparator = 'name';

		/* this is useless, just to keep track of properties used in the Map object */
		sharksDB.Map.map = undefined;
		sharksDB.Map.path = undefined;
		sharksDB.Map.projection = undefined;
		sharksDB.Map.projectionNatural = undefined;
		sharksDB.Map.projectionPolar = undefined;
		sharksDB.Map.backgroundLoaded = false; /* flag for background map loaded or not */
		sharksDB.Map.EURCountries = ["AUT","BEL","BGR","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL","ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE","GBR", "HRV"]; /* iso_a3 list of members of European union */

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
							},
							error: function () {
								console.log("Error fetching group model "+model.url);
								console.log("Skip this group");
								/* we must proceed anyway otherwise we will get stuck in the await all */
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

		/* fetch from figis server the entities general information (details are fetched on demand) */
		function getEntities (callback) {
			sharksDB.Collections.entitiesCollection.fetch({
				data : {onlyWithMeasures: true}, /* fetch first entities with measures */
				success : function () {
					sharksDB.Collections.entitiesCollection.forEach(function (model) {
						model.set('hasMeasure', true); /* tag them as having measure */
					});
					sharksDB.Collections.entitiesCollection.fetch({ /* now fetch them all */
						success : function () {
							callback(null, sharksDB.Collections.entitiesCollection);
						}
					});
				}
			});
		};

		/* fetch from figis server the countries with PoAs general information (details are fetched on demand) */
		function getCountries (callback) {
			sharksDB.Collections.countriesCollection.fetch({
				data : {onlyWithPoAs: true}, /* fetch countries with measures only */
				success : function () {
					callback(null, sharksDB.Collections.countriesCollection);
				}
			});
		};


		queue(3)
		.defer(getSpecies) /* fetch the groups and species information, all of these are stored in the dedicated collections: speciesCollection and speciesGroupCollection */
		.defer(getCountries) /* fetch the countries list, stored in the dedicated collections: countriesCollection */
		.defer(getEntities) /* fetch the management entities list, stored in the dedicated collections: entitiesCollection */
		.awaitAll(ready);
	}

};

function ready(error, results) {
	if (results) {
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
