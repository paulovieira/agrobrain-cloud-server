'use strict';

const Path = require('path');
const ChildProcess = require('child_process');
const Fs = require('fs-extra');
const Config = require('nconf');
const Promise = require('bluebird');
const Nunjucks = require('hapi-nunjucks');
const Boom = require('boom');
const Glob = require('glob');

var Converter = require("csvtojson").Converter;
//const Utils = require('../../util/utils');


const internals = {};

// the path of the page that has the form for the login data
internals.loginPath = '/login';
internals.buildDir = Path.join(__dirname, 'app/_build');



exports.register = function(server, options, next){

    // the build command (webpack) is executed in production mode only
    if(Config.get('env') === 'production'){
        internals.build();
    }

    var pluginName = exports.register.attributes.name;

    // configure nunjucks
    const env = Nunjucks.configure(Config.get("rootDir"), { 
        autoescape: false,
        watch: false,
        noCache: Config.get('env') === "production" ? true : false,
        pluginName: pluginName,
        // throwOnUndefined: false,
    });
    
    internals.findChunkNames();
    internals.addNunjucksFilters(env);
    internals.addNunjucksGlobals(env);

    // expose the Environment object to the outside
    server.expose("env", env);

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

    // TODO
    internals.auth = false;

    server.route({
        path: "/dashboard",
        method: "GET",
        config: {
            handler: function(request, reply) {

                var context = {
                    clientName: 'permalab',
                    pivots: [
                        {
                            name: "campo de milho",
                            on: true,
                            irrigation: {
                                timeElapsed: [3, 30],
                                timeToFinish: [1,13]
                            }

                        }
                    ]
                };

                return reply.view(Path.join(__dirname, "templates/dashboard.html"), { ctx: context });
            },
            auth: internals.auth,

        }
    });

    // route for the client app build
    server.route({
        path: "/dashboard-app/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: Path.join(__dirname, 'app'),
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
/*
            cors: {
                methods: ["GET"]
            },
*/
            auth: false,
        }
    });

    server.route({
        path: "/test-model",
        method: "GET",
        config: {
            handler: function(request, reply) {

                const file1 = './test-model/input-1.csv';
                const file2 = './test-model/input-2.csv';

                const s1 = Fs.readFileSync(Path.join(__dirname, file1)).toString();
                const s2 = Fs.readFileSync(Path.join(__dirname, file2)).toString();

                const converter1 = Promise.promisifyAll(new Converter);
                const converter2 = Promise.promisifyAll(new Converter);

                Promise.all([
                    converter1.fromStringAsync(s1),
                    converter2.fromStringAsync(s2)
                ])
                .then(function(data){

                    const context = {
                        data: data
                    };

                    // console.log(context.data)

                    return reply.view(Path.join(__dirname, "templates/test-model.html"), { ctx: context });
                });

            }
        }
    });

    server.route({
        path: "/model/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: Path.join(__dirname, 'model'),
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
/*
            cors: {
                methods: ["GET"]
            },
*/
            auth: false,
        }
    });


    return next();
};

internals.addNunjucksFilters = function(env){

     env.addFilter('stringify', function(obj) {

         return JSON.stringify(obj);
     });
/*
     env.addFilter('getDomainLogo', function(array, elem) {

         if(typeof array !== "object"){
             return "";
         }

         for(var i=0; i<array.length; i++){
             if(array[i] === elem){
                 return "fa-check-square-o";
             }
         }

         return "fa-square-o";
     });

     env.addFilter('getDefinitionClass', function(array, elem) {

         if(typeof array !== "object"){
             return "";
         }

         for(var i=0; i<array.length; i++){
             if(array[i] === elem){
                 return "has-definition";
             }
         }

         return "";
     });


    env.addFilter('toFixed', function(num, precision) {

        if(typeof num === "string"){
            num = Number(num);
        }

        return num.toFixed(precision);
    });
*/
};


internals.addNunjucksGlobals = function(env){

    env.addGlobal("NODE_ENV", Config.get('env'));
    env.addGlobal("pluginTemplatesPath", Path.join(__dirname, "templates"));
    env.addGlobal("commonTemplatesPath", Path.join(Config.get("rootDir"), "templates"));

    // in production mode the chunks names are dynamic because it includes a hash of the file
    // in dev mode the names are static (see internals.findChunkNames)

    env.addGlobal("manifest", Path.basename(internals.manifest[0]));
    env.addGlobal("libBuild", Path.basename(internals.libBuild[0]));
    env.addGlobal("appBuild", Path.basename(internals.appBuild[0]));
};


// call webpack to build the client side application; the chuncks will be saved to
// app/_buildTemp and have a hashname; we then copy all of them to app/build;

// TODO: make sure that server-side caching is working well with these static files 
// even when the file is the same (and has the same name), but the timestamp changes;
// if not we have have use FileJanitor to copy from app/buildTemp to app/build only when
// the file has actually changed

internals.build = function(){

    try {
        Fs.removeSync(Path.join(internals.buildDir));

        const webpackConfig = Path.join(__dirname, "webpack.config.js");
        const buildCommand = `webpack --display-chunks --display-modules --config ${ webpackConfig }`;
        ChildProcess.execSync(buildCommand);

        // TODO: check if webpack failed (the output will say "error", but beter yet is to check the exit status code)
    }
    catch(err){
        throw err;
    }

    process.stdout.write("Dashboard client app: build successful!");
};

internals.findChunkNames = function(){

    if (Config.get('env') === 'production'){

        internals.manifest = Glob.sync(Path.join(internals.buildDir, "manifest.*.min.js"));
        internals.libBuild = Glob.sync(Path.join(internals.buildDir, "lib.*.min.js"));
        internals.appBuild = Glob.sync(Path.join(internals.buildDir, "dashboard-app.*.min.js"));

        if (internals.manifest.length !== 1 || 
            internals.libBuild.length !== 1 || 
            internals.appBuild.length !== 1){
            throw Boom.badImplementation("Dashboard client app: manifest, libBuild or appBuild are missing");
        }
    }
    else {
        // chunk names given in webpack configuration 
        internals.manifest = ['manifest.js'];
        internals.libBuild = ['lib.js'];
        internals.appBuild = ['dashboard-app.js'];
    }

};


exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ["vision", "hapi-public"]
};


