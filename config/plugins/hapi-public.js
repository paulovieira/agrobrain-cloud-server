'use strict';

const Path = require('path');
const Config = require('nconf');

module.exports = {

    file: [
        // { 
        //     path: '/favicon.ico', 
        //     handler: { path: Path.join(Config.get('rootDir'), 'public/images/favicon.ico') }
        // }
        { 
            path: '/public/libs/nes/client.js', 
            handler: { path: Path.join(Config.get('rootDir'), 'node_modules/nes/dist/client.js') }
        }
    ],

    directory: [
        {
            path: '/public/{anyPath*}',
            handler: { path: Path.join(Config.get('rootDir'), 'public') }
        },

/*
        ,{
            path: '/rc-dashboard/{anyPath*}',
            handler: { path: Path.join(Config.get('rootDir'), 'server/client/rc-dashboard') }
        }
*/
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
};

