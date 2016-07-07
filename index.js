require('./config/load');

var Config = require('nconf');
var Glue = require("glue");
var Hoek = require("hoek");
var Chalk = require('chalk');
var Bluebird = require("bluebird");
var Db = require('./database');

process.title = Config.get('applicationTitle');

var manifest = {

    server: {

        //  default connections configuration
        connections: {

            // controls how incoming request URIs are matched against the routing table
            router: {
                isCaseSensitive: false,
                stripTrailingSlash: true
            },

            // default configuration for every route.
            routes: {
                state: {
                    // determines how to handle cookie parsing errors ("ignore" = take no action)
                    failAction: "ignore"
                },

                // disable node socket timeouts (useful for debugging)
                timeout: {
                    server: false,
                    socket: false
                }
            }
        },

    },

    connections: [
        {
            //host: "localhost",
            address: '127.0.0.1',
            port: 8000
        }
    ],

    registrations: [

//        {
//            plugin: {
//                register: "...",
//                options: require("./config/plugins/...")
//            },
//            options: {}
//        },

        {
            plugin: {
                register: "nes",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "inert",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "vision",
                options: {}
            },
            options: {}
        },

        // {
        //     plugin: {
        //         register: "./server/routes-websocket/routes-websocket.js",
        //         options: {}
        //     }

        // },

        // {   
        //     plugin: {
        //         register: "./server/routes-api/routes-api.js",
        //         options: {}
        //     },
        // },


        {
            plugin: {
                register: "./plugins/measurements/measurements.js",
                options: {}
            },
            options: {}
        },


        {
            plugin: {
                register: "./plugins/api-forecast/api-forecast.js",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "./plugins/api-readings/api-readings.js",
                options: {}
            },
            options: {}
        },

        {
            plugin: {
                register: "./plugins/api-sync/api-sync.js",
                options: {}
            },
            options: {}
        }        
    ]


};

// load plugins, unless they are explicitely turned off 

if(Config.get('good')!=='false'){
    manifest.registrations.push(
        {
            plugin: {
                register: "good",
                options: require("./config/plugins/good")
            },
            options: {}
        }
    );
}

if(Config.get('blipp')==='false'){
    manifest.registrations.push(
        {
            plugin: {
                register: "blipp",
                options: require("./config/plugins/blipp")
            },
            options: {}
        }
    );
}




var glueOptions = {
    relativeTo: __dirname,
    preRegister: function(server, next){
        console.log("[glue]: executing preRegister (called prior to registering plugins with the server)")
        next();
    },
    preConnections: function(server, next){
        console.log("[glue]: executing preConnections (called prior to adding connections to the server)")        
        next();
    }
};

Glue.compose(manifest, glueOptions, function (err, server) {

    Hoek.assert(!err, 'Failed registration of one or more plugins: ' + err);

    server.app.meteoCache = server.cache({ segment: 'meteo', expiresIn: 10*1000 });

    server.app.meteoCache.getAsync = Bluebird.promisify(server.app.meteoCache.get, {multiArgs: true});
    server.app.meteoCache.setAsync = Bluebird.promisify(server.app.meteoCache.set);

//    server.app.meteoCache.getAsync = Bluebird.promisify(server.cache({ segment: 'meteo', expiresIn: 10*1000 }), {multiArgs: true});


    // start the server and finish the initialization process
    server.start(function(err) {

        Hoek.assert(!err, 'Failed server start: ' + err);
        
        // show some informations about the server
        console.log(Chalk.green('================='));
        console.log("Hapi version: " + server.version);
        console.log('host: ' + server.info.host);
        console.log('port: ' + server.info.port);
        console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);

        Db.query("SELECT version()")
            .then(function(result){
                console.log("database: ", result[0].version);
                console.log(Chalk.green('================='));
            });
       
    });

});

