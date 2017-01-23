var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Chartist = require('chartist');
var Q = require('q');
var Moment = require('moment');


var RuleModalV = require('./RuleModalV');
var RuleDeleteModalV = require('./RuleDeleteModalV');
var RulesC = require('../_entities/RulesC');

var AlertModalV = require('./AlertModalV');
var AlertDeleteModalV = require('./AlertDeleteModalV');
var AlertsC = require('../_entities/AlertsC');

var PivotsC = require('../_entities/PivotsC');


var internals = {};
internals.measurementsT = [];
internals.measurementsH = [];

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
        'turnOffBtn': 'button[data-app-id="turn-off"]',

        'startDate': 'input#start-date',
        'endDate': 'input#end-date',
        'sensorSelect': 'select#sensor_id'
    },

    events: {
        'click @ui.newRuleBtn': 'showNewRuleModal',
        'click @ui.editRuleBtn': 'showEditRuleModal',
        'click @ui.deleteRuleBtn': 'showDeleteRuleModal',

        'click @ui.newAlertBtn': 'showNewAlertModal',
        'click @ui.deleteAlertBtn': 'showDeleteAlertModal',
        'click @ui.editAlertBtn': 'showEditAlertModal',

        'click @ui.turnOnBtn': 'turnOn',
        'click @ui.turnOffBtn': 'turnOff',

        'change @ui.startDate': 'onDateChange',
        'change @ui.endDate': 'onDateChange',
        'click @ui.sensorSelect': 'onSensorChange'
    },

    onDateChange: function(){

        var start = this.ui.startDate.val();
        var end = this.ui.endDate.val();

        if (start && !end){
            var dateEnd = new Date(start);
            dateEnd.setDate(dateEnd.getDate() + 1);
            var end = dateEnd.toISOString().split('T')[0];
            this.ui.endDate.val(end);
        }

        if (!start || !end){
            return;
        }

        var _this = this;

        var dateEnd2 = new Date(end);
        dateEnd2.setHours(1);
        var end2 = dateEnd2.toISOString();

        var p1 = $.ajax({
            url: '/api/v1/measurements-agg',
            data: {
                clientName: 'permalab',
                start: start,
                end: end2,
                timeInterval: 1,
                format: 'json',
                type: 't'
            }
        });

        var p2 = $.ajax({
            url: '/api/v1/measurements-agg',
            data: {
                clientName: 'permalab',
                start: start,
                end: end,
                timeInterval: 1,
                format: 'json',
                type: 'h'
            }
        });


        Q.all([p1, p2])
        .then((data) => {

            internals.measurementsT = data[0];
            internals.measurementsH = data[1];

            var allKeysT = data[0].map(obj => Object.keys(obj));
            allKeysT = _.flatten(allKeysT);
            allKeysT = _.uniq(allKeysT);

            var allKeysH = data[1].map(obj => Object.keys(obj));
            allKeysH = _.flatten(allKeysH);
            allKeysH = _.uniq(allKeysH);

            var html = '<option value="">(none)</option>';

            allKeysT.forEach(key => {

                if(key === 'ts'){ return }

                html += `
                    <option value="${ key }">${ key } (t)</option>
                `;
            });

            allKeysH.forEach(key => {

                if(key === 'ts'){ return }

                html += `
                    <option value="${ key }">${ key } (wp)</option>
                `;
            });

            _this.ui.sensorSelect.html(html);

        })
        .catch((err) => {

            debugger;
        });
    },

    onSensorChange: function(e){

        var sensorIds = this.ui.sensorSelect.val();
        var sensorData = {
            series: []
        };

        sensorIds.forEach(function(sid){

            if (!sid) {
                return;
            }

            var temp = {
                name: sid,
                data: []
            };

            // water potential
            if (sid.indexOf('6e:e0:f5:5:f0:f8') === 0){

                internals.measurementsH.forEach(function(obj, i){

                    var y = obj[sid] || null;
                    
                    if (_.isNumber(y)) {
                        y = y / 146.87;
                    }

                    temp.data.push({
                        x: new Date(obj['ts']),
                        y: y
                    });
                });

                sensorData.series.push(temp);
            }
            // temperatures
            else {

                internals.measurementsT.forEach(function(obj, i){

                    temp.data.push({
                        x: new Date(obj['ts']),
                        y: obj[sid] || null
                    });
                });

                sensorData.series.push(temp);
            }



        });

        var options = {
            /*
            fullWidth: true,
            height: "245px",
            chartPadding: {
                right: 40
            },
            */
            axisX: {
                type: Chartist.FixedScaleAxis,
                divisor: 4,
                labelInterpolationFnc: function(value) {

                    return Moment(value).format('D/MM HH') + 'h';
                }
            }
        };

//debugger;
        new Chartist.Line('[data-app-id="temperatures"]', sensorData, options);

    },

    onSensorChangeOld: function(e){
        
        var sensorIds = this.ui.sensorSelect.val();
        
        var labels = [];
        var allSeries = [];

        labels = internals.measurementsT.map(obj => {
            var d = new Date(obj.ts);
            return d.getHours();   
        });



        sensorIds.forEach(function(sid){

            if (!sid) {
                return;
            }


            var series = internals.measurementsT.map(obj => obj[sid]);
            allSeries.push(series);


        });

        
        var sensorData = {
            labels: labels,
            series: allSeries
        };

        var options = {
            fullWidth: true,
            height: "245px",
            chartPadding: {
                right: 40
            }
        };
//debugger;
        new Chartist.Line('[data-app-id="temperatures"]', sensorData, options);

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


        // activate chartist

        var dataTemperatures = {
            labels: [10,12,14,16,18,20,22,0,2,4,6,8,10],
            series: this.model.get('meteo').temperatures
        };

        var options = {
            fullWidth: true,
            height: "245px",
            chartPadding: {
                right: 40
            }
        };

        new Chartist.Line('[data-app-id="temperatures"]', dataTemperatures, options);


        var dataWP = {
            labels: [10,12,14,16,18,20,22,0,2,4,6,8,10],
            series: this.model.get('meteo').wp
        };

        new Chartist.Line('[data-app-id="wp"]', dataWP, options);


        this.ui.switch.each(function (){
            
            $(this).wrap('<div class="switch" />').parent().bootstrapSwitch();
        });


    }


});

module.exports = ControlV;


