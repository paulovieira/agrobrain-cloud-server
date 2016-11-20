var $ = require('jquery');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Chartist = require('chartist');

var RuleModalV = require('./RuleModalV');
var RuleDeleteModalV = require('./RuleDeleteModalV');
var RulesC = require('../_entities/RulesC');

var AlertModalV = require('./AlertModalV');
var AlertDeleteModalV = require('./AlertDeleteModalV');
var AlertsC = require('../_entities/AlertsC');

var PivotsC = require('../_entities/PivotsC');


var ControlV = Mn.LayoutView.extend({

    initialize: function(options){

        // data for collections comes from the initial payload

        var pivotsC = new PivotsC(ctx.pivots);
        this.model = pivotsC.findWhere({ code: options.request.params.client }); 

        if(this.model.get('on')){
            this.model.set('stateText', 'Ligado');
            this.model.set('stateColor', 'green');
        }
        else{
            this.model.set('stateText', 'Desligado');
            this.model.set('stateColor', 'orange');
        }
        this.model.set('meteo', ctx.meteo);

        this.model.set('rulesC', new RulesC(ctx.rules));
        this.model.set('alertsC', new AlertsC(ctx.alerts));

    },

    template: require('./control.html'),

    ui: {
        'charts': 'div[data-pivot-chart="true"]',
        'switch': 'input[type="checkbox"][data-toggle="switch"]',
        'newRuleBtn': '#new-rule',
        'deleteRuleBtn': '[data-delete-rule="true"]',
        'editRuleBtn': '[data-edit-rule="true"]',

        'newAlertBtn': '#new-alert',
        'deleteAlertBtn': '[data-delete-alert="true"]',
        'editAlertBtn': '[data-edit-alert="true"]',

        'turnOnBtn': 'button[data-app-id="turn-on"]',
        'turnOffBtn': 'button[data-app-id="turn-off"]'
    },

    events: {
        'click @ui.newRuleBtn': 'showNewRuleModal',
        'click @ui.editRuleBtn': 'showEditRuleModal',
        'click @ui.deleteRuleBtn': 'showDeleteRuleModal',

        'click @ui.newAlertBtn': 'showNewAlertModal',
        'click @ui.deleteAlertBtn': 'showDeleteAlertModal',
        'click @ui.editAlertBtn': 'showEditAlertModal',

        'click @ui.turnOnBtn': 'turnOn',
        'click @ui.turnOffBtn': 'turnOff'
    },

    turnOn: function(){

        this.model.set('on', true);
        this.model.set('timeElapsed', [0, 0]);
        this.model.set('timeElapsedPercentage', 0);
        this.model.set('timeToFinish', [6, 0]);
        this.model.set('stateText', 'Ligado');
        this.model.set('stateColor', 'green');

        this.render();
        this.triggerMethod('attach');
    },

    turnOff: function(){
        this.model.set('on', false);
        this.model.set('timeElapsed', [0, 0]);
        this.model.set('timeElapsedPercentage', 0);
        this.model.set('stateText', 'Desligado');
        this.model.set('stateColor', 'orange');

        this.render();
        this.triggerMethod('attach');
    },

    showNewRuleModal: function(){

        var ruleModalV = new RuleModalV();
        this.showModal(ruleModalV);
    },

    showEditRuleModal: function(e){

        e.preventDefault();

        var $el = $(e.currentTarget);
        var ruleId = $el.data('rule-id');

        var ruleM = this.model.get('rulesC').get(ruleId);
        var ruleModalV = new RuleModalV({
            model: ruleM
        });

        this.showModal(ruleModalV);
    },

    showDeleteRuleModal: function(e){

        e.preventDefault();

        var $el = $(e.currentTarget);
        var ruleId = $el.data('rule-id');

        var ruleM = this.model.get('rulesC').get(ruleId);
        var ruleDeleteModalV = new RuleDeleteModalV({
            model: ruleM
        });

        this.showModal(ruleDeleteModalV);
    },

    showNewAlertModal: function(){

        var alertModalV = new AlertModalV();
        this.showModal(alertModalV);
    },


    showEditAlertModal: function(e){

        e.preventDefault();

        var $el = $(e.currentTarget);
        var alertId = $el.data('alert-id');

        var alertM = this.model.get('alertsC').get(alertId);

        var alertModalV = new AlertModalV({
            model: alertM
        });

        this.showModal(alertModalV);
    },

    showDeleteAlertModal: function(e){

        e.preventDefault();

        var $el = $(e.currentTarget);
        var alertId = $el.data('alert-id');

        var alertM = this.model.get('alertsC').get(alertId);
        var alertDeleteModalV = new AlertDeleteModalV({
            model: alertM
        });

        this.showModal(alertDeleteModalV);
    },

    showModal: function(view){

        var modalR = Radio.channel('public').request('modalR');
        modalR.show(view);
    },

    onAttach: function(){

        this.ui.charts.easyPieChart({
            lineWidth: 6,
            size: 160,
            scaleColor: false,
            trackColor: 'rgba(255,255,255,.25)',
            barColor: '#FFFFFF',
            animate: ({duration: 5000, enabled: true})

        });

        //debugger;
        // activate chartist

        var data = {
            labels: [0,3,6,9,12,15,18,21],
            series: this.model.get('meteo').temperatures
        };

        var options = {
            fullWidth: true,
            height: "245px",
            chartPadding: {
                right: 40
            }
        };

        new Chartist.Line('#temperatures', data, options);

        // transform checkboxes into switches
//debugger;
  //      this.ui.switch.first().wrap('<div class="switch" />').parent().bootstrapSwitch();

        this.ui.switch.each(function (){
            
            $(this).wrap('<div class="switch" />').parent().bootstrapSwitch();
        });


    }


});

module.exports = ControlV;


