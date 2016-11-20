// list of the reservations

//var Radio = require('backbone.radio');
var _ = require('underscore');
var Backbone = require('backbone');
//var Utils = require('./utils');
var internals = {};

module.exports.state = {

    path: '!/state',
    handler: function (request, reply) {

        reply(this.tree);
    },

    tree: {
        // the top-level region must be given as a reference;
        // the regions in the children are given as strings (names of the region in the parent view)


        viewClass: require('./root/RootV'),
        region: 'rootR',
        forceRender: true,
        children: [

            {
                viewClass: require('./state/StateV'),
                region: 'right',
            }
        ]

    }
};


module.exports.control = {

    path: '!/control/:client',
    handler: function(request, reply) {

        // make sure the client is valid
        var validClients = ['permalab', 'campo-das-faias'];
        if (!_.includes(validClients, request.params.client)) {
            alert('Invalid client');
            window.location.hash = '!/state';
            return;
        }

        reply(this.tree);
    },

    tree: {
        // the top-level region must be given as a reference;
        // the regions in the children are given as strings (names of the region in the parent view)
        region: 'rootR',
        viewClass: require('./root/RootV'),
        forceRender: true,

        children: [
            {
                viewClass: require('./control/ControlV'),
                region: 'right',
                xpre: function(request, view){

                    debugger;
                    var model = new Backbone.Model(window.ctx);
                    
                    model.set({
                        currentUri: 'control',
                        client: request.params.client
                    });

                    view.model = model;
                }
            }

        ]
    }
};

module.exports.meteo = {

    path: '!/meteo',
    handler: function (request, reply) {

        reply(this.tree);
    },

    tree: {
        // the top-level region must be given as a reference;
        // the regions in the children are given as strings (names of the region in the parent view)
        region: 'rootR',
        viewClass: require('./root/RootV'),
        forceRender: true,
        children: [
            {
                viewClass: require('./meteo/MeteoV'),
                region: 'right',
            }

        ]
    }
};


// catch-all route

module.exports.catchAll = {

    path: '*any',
    handler: function(request, reply) {

        window.location.hash = '!/state';
        return;
    },

};

