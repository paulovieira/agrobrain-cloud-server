var Mn = require('backbone.marionette');

var Modal = Mn.Behavior.extend({

    onAttach: function(){

        // at this point the modal's html is already in DOM (in the modal region); 
        // we now show it using bootstrap's javascript api; see:
        // http://getbootstrap.com/javascript/#modals-methods

        var region = this.view._parent;

        // the dom manipulation to hide the modal is completely handled by bootstrap (via the
        // "data-dismiss" attribute and the escape key);
        // but we still have to actually empty the modalRegion, so that the view's events
        // are cleared, etc

        region.$el.one('hidden.bs.modal', function(){
            
            region.empty();
        });

        // 
        // when the modal is visible to the user (will wait for CSS transitions to complete, etc),
        // the 'shown:bs:modal' event is triggered in the modal's container element;
        // we forward this event to the view; this is useful to start other plugins/libs that
        // requires the modal to fully loaded (example: creating an instance of a leaflet map)

        var self = this;
        region.$el.one('shown.bs.modal', function(){
            
            self.view.triggerMethod('shown:bs:modal');
        });

        region.$el.modal('show');
    },

});

module.exports.Modal = Modal;

