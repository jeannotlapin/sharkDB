sharksDB.Models.speciesGroups = Backbone.Model.extend({
	defaults: {
		code: 0,
		name : '',
		species : [],
		measures : []
	},
	idAttribute: "code"
});

sharksDB.Models.species = Backbone.Model.extend({
	defaults: {
		alphaCode: '',
		scientificName: '',
		englishName: '',
		hasMeasures: false,
		groupCode: 0,
		completed: false
	},
	idAttribute: "alphaCode"
});
