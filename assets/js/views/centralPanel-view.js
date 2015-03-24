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
				var rfmo = this.model.get('rfmo');
				/* render rfmo table  */
				this.$el.html(this.rfmoTemplate({dataArray: sharksDB.Collections.RFMOList[rfmo].sort(yearSort)}));
				/* render rfmo map */
				this.$el.append("<div id='map'></div>");
				this.$el.show(); /* display the map div before loading the map to get correct dimension */
				L.mapbox.accessToken = 'pk.eyJ1IjoiamVhbm5vdGxhcGluIiwiYSI6Im5qNTl1QXcifQ.fex2-4xMOYtkSgwtkwRGBQ';
				var map = L.mapbox.map('map', 'jeannotlapin.lcld15nl').setView([45, 0], 2);
				var ue = ($.inArray(rfmo, sharksDB.Collections.countryInfoList[1001].rfmo) != -1); /* UE have the arbotrary 1001 iso code in the DB */
				var featureLayer = L.mapbox.featureLayer()
				    .loadURL('data/geodata/countries110.json')
				    .setFilter(function (feature,layer) {
					    /* check country */
					    if (+feature.properties.iso_n3 in sharksDB.Collections.countryInfoList && sharksDB.Collections.countryInfoList[+feature.properties.iso_n3] != undefined) {
						    if ($.inArray(rfmo, sharksDB.Collections.countryInfoList[+feature.properties.iso_n3].rfmo) != -1) {
							    return true
						    }
					    }
					    /* check UE */
					    if (ue==true && feature.properties.UE==1) { /* geojson has been modified to include a UE property set to 1 for UE members */
						    return true;
					    }
					    return false;
				    })
				    .addTo(map);
				featureLayer.on('ready', function() {
					featureLayer.setStyle({opacity: 0.8, fillOpacity:0.5, color:'#3db5b8', fillColor:'#3db5b8'});
				});



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

