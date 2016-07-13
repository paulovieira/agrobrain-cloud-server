'use strict';

const Path = require('path');
const Hoek = require('hoek');

// route for the client apps and libraries (static files like css, js, etc); relative to the ghost-proxy plugin

// note that the a route configuration with the directory handler is only possible after
// the inert plugin has been registered

const internals = {};

exports.register = function (server, options, next){

    // default route config (can be changed with configDefaults)
    const configDefaults = {
        cache: {
            privacy: 'public',
            expiresIn: 3600000
        },
        cors: true,
        auth: false
    };

    Hoek.merge(configDefaults, options.configDefaults);

    options.file = options.file || [];
    options.file.forEach(function (obj){

        var fileHandler = Hoek.applyToDefaults(options.fileHandlerDefaults || {}, obj.handler);
        var config = Hoek.applyToDefaults(configDefaults, {
            handler: {
                file: fileHandler
            }
        });

        server.route({
            path: obj.path,
            method: 'GET',
            config: config
        });
    });

    options.directory = options.directory || [];
    options.directory.forEach(function(obj){

        var directoryHandler = Hoek.applyToDefaults(options.directoryHandlerDefaults || {}, obj.handler);
        var config = Hoek.applyToDefaults(configDefaults, {
            handler: {
                directory: directoryHandler
            }
        });

        server.route({
            path: obj.path,
            method: 'GET',
            config: config
        });
    });

    return next();

};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the directory
    dependencies: ['inert']
};
