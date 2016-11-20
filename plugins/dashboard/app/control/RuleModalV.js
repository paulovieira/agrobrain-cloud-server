var $ = require('jquery');
//var _ = require('underscore');
var Mn = require('backbone.marionette');
//var Q = require('q');
//var Radio = require('backbone.radio');
var Behaviors = require('../behaviors');



var RuleModalV = Mn.LayoutView.extend({

    template: require('./rule-modal.html'),

    behaviors: [
        {
            behaviorClass: Behaviors.Modal
        }
    ],

    ui: {
    	'saveBtn': 'button[data-app-id="save"]',
    	'switch': 'input[type="checkbox"][data-toggle="switch"]',
        'hours': 'input[data-app-id="hours"]'
    },

    events: {
    	'click @ui.saveBtn': 'saveRule'
    },

    saveRule: function(){

    	var $switch = this.ui.switch.parent().parent();
    	var status = $switch.bootstrapSwitch('status');
        var hours = this.ui.hours.val();
    	console.log("status: ", status);
        console.log("hours: ", hours);
        this.$('[data-dismiss="modal"]').trigger('click');
    },

    onAttach: function(){
    	
    	// use bootstrapSwitch plugin to transform checkboxes into switches

        this.ui.switch.each(function (){
    	  	
    	    $(this).wrap('<div class="switch" />').parent().bootstrapSwitch();
    	});
    }
});


module.exports = RuleModalV;


