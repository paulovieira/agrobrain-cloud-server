//var Fs = require("fs");
var Path = require("path");
var Config = require("config");
//var Hoek = require("hoek");
//var Joi = require("joi");
//var JSON5 = require("json5");
var Nunjucks = require("hapi-nunjucks");
//var Nunjucks = require("/home/pvieira/github/hapi-nunjucks/index.js");
//var Pre = require("../../server/common/prerequisites");
var Boom = require("boom");
//var _ = require("underscore");
var Glob = require("glob");
//var Utils = require("../../server/utils/utils");
//var Cp = require("child_process");
var Config = require('nconf');

var Promise = require("bluebird");
var execAsync = Promise.promisify(require("child_process").exec, {multiArgs: true})

var internals = {};

internals.cacheInterval = 5*60*1000;  // 5 minutes
//internals.cacheInterval = 10*1000;  // 10 seconds
internals.phantomScript = Path.join(__dirname, "phantom.js");  



exports.register = function(server, options, next){

    //var pluginName = exports.register.attributes.name;
    

    server.route({
        path: "/api/forecast",
        method: "GET",
        config: {
            handler: function(request, reply) {

                var meteoCache = server.app.meteoCache;

                var now = Date.now();
                //var key = Math.floor(now/internals.cacheInterval)*internals.cacheInterval + "";

                // the cache key is the geographical location of the forecast
                var key = "lisbon";

                var forecast = {};

                var p0a = Promise.resolve();

                var p1a = p0a.then(function(){

                    return meteoCache.getAsync(key);
                });
                
                var p2a = p1a.spread(function(value, cachedData, report){

                    if(cachedData){

                        // the data was found in the cache; in this case we have value===cachedData.item
                        return reply(cachedData.item);
                    }


                    // if we arrived here, the data requested from the cache is either stalled or not cached at all;
                    // create a second promise chain to handle the fetch and processing of new forecast data 
                    // (including a dedicated catch handler, as the catch handler for p1 will not be executed for any errors coming from p2)


                    var p0b = Promise.resolve();

                    var p1b = p0b.then(function(){

                        var command = Config.get("phantomCommand") + " " + internals.phantomScript;
                        return execAsync(command);
                    });

                    var p2b = p1b.then(function(data){

                        return JSON.parse(data[0]);
                    });

                    var p3b = p2b.then(function(obj){

                        forecast = {};
                        var meteoKeys = {
                            "temperature":      "tempdata",
                            "precipitation":    "precdata",
                            "relativeHumidity": "rhdata",
                            "seaPressure":      "seaPres"
                        };

                        now = new Date();
                        var startHour = Math.floor(now.getHours()/6)*6

                        for(var key in meteoKeys){
                            forecast[key] = obj[meteoKeys[key]].map(function(value, i){

                                var time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour + i, 0, 0);
                                return { time: time, value: value };
                            });                        
                        }

                        //key = Math.floor(now/internals.cacheInterval)*internals.cacheInterval + "";
                        key = "lisbon";

                        // override the default ttl (configured when the catbox policy was created)
                        var ttl = internals.cacheInterval;

                        return meteoCache.setAsync(key, forecast, ttl);
                    });

                    var p4b = p3b.then(function(){

                        // all is well - the new data has been inserted in the cache successfully
                        return reply(forecast);
                    });

                    p4b.catch(function(err){

                        // handle errors specific to the b chain
                        return reply(Boom.badImplementation(err));
                    });

                });

                p2a.catch(function(err){

                    // handle errors specific to the a chain
                    return reply(Boom.badImplementation(err));
                });
               
            }

        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/*"vision", "inert" , "hapi-auth-session-memory"*/]
};
