sharksDB.Views.CentralPanel = Backbone.View.extend({
		el : '#centralPanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(sharksDB.Collections.entitiesCollection, 'update', this.renderEntities);
			this.listenTo(sharksDB.Collections.countriesCollection, 'update', this.renderCountries);
			this.listenTo(sharksDB.Collections.speciesCollection, 'update', this.renderSpecies);
			this.listenTo(sharksDB.Collections.speciesGroupsCollection, 'update', this.renderSpeciesGroup);
		},

		events : {
			"click td.doclink":"updateCurrentState"
		},

		countryTemplate : _.template($('#countrySelectedDocuments').html()),
		speciesTemplate : _.template($('#speciesSelectedDocuments').html()),
		rfmoTemplate : _.template($('#rfmoSelectedDocuments').html()),

		updateCurrentState : function (e) {
			this.model.set({country: ('country' in e.target.dataset)?e.target.dataset.country:'',
					rfmo: ('rfmo' in e.target.dataset)?e.target.dataset.rfmo:'',
					species: ('species' in e.target.dataset)?e.target.dataset.species:''});
		},

		renderCountries : function (countriesModel) {
			$('#displayTitle').html(countriesModel.get('name'));
			this.$el.html(this.countryTemplate({poasArray: countriesModel.get('poas').sort(poayearSort), othersArray: countriesModel.get('others').sort(yearSort)}));
			this.$el.show();
			return this;
		},

		renderEntities : function (entitiesModel) {
			$('#displayTitle').html("<a target='_blank' href='"+entitiesModel.get('webSite')+"'>"+entitiesModel.get('name')+"</a>");
			this.$el.html(this.rfmoTemplate({dataArray: entitiesModel.get('measures').sort(yearSort)}));
			this.$el.show();
			return this;
		},

		renderSpecies : function (speciesModel) {
			$('#displayTitle').html(speciesModel.get('englishName'));
			this.$el.html(this.speciesTemplate({dataArray: speciesModel.get('measures').sort(yearSort)}));
			this.$el.show();
			return this;
		},

		renderSpeciesGroup : function (speciesGroupModel) {
			$('#displayTitle').html(speciesGroupModel.get('name'));
			this.$el.html(this.speciesTemplate({dataArray: speciesGroupModel.get('measures').sort(yearSort)}));
			this.$el.show();
			return this;
		}
});

/* sort by most recent to less recent and alphabetical order of title for same year docs */
function yearSort(a,b) {
	 if (+a.year>+b.year) return -1;
	 if (+a.year<+b.year) return 1;
	 if (a.title>b.title) return 1;
	 return -1;
}
function poayearSort(a,b) {
	 if (+a.poAYear>+b.poAYear) return -1;
	 if (+a.poAYear<+b.poAYear) return 1;
	 if (a.title>b.title) return 1;
	 return -1;
}


