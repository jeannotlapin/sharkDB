sharksDB.Models.state = Backbone.Model.extend({
	/* state has 3 variables: country, species and rfmo. Only one shall be != '' */
	defaults: {
		country: '',
		species : '',
		rfmo : ''
	}
});
