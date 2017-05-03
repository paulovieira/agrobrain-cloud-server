require('chartist-plugin-tooltips/dist/chartist-plugin-tooltip.css');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Chartist = require('chartist');
var ChartistTooltips = require('chartist-plugin-tooltips');
var ChartistThreshold = require('chartist-plugin-threshold');
require('./chartist-threshold.css');
require('./chartist-zoom.css');
var ChartistZoom = require('chartist-plugin-zoom');

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

internals.availableColors = [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf'
];

internals.sensorColors = {

};

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
        'sensorSelect': 'select#sensor_id',

        'sensorsColumn1': 'div#sensors-col-1',
        'sensorsColumn2': 'div#sensors-col-2',
        'sensorsColumn3': 'div#sensors-col-3',

        'sensorCheckboxes': 'input[type="checkbox"]',
        'legends': 'div.chart-legend'
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
        //'change @ui.sensorSelect': 'onSensorChange',
        'change @ui.sensorCheckboxes': 'onSensorChange'
    },

    onDateChange: function(){

        var start = this.ui.startDate.val();
        var end = this.ui.endDate.val();

        if (start && !end){
            var dateEnd = new Date(start);
            dateEnd.setDate(dateEnd.getDate() + 7);
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


        var numDays = Math.floor((dateEnd2 - new Date(start)) / 86400000);

        var timeInterval = 24;
        if(numDays <= 2){
            timeInterval = 1;
        }
        else if(numDays <= 4){
            timeInterval = 3;
        }
        else if(numDays <= 7){
            timeInterval = 6;
        }
        else if(numDays <= 15){
            timeInterval = 9;
        }
        else if(numDays <= 30){
            timeInterval = 12;
        }

        var p1 = $.ajax({
            url: '/api/v1/measurements-agg',
            data: {
                clientName: 'permalab',
                start: start,
                end: end2,
                timeInterval: timeInterval,
                format: 'json',
                type: JSON.stringify(['t'])
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
                type: JSON.stringify(['t'])
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
/*
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
            _this.ui.sensorSelect.val('6e:e0:f5:5:f0:f8:1:h');
            _this.ui.sensorSelect.trigger('change');
*/
            // new

            var htmlColumn1 = '';
            var htmlColumn2 = '';
            var htmlColumn3 = '';

            allKeysT.forEach(key => {

                if(key === 'ts'){ return }

                    if ((key.indexOf('18-fe-34-d3-83-85') >= 0 || key.indexOf('18-fe-34-d3-84-c') >= 0)){
                        htmlColumn2 +=`
                        <label class="checkbox" id=${ key }>
                            <input type="checkbox" data-toggle="checkbox" data-id=${ key } value="${ key }">
                            ${ key }
                        </label>
                        `;
                    }

                    if ((key.indexOf('18-fe-34-db-56-33') >= 0 || key.indexOf('5c-cf-7f-e-33-90') >= 0)){
                        htmlColumn3 += `
                        <label class="checkbox" id=${ key } >
                            <input type="checkbox" data-toggle="checkbox" data-id=${ key } value="${ key }">
                            ${ key }
                        </label>
                        `;
                    }

            });

            allKeysH.forEach(key => {

                if(key === 'ts'){ return }

                if (key.indexOf('6e:e0:f5:5:f0:f8') >= 0) {
                    htmlColumn1 +=`
                    <label class="checkbox" id=${ key } >
                        <input type="checkbox" data-toggle="checkbox" data-id=${ key } value="${ key }">
                        ${ key }
                    </label>
                    `;
                }
            });

            _this.ui.sensorsColumn1.html(htmlColumn1);
            _this.ui.sensorsColumn2.html(htmlColumn2);
            _this.ui.sensorsColumn3.html(htmlColumn3);

            
            this.$('[data-toggle="checkbox"]').each(function () {

              if($(this).data('toggle') == 'switch') return;

              var $checkbox = $(this);
              $checkbox.checkbox();
            });

            this.$('input[data-id="6e:e0:f5:5:f0:f8:1:h"]').checkbox('check');
            ///_this.ui.sensorSelect.val('6e:e0:f5:5:f0:f8:1:h');
            ///_this.ui.sensorSelect.trigger('change');

        })
        .catch((err) => {

            debugger;
        });
    },

    onSensorChange: function(e){

        internals.sensorIds = [];
        this.$('label').filter(function(){

            if ($(this).hasClass('checked')){
                internals.sensorIds.push($(this).prop('id'));
            }
        });

        var sensorData = {
            series: []
        };

        internals.sensorIds.forEach(function(sid){

            
            var sensorsWithColors = Object.keys(internals.sensorColors);
            if(sensorsWithColors.indexOf(sid) === -1){
                internals.sensorColors[sid] = internals.availableColors[0];
                internals.availableColors.shift()
            }

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
            //low: 0,
            //high: 60,
            //divisor: 12,
            //ticks: [0, 10, 20, 30, 40, 50, 60],
            //ticks: [0, 30, 60],
            
            /*
            axisX: {
                type: Chartist.FixedScaleAxis,
                divisor: 4,
                labelInterpolationFnc: function(value) {

                    return Moment(value).format('D/MM HH') + 'h';
                }
            },
            */

            axisX: {
                //type: Chartist.AutoScaleAxis,
                type: Chartist.FixedScaleAxis,
                divisor: 5,
                labelInterpolationFnc: function(value) {

                    return Moment(value).format('D-MMM HH') + 'h';
                }
            },

            //low: 0,
            //hight: 60,
            /*
            axisY: {
                type: Chartist.FixedScaleAxis,
                low: 0,
                high: 60,
                ticks: [0,10,20,30,40,50,60]


            },
            */
            showArea: true,

            plugins: [
                
                Chartist.plugins.tooltip(),
                Chartist.plugins.ctThreshold({
                    threshold: 40
                }),
                /*
                Chartist.plugins.zoom({

                    onZoom: function onZoom(chart, reset) {
                        //debugger;
                        var resetFnc = reset;
                    }
                })*/
                
            ]
        };

//debugger;
        var chart = new Chartist.Line('[data-app-id="temperatures"]', sensorData, options);


        chart.on('draw', function(context) {

          // First we want to make sure that only do something when the draw event is for bars. Draw events do get fired for labels and grids too.
          
            var sid;
            if(context.type === 'line'  ) {
                sid = context.series.name;
                context.element.attr({
                    style: 'stroke: ' + internals.sensorColors[sid] + ';'
                });
            }

            if(context.type === 'label'  ) {

                context.element.attr({
                    style: 'stroke: red;'
                });
            }

            if(context.type === 'point'  ) {
                sid = context.series.name;
                context.element.attr({
                    style: 'stroke: ' + internals.sensorColors[sid] + ';'
                });
            }
        });

        this.updateLegends();
    },

    updateLegends: function(){

        var html = '';
        internals.sensorIds.forEach(function(sid){

            var color = internals.sensorColors[sid];
            if(color){
                html += `
                <div class="chart-legend">
                    <i class="fa fa-circle" style="color: ${ color}"></i> ${ sid }
                </div>
                `;
            }
        });
        this.ui.legends.html(html);
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

/*
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

        var chart = new Chartist.Line('[data-app-id="temperatures"]', dataTemperatures, options);
debugger;
        chart.on('draw', function(context) {
            debugger;
          // First we want to make sure that only do something when the draw event is for bars. Draw events do get fired for labels and grids too.
          
          if(context.type === 'bar') {
            // With the Chartist.Svg API we can easily set an attribute on our bar that just got drawn
            context.element.attr({
              // Now we set the style attribute on our bar to override the default color of the bar. By using a HSL colour we can easily set the hue of the colour dynamically while keeping the same saturation and lightness. From the context we can also get the current value of the bar. We use that value to calculate a hue between 0 and 100 degree. This will make our bars appear green when close to the maximum and red when close to zero.
              style: 'stroke: hsl(' + Math.floor(Chartist.getMultiValue(context.value) / max * 100) + ', 50%, 50%);'
            });
          }
          
        });

        var dataWP = {
            labels: [10,12,14,16,18,20,22,0,2,4,6,8,10],
            series: this.model.get('meteo').wp
        };

        new Chartist.Line('[data-app-id="wp"]', dataWP, options);
*/

        this.ui.switch.each(function (){
            
            $(this).wrap('<div class="switch" />').parent().bootstrapSwitch();
        });

        // set a default start date
        //var offset = 40;
        var offset = 0;
        var initialDate = new Date(Date.now() -  (7 + offset) * 86400000 ).toISOString().split('T')[0];
        this.ui.startDate.val(initialDate);
        this.ui.startDate.trigger('change');



    }


});

module.exports = ControlV;


