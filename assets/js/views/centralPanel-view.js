sharksDB.Views.CentralPanel = Backbone.View.extend({
		el : '#centralPanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);
		},

		events : {
			"click td.doclink":"updateCurrentState"
		},

		countryTemplate : _.template($('#countrySelectedDocuments').html()),
		speciesTemplate : _.template($('#speciesSelectedDocuments').html()),
		rfmoTemplate : _.template($('#rfmoSelectedDocuments').html()),

		render : function () {
			this.$el.hide();
			if (this.model.get('country')!='') {
				/* render country table  */
				this.$el.html(this.countryTemplate({dataArray: sharksDB.Collections.countryList[this.model.get('country')].sort(yearSort)}));
				this.$el.show();
			}
			if (this.model.get('species')!='') {
				/* render species table  */
				this.$el.html(this.speciesTemplate({dataArray: sharksDB.Collections.speciesList[this.model.get('species')].sort(yearSort)}));
				this.$el.show();
			}
			if (this.model.get('rfmo')!='') {
				/* render rfmo table  */
				this.$el.html(this.rfmoTemplate({dataArray: sharksDB.Collections.RFMOList[this.model.get('rfmo')].sort(yearSort)}));
				/* render rfmo map */
				this.$el.append("<div id='map'></div>");
				this.$el.show(); /* display the map div before loading the map to get correct dimension */
				L.mapbox.accessToken = 'pk.eyJ1IjoiamVhbm5vdGxhcGluIiwiYSI6Im5qNTl1QXcifQ.fex2-4xMOYtkSgwtkwRGBQ';
				var map = L.mapbox.map('map', 'jeannotlapin.lcld15nl').setView([45, 0], 2);
			}
			return this;
		},

		updateCurrentState : function (e) {
			this.model.set({country: ('country' in e.target.dataset)?e.target.dataset.country:'',
					rfmo: ('rfmo' in e.target.dataset)?e.target.dataset.rfmo:'',
					species: ('species' in e.target.dataset)?e.target.dataset.species:''});
		}
});

/* sort by most recent to less recent and alphabetical order of title for same year docs */
function yearSort(a,b) {
	 if (+a.year>+b.year) return -1;
	 if (+a.year<+b.year) return 1;
	 if (a.title>b.title) return 1;
	 return -1;
}

