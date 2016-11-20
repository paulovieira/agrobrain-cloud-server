// this view will be shown in a modal 

//var $ = require('jquery');
//var _ = require('underscore');
var Mn = require('backbone.marionette');
//var Q = require('q');
//var Radio = require('backbone.radio');
var Behaviors = require('../behaviors');
//var Utils = require('../utils');


var DeleteRuleModalV = Mn.LayoutView.extend({

    template: require('./alert-delete-modal.html'),

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

    deleteRule: function(){

        debugger;
        // delete rule

        this.$('[data-dismiss="modal"]').trigger('click');

    },

});


module.exports = DeleteRuleModalV;
