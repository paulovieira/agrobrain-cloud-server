var $ = require("jquery");
var Backbone = require("backbone");
var Mn = require("backbone.marionette");
var Radio = require("backbone.radio");

var PivotsC = require('../_entities/PivotsC');


var StateV = Mn.LayoutView.extend({
    
    initialize: function(){
        
        var pivotsC = new PivotsC(ctx.pivots);
        pivotsC.each(function(pivotM){

            if(pivotM.get('on')){
                pivotM.set('stateText', 'Ligado');
                pivotM.set('stateColor', 'green');
            }
            else{
                pivotM.set('stateText', 'Desligado');
                pivotM.set('stateColor', 'orange');
            }
        });

        this.model = new Backbone.Model({
            pivotsC: pivotsC
        });



    },

    template: require('./state.html'),

    
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

module.exports = StateV;



