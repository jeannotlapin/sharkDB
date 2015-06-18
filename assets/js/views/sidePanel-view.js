sharksDB.Views.SidePanel = Backbone.View.extend({
		el : '#sidePanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(sharksDB.Collections.entitiesCollection, 'update', this.entitiesUpdate);
			this.listenTo(sharksDB.Collections.countriesCollection, 'update', this.renderCountries);
			this.listenTo(sharksDB.Collections.speciesCollection, 'update', this.renderSpecies);
			this.listenTo(sharksDB.Collections.speciesGroupsCollection, 'update', this.renderSpeciesGroup);
		},

		events : {
			"click li.activeCountry" : "toCountryView",
			"click li.activeRFMO" : "toRFMOView",
			"click li.activeSpecies" : "toSpeciesView",
			"mouseover li.rfmoMembers" : "highLightCountry",
			"mouseout li.rfmoMembers" : "unHighLightCountry"
		},

		countryTemplate : _.template($('#countrySidePanel').html()),
		speciesTemplate : _.template($('#speciesSidePanel').html()),
		familyTemplate : _.template($('#familySidePanel').html()),
		rfmoTemplate : _.template($('#rfmoSidePanel').html()),

		renderCountries : function (countriesModel) {
			/* render country memberships (with links to the one having documents)  */
			this.$el.html(this.countryTemplate({title: 'Member of', dataArray: countriesModel.get('rfbs')}));
			this.$el.show();
			return this;
		},

		entitiesUpdate : function (entitiesModel) {
			/* render rfmo members(with links to the one having documents)  */
			this.$el.html(this.rfmoTemplate({title: 'Members', dataArray: entitiesModel.get('members')}));
			this.$el.show();
			return this;
		},

		renderSpecies : function (speciesModel) {
			this.$el.html(this.speciesTemplate({title: speciesModel.get('scientificName'), data: speciesModel.attributes}));
			$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/species/"+speciesModel.get('scientificName').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
			this.$el.show();
			return this;
		},

		renderSpeciesGroup : function (speciesGroupModel) {
			this.$el.html(this.familyTemplate({title: speciesGroupModel.get('name'), data: speciesGroupModel.get('species')}));
			$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/groups/"+speciesGroupModel.get('name').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
			this.$el.show();
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
		},

		highLightCountry: function (e) {
			var countryId = e.target.dataset.countryid;
			var countriesId = [];
			if (countryId == 'EUR') {
				countriesId = sharksDB.Map.EURCountries;
			} else {
				countriesId = [countryId];
			}

			countriesId.forEach( function (d) {
				var focusedSVGEl = $('#'+d);
				if (focusedSVGEl.length > 0) {
					var currentClass = focusedSVGEl.attr("class");
					focusedSVGEl.attr("class", currentClass+" focusedCountry");
				}
			});
		},

		unHighLightCountry: function (e) {
			var countryId = e.target.dataset.countryid;
			var countriesId = [];
			if (countryId == 'EUR') {
				countriesId = sharksDB.Map.EURCountries;
			} else {
				countriesId = [countryId];
			}

			countriesId.forEach( function (d) {
				var focusedSVGEl = $('#'+d);
				if (focusedSVGEl.length > 0) {
					var currentClass = focusedSVGEl.attr("class");
					focusedSVGEl.attr("class", currentClass.replace(" focusedCountry",''));
				}
			});
		}
});
