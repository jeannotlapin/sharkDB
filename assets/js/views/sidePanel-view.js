sharksDB.Views.SidePanel = Backbone.View.extend({
		el : '#sidePanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'modelUpdated', this.render); /* we may trigger an update when data has been loaded */
		},

		events : {
			"click li.activeCountry" : "toCountryView",
			"click li.activeRFMO" : "toRFMOView",
			"click li.activeSpecies" : "toSpeciesView"
		},

		countryTemplate : _.template($('#countrySidePanel').html()),
		speciesTemplate : _.template($('#speciesSidePanel').html()),
		familyTemplate : _.template($('#familySidePanel').html()),
		rfmoTemplate : _.template($('#rfmoSidePanel').html()),

		render : function () {
			this.$el.hide();
			if (this.model.get('country')!='') {
				var country = this.model.get('country');
				var countriesModel = sharksDB.Collections.countriesCollection.get(country);
				if (countriesModel.get('completed') == true) { /* if we don't have the data just do nothing */
					/* render country memberships (with links to the one having documents)  */
					this.$el.html(this.countryTemplate({title: 'Member of', dataArray: countriesModel.get('rfbs')}));
					this.$el.show();
					this.$el.show();
				}
			}

			if (this.model.get('species')!='') {
				var species = this.model.get('species');

				if (!isNaN(+species)) { /* this is a species group, data has already been fetched at loading, just display the table */
					var speciesGroupModel = sharksDB.Collections.speciesGroupsCollection.get(species);
					this.$el.html(this.familyTemplate({title: speciesGroupModel.get('name'), data: speciesGroupModel.get('species')}));
					$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/groups/"+speciesGroupModel.get('name').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
					this.$el.show();
				} else { /* this is not a species group, check data his here (fetched by central view render) */
					var speciesModel = sharksDB.Collections.speciesCollection.get(species);
					if (speciesModel.get('completed') == true) { /* if we don't have the data just do nothing */
						this.$el.html(this.speciesTemplate({title: speciesModel.get('scientificName'), data: speciesModel.attributes}));
						$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/species/"+speciesModel.get('scientificName').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
						this.$el.show();
					}
				}
			}

			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				var entitiesModel = sharksDB.Collections.entitiesCollection.get(rfmo);
				if (entitiesModel.get('completed') == true) { /* if we don't have the data just do nothing */
					/* render rfmo members(with links to the one having documents)  */
					this.$el.html(this.rfmoTemplate({title: 'Members', dataArray: entitiesModel.get('members')}));
					this.$el.show();
				}
			}
			return this;
		},

		toCountryView : function (e) {
			this.model.set({country: e.target.dataset.countryid, rfmo: '', species: ''});
		},

		toSpeciesView : function (e) {
			this.model.set({species: e.target.dataset.species, rfmo: '', country: ''});
		},

		toRFMOView : function (e) {
			this.model.set({rfmo: e.target.dataset.rfmo, country: '', species: ''});
		}
});
