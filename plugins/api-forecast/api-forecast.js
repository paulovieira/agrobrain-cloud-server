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

var Promise = require("bluebird");
var execAsync = Promise.promisify(require("child_process").exec, {multiArgs: true})

var internals = {};
internals.phantomCommand = "~/phantomjs-2.1.1/bin/phantomjs";  
internals.phantomScript = Path.join(__dirname, "phantom.js");  



exports.register = function(server, options, next){

    var pluginName = exports.register.attributes.name;

    server.route({
        path: "/api/forecast",
        method: "GET",
        config: {
            handler: function(request, reply) {

                var p = Promise.resolve();
                
                p = p.then(function(){
                    var command = internals.phantomCommand + " " + internals.phantomScript;
                    console.log(command)
                    return execAsync(command)

                    //return ['{ "tempdata": []}']
                });

                p = p.then(function(data){

                    return JSON.parse(data[0]);
                })

                p = p.then(function(obj){

                    var now = new Date();
                    var startHour, currentHour = now.getHours();

                    if(currentHour>=0 && currentHour <= 5){
                        startHour = 0;
                    }
                    else if(currentHour>=6 && currentHour <= 11){
                        startHour = 6;
                    }
                    else if(currentHour>=12 && currentHour <= 17){
                        startHour = 12;
                    }
                    else if(currentHour>=18 && currentHour <= 23){
                        startHour = 18;
                    }

                    var temperatures = obj["tempdata"].map(function(temperature, i){

                        var time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour + i, 0, 0);
                        return { time: time, temperature: temperature };
                    });

                    return reply(JSON.stringify(temperatures, null, 4));
                })


                p = p.catch(function(err){

                    return reply(Boom.badImplementation(err));
                })

/*
                    execAsync(command, function(err, stdout, stderr){
                    
                    if(err){
                        throw Boom.badImplementation(err);
                    }

                    // if(stderr){
                    //     throw Boom.badImplementation("error code: " + err.code);   
                    // }

                    console.log(stdout)
                    
                })
*/
                /*
                var p = Promise.resolve();

                p = p.then(function(){
                })

                //return reply("abc");

                //console.log("request.auth: ", JSON.stringify(request.auth));
                var context = {
                    //definitions: request.pre.definitions,
                };
*/
                //console.log("context: ", context); 

                
            }

        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/*"vision", "inert" , "hapi-auth-session-memory"*/]
};
