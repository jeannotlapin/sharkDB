sharksDB.Collections.speciesGroups =  Backbone.Collection.extend({
	model: sharksDB.Models.speciesGroups,
	url: 'http://figisapps.fao.org/figis/sharks/rest/groups'
});

sharksDB.Collections.species =  Backbone.Collection.extend({
	model: sharksDB.Models.species,
	url: 'http://figisapps.fao.org/figis/sharks/rest/species'
});
