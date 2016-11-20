var $ = require('jquery');
var _ = require('underscore');
var Mn = require('backbone.marionette');
//var Q = require('q');
//var Radio = require('backbone.radio');
var Behaviors = require('../behaviors');
//var Utils = require('../utils');


var AlertModalV = Mn.LayoutView.extend({

    template: require('./alert-modal.html'),

    behaviors: [
        {
            behaviorClass: Behaviors.Modal
        }
    ],

    ui: {
        'action': 'select[data-app-id="action"]',
    	'saveBtn': 'button[data-app-id="save"]',
    	'switch': 'input[type="checkbox"][data-toggle="switch"]',
        'contact': 'input[data-app-id="contact"]',
        'contactLabel': 'label[data-app-id="contact-label"]'
    },

    events: {
        'change @ui.action': 'onChangeAction', 
    	'click @ui.saveBtn': 'saveAlert'
    },

    onChangeAction: function(e){

        var action = $(e.target).val();
        this.updateContactLabel(action);
    },

    updateContactLabel: function (action){

        if(action === 'sms'){
            this.ui.contactLabel.html('Número de telefone');
        }
        else if(action === 'email'){
            this.ui.contactLabel.html('Endereço de email');
        }
        else{
            throw new Error('invalid action');
        }
    },

    saveAlert: function(){

        var action = this.ui.action.val();
        var contact = this.ui.contact.val();
        var $switch = this.ui.switch.parent().parent();
        var status = $switch.bootstrapSwitch('status');
        console.log("action: ", action);
        console.log("contact: ", contact);
        console.log("status: ", status);
        this.$('[data-dismiss="modal"]').trigger('click');
    },

    onAttach: function(){
    	
    	// transform checkboxes into switches

    	this.ui.switch.each(function (){
    	  	
    	    $(this).wrap('<div class="switch" />').parent().bootstrapSwitch();
    	});

        // make sure the label is correct
        if (this.model){
            var action = this.model.get('action');
            this.updateContactLabel(action);
        }
    }
});


module.exports = AlertModalV;


