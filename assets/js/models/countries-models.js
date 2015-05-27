sharksDB.Models.countries = Backbone.Model.extend({
	defaults: {
		code: '',
		name: '',
		rfbs: [],
		poas: [],
		others: [],
		completed: false,
	},
	idAttribute: "code"
});
