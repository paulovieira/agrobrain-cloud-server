var Mn = require('backbone.marionette');

var PivotsC = require('../_entities/PivotsC');

var RootV = Mn.LayoutView.extend({

    initialize: function(options){

        var pivotsC = new PivotsC(ctx.pivots);
        var model = pivotsC.findWhere({ code: options.request.params.client });
        if(model){
            model.set('active', true);    
        }

        var activeUri;
        if(options.request.uriFragment.indexOf('/control') >= 0){
            activeUri = 'control';
        }
        else if(options.request.uriFragment.indexOf('/state') >= 0){
            activeUri = 'state';
        }
        else if(options.request.uriFragment.indexOf('/meteo') >= 0){
            activeUri = 'meteo';
        }


        this.model = new Backbone.Model({
            pivotsC: pivotsC,
            activeUri: activeUri
        });

    },

    template: require('./root.html'),

    
    ui: {
        'region-right': 'div[data-mn-region-id="right"]'
    },
   
    regions: {
        right: '@ui.region-right'
    },

});


module.exports = RootV;
