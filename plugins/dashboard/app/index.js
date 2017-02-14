console.log("hello world");

// initial configuration

require('./_config/prerequisites');
require('./_config/insert-styles');
require('./_config/overrides');

var Q = require('q');
var $ = require('jquery');
//var Backbone = require('backbone');
//var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Router = require('backbone.call');
var Utils = require('./utils');

var internals = {};

internals.startApp = function(){

	console.log("started");

	// start with a clean DOM and add the permanente regions (always present)

	Utils.resetDOM();
	Utils.createRootRegion();
	Utils.createModalRegion();


    // create the router and add all the routes

    var router = new internals.Router;
    var routes = require('./routes');

    router.addRoutes(routes.state);
    router.addRoutes(routes.control);
    router.addRoutes(routes.meteo);
    router.addRoutes(routes.analysis);
    router.addRoutes(routes.catchAll);

    $('div[data-id="initial-loading"]').remove();
    router.start();

};

// custom router with specific logic to find the default/permanent regions

internals.Router = Router.extend({

    // if the region is not given directly and is not found in the view,
    // try to get it from Radio's public channel
    
    getDefaultRegion: function(region, view){

        return Radio.channel('public').request(region);
    }
});


internals.startApp();
