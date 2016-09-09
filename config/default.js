'use strict';

const Path = require('path');

const internals = {
    rootDir: Path.resolve(__dirname, '..')
};

module.exports = {

    rootDir: internals.rootDir,
    applicationTitle: 'agrobrain-cloud',

    publicIp: '',
    publicPort: '',
    publicUrl: '',

    clientTokens: {},
    phantomCommand: '',

    db: {
        // should be redefined in some other configuration file (that should be present in .gitignore)
        postgres: {
            host: 'localhost',
            port: 5432,
            database: '',
            username: '',
            password: ''
        }
    },

    plugins: {

        'nes': {

            onConnection: function (socket){

                console.log('new client: ', socket.id);
            },
            onDisconnection: function (socket){

                console.log('terminated client: ', socket.id);
            },
            onMessage: function (socket, message, next){

                console.log('new message: ', message);
                console.log('client: ', socket.id);
                const data = { status: 'received', ts: new Date().toISOString() };

                return next(data);
            },

            auth: false,

            payload: {

                // maximum number of characters allowed in a single WebSocket message;
                // important when using the protocol over a slow network with large updates as the transmission
                // time can exceed the timeout or heartbeat limits which will cause the client to disconnect.
                maxChunkChars: false
            },

            heartbeat: {
                interval: 15000,
                timeout: 10000
            }
        },

        // good configuration is entirely defined the respective mode's file
        'good': {
        },

        'blipp': { 
            showAuth: true,
            showStart: true
        },

        'hapi-public': {

            file: [
                // { 
                //     path: '/favicon.ico', 
                //     handler: { path: Path.join(internals.rootDir, 'public/images/favicon.ico') }
                // }
                { 
                    path: '/public/libs/nes/client.js', 
                    handler: { path: Path.join(internals.rootDir, 'node_modules/nes/dist/client.js') }
                }
            ],

            directory: [
                {
                    path: '/public/{anyPath*}',
                    handler: { path: Path.join(internals.rootDir, 'public') }
                }
            ],

            fileHandlerDefaults: {
                etagMethod: 'simple'
            },

            directoryHandlerDefaults: {
                index: false,
                listing: false,
                showHidden: false
            },

            configDefaults: {
            }
        }


    }

/*
    hapi: {
        
        joi: {

            // documentation: https://github.com/hapijs/joi#validatevalue-schema-options-callback

            abortEarly: true,  // returns all the errors found (does not stop on the first error)
            stripUnknown: true,  // delete unknown keys; this means that when the handler executes, only the keys that are explicitely stated
            // in the schema will be present in request.payload and request.query 
            convert: true

        }
    }
*/

};
