'use strict';

const Path = require('path');

const internals = {
    rootDir: Path.resolve(__dirname, '..')
};

module.exports = {

    rootDir: internals.rootDir,
    applicationTitle: 'agrobrain-cloud',

    publicPort: '',
    publicUrl: '',

    clientTokens: {},
    phantomCommand: '',

    // configuration for each database is entirely defined the mode configuration file
    db: {
        // should be redefined in some other configuration file (that should be present in .gitignore)
        postgres: {
            host: '',
            port: 0,
            database: '',
            username: '',
            password: ''
        }
    },

    // configuration for each plugin is entirely defined the mode configuration file
    plugins: {

        // external plugins

        'nes': {
        },

        // good configuration is entirely defined the respective mode's file
        'good': {
        },

        'blipp': { 
        },

        'hapi-public': {
        }


        // internal plugins

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
