sharksDB.Views.SidePanel = Backbone.View.extend({
		el : '#sidePanel',

		initialize: function (options) {
			this.options = options || {};
			this.listenTo(this.model, 'change', this.render);
		},

		events : {
			"click li.activeCountry" : "toCountryView",
			"click li.activeRFMO" : "toRFMOView"
		},

		countryTemplate : _.template($('#countrySidePanel').html()),
		speciesTemplate : _.template($('#speciesSidePanel').html()),
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
			}
			if (this.model.get('species')!='') {
				/* render species distribution  */
				this.$el.html(this.speciesTemplate({title: 'Distribution'}));
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
			}
			this.$el.show();
			return this;
		},

		toCountryView : function (e) {
			this.model.set({country: e.target.dataset.countryid, rfmo: '', species: ''});
		},

		toRFMOView : function (e) {
			this.model.set({rfmo: e.target.dataset.rfmo, country: '', species: ''});
		}
});
