sharksDB.Views.App = Backbone.View.extend({
 
    initialize: function() {
	    new sharksDB.Views.Selector({model : sharksDB.Models.currentState});
	    new sharksDB.Views.CentralPanel({model : sharksDB.Models.currentState});
	    new sharksDB.Views.SidePanel({model : sharksDB.Models.currentState});
    }
});
