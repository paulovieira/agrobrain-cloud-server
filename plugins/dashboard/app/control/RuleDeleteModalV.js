// this view will be shown in a modal 

//var $ = require('jquery');
//var _ = require('underscore');
var Mn = require('backbone.marionette');
//var Radio = require('backbone.radio');
var Behaviors = require('../behaviors');



var DeleteRuleModalV = Mn.LayoutView.extend({

    template: require('./rule-delete-modal.html'),

    behaviors: [
        {
            behaviorClass: Behaviors.Modal
        }
    ],

    ui: {
        'confirmBtn': '[data-app-id="confirm-yes"]'
    },

    events: {
    	'click @ui.confirmBtn': 'deleteRule'
    },

    deleteRule: function() {

        this.$('[data-dismiss="modal"]').trigger('click');
    },

});


module.exports = DeleteRuleModalV;


