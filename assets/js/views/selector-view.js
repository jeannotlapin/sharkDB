sharksDB.Views.Selector = Backbone.View.extend({
		el : '#navSelector',

		events : {
			"click a.ddpick" : "updateCurrentState"
		},

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);

			var ddTemplate = _.template($('#selectorDropdown').html());

			/* at init, create the dropdown from the data retrieved from CVS : this object is instanciated after the CVS load/parse */
			Object.keys(sharksDB.Collections.countryList).sort(function (a,b) { /* sort the country by alphabetical order on name retrieved in the countryInfoList */
				return ((sharksDB.Collections.countryInfoList[a].name < sharksDB.Collections.countryInfoList[b].name)?-1:1);})
				.forEach(function (d) {
					this.$('#countryDropdown').append(ddTemplate({type:'country', data:+d, name:sharksDB.Collections.countryInfoList[d].name}));
				});

			Object.keys(sharksDB.Collections.speciesList).sort(function (a,b) { /* sort the species by alphabetical order on english name retrieved in the speciesInfoList */
				return ((sharksDB.Collections.speciesInfoList[a].EN < sharksDB.Collections.speciesInfoList[b].EN)?-1:1);}).forEach(function(d) {
				this.$('#speciesDropdown').append(ddTemplate({type:'species', data:d, name:sharksDB.Collections.speciesInfoList[d].EN}));
				});

			Object.keys(sharksDB.Collections.RFMOList).sort().forEach(function(d) {
				this.$('#RFMODropdown').append(ddTemplate({type:'rfmo', data:d, name:d}));
				});
		},

		render : function() {
			/* get sub-elements country/species/rfmo and set their content */
			this.$('#currentCountry').html((this.model.get('country')=='')?'Country':sharksDB.Collections.countryInfoList[this.model.get('country')].name);
			this.$('#currentSpecies').html((this.model.get('species')=='')?'Species':sharksDB.Collections.speciesInfoList[this.model.get('species')].EN);
			this.$('#currentRFMO').html((this.model.get('rfmo')=='')?'RFMO':this.model.get('rfmo'));

			/* title reflects the selection */
			if ((this.model.get('country')!='')) {
				$('#displayTitle').html(sharksDB.Collections.countryInfoList[this.model.get('country')].name);
			} else if ((this.model.get('species')!='')) {
				$('#displayTitle').html(sharksDB.Collections.speciesInfoList[this.model.get('species')].EN);
			} else if ((this.model.get('rfmo')!='')) {
				$('#displayTitle').html("<a target='_blank' href='"+sharksDB.Collections.RFMOInfoList[this.model.get('rfmo')].url+"'>"+sharksDB.Collections.RFMOInfoList[this.model.get('rfmo')].name+"</a>");
			} else {
				$('#displayTitle').html('');
			}

			return this;
		},

		updateCurrentState : function (e) {
			this.model.set({country: ('country' in e.target.dataset)?e.target.dataset.country:'',
					rfmo: ('rfmo' in e.target.dataset)?e.target.dataset.rfmo:'',
					species: ('species' in e.target.dataset)?e.target.dataset.species:''});
		}

});
