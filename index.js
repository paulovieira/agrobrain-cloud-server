process.title = "spinon";

require('./config/load');
var Glue = require("glue");
var Hoek = require("hoek");
var Bluebird = require("bluebird");

var manifest = {

    server: {

        //  default connections configuration
        connections: {

            // default configuration for every route.
            routes: {

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
            host: "localhost",
            port: 8000
        }
    ],

    registrations: [
        {
            plugin: {
                register: "nes",
                options: {
                }
            },
        },

        {
            plugin: {
                register: "good",
                options: require("./config/plugins/good")
            },
        },

        {
            plugin: {
                register: "inert",
                options: {}
            }
        },

        {
            plugin: {
                register: "vision",
                options: {}
            }
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
            }
        },


        {
            plugin: {
                register: "./plugins/api-forecast/api-forecast.js",
                options: {}
            }
        },

        {
            plugin: {
                register: "./plugins/api-readings/api-readings.js",
                options: {}
            }
        }        
    ]


};

// TODO: remove good console if not in production
var options = {
    relativeTo: __dirname
};

Glue.compose(manifest, options, function (err, server) {

    Hoek.assert(!err, 'Failed registration of one or more plugins: ' + err);

    server.app.meteoCache = server.cache({ segment: 'meteo', expiresIn: 10*1000 });

    server.app.meteoCache.getAsync = Bluebird.promisify(server.app.meteoCache.get, {multiArgs: true});
    server.app.meteoCache.setAsync = Bluebird.promisify(server.app.meteoCache.set);

//    server.app.meteoCache.getAsync = Bluebird.promisify(server.cache({ segment: 'meteo', expiresIn: 10*1000 }), {multiArgs: true});

    // start the server and finish the initialization process
    server.start(function(err) {
    
        Hoek.assert(!err, 'Failed server start: ' + err);
        
        console.log('Server started at: ' + server.info.uri);
        console.log("Hapi version: " + server.version);
    });
});

