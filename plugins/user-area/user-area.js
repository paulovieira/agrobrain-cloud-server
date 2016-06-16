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


var internals = {};



exports.register = function(server, options, next){


    // expose the Environment object to the outside
    //server.expose("env", env);

    // configure a view's manager using the nunjucks lib
    server.views({
        path: Config.get("rootDir"),
        allowAbsolutePaths: true,
        engines: {
            html: Nunjucks
        },
        compileOptions: {
            pluginName: pluginName
        }
    });

/*
    if(process.env.NODE_ENV==="production"){
        internals.auth = {
            strategy: "session-memory",
            mode: "try"
        };
    }
    else{
        internals.auth = false;
    }
*/
    server.route({
        path: "/",
        method: "GET",
        config: {
            handler: function(request, reply) {

                //return reply("abc");

                //console.log("request.auth: ", JSON.stringify(request.auth));
                var context = {
                    //definitions: request.pre.definitions,
                };

                //console.log("context: ", context); 
                return reply.view(Path.join(__dirname, "templates/measurements.html"), { ctx: context });
                
            }

        }
    });

    server.route({
        path: "/user-area/app/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: internals.clientAppDir,
                    index: false,
                    listing: false,
                    showHidden: false,
                    lookupCompressed: true
                }
            },
            cache: {
                privacy: "public",
                expiresIn: 3600000
            },
            // cors: {
            //     methods: ["GET"]
            // },
            auth: false,
        }
    });

    server.route({
        path: "/measurements/public/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: internals.publicDir,
                    index: false,
                    listing: false,
                    showHidden: false,
                    lookupCompressed: true
                }
            },
            cache: {
                privacy: "public",
                expiresIn: 3600000
            },
            // cors: {
            //     methods: ["GET"]
            // },
            auth: false,
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ["vision", "inert" /*, "hapi-auth-session-memory"*/]
};
