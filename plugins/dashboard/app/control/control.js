var $ = require('jquery');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');

var ControlV = Mn.LayoutView.extend({

    template: require('./control.html'),
    ui: {
        'charts': 'div[data-pivot-chart="true"]'
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

    }

});

module.exports = ControlV;


