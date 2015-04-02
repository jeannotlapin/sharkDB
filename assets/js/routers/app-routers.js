sharksDB.Routers.App = Backbone.Router.extend({

  routes: {
	"": "reset",
	"country/:id": "country",
	"rfmo/:id": "rfmo",
	"species/:id": "species"
  },

  initialize: function() {
    sharksDB.Models.currentState.on("change", this.updateNav, this);
  },

  reset : function(){
	sharksDB.Models.currentState.set({country: '', rfmo: '', species: ''});
  },

  country: function(id) {
	sharksDB.Models.currentState.set({country: id, rfmo: '', species: ''});
  },

  rfmo: function(id) {
	sharksDB.Models.currentState.set({country: '', rfmo: id, species: ''});
  },

  species: function(id) {
	sharksDB.Models.currentState.set({country: '', rfmo: '', species: id});
  },

  updateNav: function() {
	  if (sharksDB.Models.currentState.get('country') != '') {
	  	  this.navigate('country/'+sharksDB.Models.currentState.get('country'), {trigger: false});
	  } else if (sharksDB.Models.currentState.get('rfmo') != '') {
	  	  this.navigate('rfmo/'+sharksDB.Models.currentState.get('rfmo'), {trigger: false});
	  } else if (sharksDB.Models.currentState.get('species') != '') {
	  	  this.navigate('species/'+sharksDB.Models.currentState.get('species'), {trigger: false});
	  } else {
		  this.navigate('', {trigger: false});
	  }
  }

});
