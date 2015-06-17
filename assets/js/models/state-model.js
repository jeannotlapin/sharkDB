sharksDB.Models.state = Backbone.Model.extend({
	/* state has 3 variables: country, species and rfmo. Only one shall be != '' */
	defaults: {
		country: '',
		species : '',
		rfmo : ''
	},

	/* on change of model, we may have to fetch data */
	initialize : function () {
		this.on("change", this.fetchModelData);
	},

	fetchModelData : function () {
		if (this.get('country')!='') {
			this.trigger("resetMap", false); /* hide map div */
			var country = this.get('country');
			var countriesModel = sharksDB.Collections.countriesCollection.get(country);
			if (countriesModel.get('completed') == false) { /* we have to fetch the data*/
				countriesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/countries'+'/'+country;
				countriesModel.fetch({
					success : function () {
						countriesModel.set('completed', true);
						sharksDB.Collections.countriesCollection.trigger("update", countriesModel);
					}
				});
			} else {
				sharksDB.Collections.countriesCollection.trigger("update", countriesModel);
			}
		}

		if (this.get('species')!='') {
			var species = this.get('species');
			this.trigger("resetMap", false); /* just hide the map for now, it may be display if needed after fetching the informations */
			if (!isNaN(+species)) { /* this is a species group nothing to be fetch */
				sharksDB.Collections.speciesGroupsCollection.trigger("update", sharksDB.Collections.speciesGroupsCollection.get(species));
			} else { /* this is not a species group : we may fetch the complete information */
				var speciesModel = sharksDB.Collections.speciesCollection.get(species);
				if (speciesModel.get('completed') == false) { /* we have to fetch the data*/
					speciesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/species'+'/'+species;
					speciesModel.fetch({
						success : function () {
							speciesModel.set('completed', true);
							sharksDB.Collections.speciesCollection.trigger("update", speciesModel);
						}
					});
				} else {
					sharksDB.Collections.speciesCollection.trigger("update", speciesModel);
				}
			}
		}

		if (this.get('rfmo')!='') {
			var rfmo = this.get('rfmo');
			var entitiesModel = sharksDB.Collections.entitiesCollection.get(rfmo);
			this.trigger("resetMap", true, entitiesModel); /* load map with area, members country will be added later when available */
			if (entitiesModel.get('completed') == false) { /* we have to fetch the data*/
				entitiesModel.url =  'http://figisapps.fao.org/figis/sharks/rest/managemententities'+'/'+rfmo;
				entitiesModel.fetch({
					success : function () {
						entitiesModel.set('completed', true);
						sharksDB.Collections.entitiesCollection.trigger("update", entitiesModel);
					}
				});
			} else {
				sharksDB.Collections.entitiesCollection.trigger("update", entitiesModel);
			}
		}
	}
});
