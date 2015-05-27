sharksDB.Views.Selector = Backbone.View.extend({
		el : '#navSelector',

		events : {
			"click a.ddpick" : "updateCurrentState",
			"mouseover ul.speciesGroups li a" : "highlightMembers",
			"mouseout ul.speciesGroups li a" : "unhighlightMembers",
			"mouseover ul.species li a" : "highlightGroup",
			"mouseout ul.species li a" : "unhighlightGroup"
		},

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);

			var ddTemplate = _.template($('#selectorDropdown').html());
			var ddEntitiesTemplate = _.template($('#selectorDropdownEntities').html());
			var ddThumbnailTemplate = _.template($('#selectorDropdownThumbnail').html());

			sharksDB.Collections.countriesCollection.models.forEach(function(model) {
				this.$('#countryDropdown').append(ddTemplate({type:'country', data:model.get('code'), name:model.get('name')}));
			});

			sharksDB.Collections.entitiesCollection.models.forEach(function(model) {
				this.$('#RFMODropdown').append(ddEntitiesTemplate({type:'rfmo', data:model.get('acronym'), name:model.get('acronym'), hasMeasure:model.get('hasMeasure')}));
			});

			sharksDB.Collections.speciesGroupsCollection.models.forEach(function(model) {
				this.$('#speciesGroupsDropdown').append(ddThumbnailTemplate({type:'species', data:model.get('code'), name:model.get('name'), thumbnailPath:"groups/"+model.get('name').toLowerCase().replace(/ /g, "_")+"-drawing-small.jpg"}));
			});
			if (sharksDB.Collections.speciesGroupsCollection.models.length%2==1) {
				this.$('#speciesGroupsDropdown').append("<li> </li>");
			}
			sharksDB.Collections.speciesCollection.models.forEach(function(model) {
				this.$('#speciesListDropdown').append(ddThumbnailTemplate({type:'species', data:model.get('alphaCode'), name:model.get('englishName'), thumbnailPath:"species/"+model.get('scientificName').toLowerCase().replace(/ /g, "_")+"-drawing-small.jpg"}));
			});
			if (sharksDB.Collections.speciesCollection.models.length%2==1) {
				this.$('#speciesListDropdown').append("<li> </li>");
			}
		},

		render : function() {
			/* get sub-elements country/species/rfmo and set their content */
			this.$('#currentCountry').html((this.model.get('country')=='')?'Country':sharksDB.Collections.countriesCollection.get(this.model.get('country')).get('name'));
			/* for species, we must check if it is a group or a species */
			if (this.model.get('species')=='') {
				this.$('#currentSpeciesGroup').html('Species');
			} else {
				if (isNaN(+this.model.get('species'))) { /* it's not a number -> species */
					this.$('#currentSpeciesGroup').html(sharksDB.Collections.speciesCollection.get(this.model.get('species')).get('englishName'));
				} else { /* it is a number -> group code */
					this.$('#currentSpeciesGroup').html(sharksDB.Collections.speciesGroupsCollection.get(this.model.get('species')).get('name'));
				}
			}
			this.$('#currentRFMO').html((this.model.get('rfmo')=='')?'Entities':this.model.get('rfmo'));

			return this;
		},

		updateCurrentState : function (e) {
			this.model.set({country: ('country' in e.target.dataset)?e.target.dataset.country:'',
					rfmo: ('rfmo' in e.target.dataset)?e.target.dataset.rfmo:'',
					species: ('species' in e.target.dataset)?e.target.dataset.species:''});
		},

		highlightMembers : function (e) {
			sharksDB.Collections.speciesGroupsCollection.get(e.target.dataset.species).get('species').forEach(function (d) {
				$('*[data-species="'+d.alphaCode+'"]').addClass('selectedSpecies');
			}
			);
		},

		unhighlightMembers : function (e) {
			sharksDB.Collections.speciesGroupsCollection.get(e.target.dataset.species).get('species').forEach(function (d) {
				$('*[data-species="'+d.alphaCode+'"]').removeClass('selectedSpecies');
			}
			);
		},

		highlightGroup : function (e) {
			var highlightGroupCode = sharksDB.Collections.speciesCollection.get(e.target.dataset.species).get('groupCode');
			if (highlightGroupCode!=0) {
				$('*[data-species="'+highlightGroupCode+'"]').addClass('selectedSpecies');
			}
		},

		unhighlightGroup : function (e) {
			var highlightGroupCode = sharksDB.Collections.speciesCollection.get(e.target.dataset.species).get('groupCode');
			if (highlightGroupCode!=0) {
				$('*[data-species="'+highlightGroupCode+'"]').removeClass('selectedSpecies');
			}
		}

});
