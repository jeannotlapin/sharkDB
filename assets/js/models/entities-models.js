sharksDB.Models.entities = Backbone.Model.extend({
	defaults: {
		acronym: '',
		name: '',
		imageId: '',
		website: '',
		members: [],
		measures: [],
		completed: false,
		hasMeasure: false
	},
	idAttribute: "acronym"
});
