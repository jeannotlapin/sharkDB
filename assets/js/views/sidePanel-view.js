sharksDB.Views.SidePanel = Backbone.View.extend({
		el : '#sidePanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'speciesModelUpdated', this.render); /* we may trigger an update when data has been loaded */
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
				/* render country membership  */
				if (sharksDB.Collections.countryInfoList[this.model.get('country')].rfmo.size==0) {
					this.$el.html('<div class="panel-heading"><h3 class="panel-title">Member of</h3></div>');
				} else {
					this.$el.html(this.countryTemplate({title: 'Member of', dataArray: sharksDB.Collections.countryInfoList[this.model.get('country')].rfmo}));
				}
				this.$el.show();
			}

			if (this.model.get('species')!='') {
				var species = this.model.get('species');

				if (!isNaN(+species)) { /* this is a species group, data has already been fetched at loading, just display the table */
					var speciesGroupModel = sharksDB.Collections.speciesGroupsCollection.get(species);
					this.$el.html(this.familyTemplate({title: speciesGroupModel.get('name'), data: speciesGroupModel.get('species')}));
					$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/groups/"+speciesGroupModel.get('name').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
				} else { /* this is not a species group, check data his here (fetched by central view render) */
					var speciesModel = sharksDB.Collections.speciesCollection.get(species);
					if (speciesModel.get('completed') == true) { /* if we don't have the data just do nothing */
						this.$el.html(this.speciesTemplate({title: speciesModel.get('scientificName'), data: speciesModel.attributes}));
						$('#speciesImg').html("<img class='img-responsive' src='http://figisapps.fao.org/fishery/ipoa-sharks/measures/images/species/"+speciesModel.get('scientificName').toLowerCase().replace(/ /g, "_")+"-drawing-medium.png'/>");
					}
				}
				this.$el.show();
			}

			if (this.model.get('rfmo')!='') {
				var rfmo = this.model.get('rfmo');
				/* render rfmo members(with links to the one having documents)  */
				var memberList = new Array(); /* extract member list : {name: , isonumcode: , link: }*/
				sharksDB.Collections.countryInfoList.forEach(function(d,k){
						if ($.inArray(rfmo, d.rfmo) != -1) {
							memberList.push({name : d.name, isonumcode:k, countryname: sharksDB.Collections.countryInfoList[k].name, link: (k in sharksDB.Collections.countryList)?1:0});
						}});
				this.$el.html(this.rfmoTemplate({title: 'Members', dataArray: memberList.sort(function(a,b){return (a.name<b.name)?-1:1})}));
				this.$el.show();
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
