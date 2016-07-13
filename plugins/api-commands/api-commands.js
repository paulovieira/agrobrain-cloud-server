'use strict';

const Path = require('path');
const Nunjucks = require("hapi-nunjucks");
const Config = require("nconf");

const internals = {};

internals.endpoints = {
    commands: '/api/v1/commands',
    status: '/api/v1/status'
};

internals.status = false;

exports.register = function (server, options, next){

    const pluginName = exports.register.attributes.name;

    const env = Nunjucks.configure(Config.get('rootDir'), { 
        autoescape: false,
        watch: false,
        noCache: Config.get('env') === 'production' ? true : false,
        pluginName: pluginName
        // throwOnUndefined: false,
    });

    server.views({
        path: Config.get('rootDir'),
        allowAbsolutePaths: true,
        engines: {
            html: Nunjucks
        },
        compileOptions: {
            pluginName: pluginName
        }
    });


    server.onSubscribe = function (socket, path, params, next2){

        server.log(['api-commands', 'onSubscribe'], { socketId: socket.id, path: path });
        return next2();
    };

    server.onUnsubscribe = function (socket, path, params){

        server.log(['api-commands', 'onUnsubscribe'], { socketId: socket.id, path: path });
    };

    server.subscription(internals.endpoints.commands, {
        filter: function (path, message, filterOptions, next2){

            server.log(['api-commands', 'subscription (commands)', 'filter'], { socketId: filterOptions.socket.id, path: path });
            next2(true);
        },
        auth: false
    });

    server.subscription(internals.endpoints.status, {
        filter: function (path, message, filterOptions, next3){

            server.log(['api-commands', 'subscription (status)', 'filter'], { socketId: filterOptions.socket.id, path: path });
            next3(true);
        },
        auth: false
    });



    server.route({
        path: '/publish',
        method: 'GET',
        config: {},
        handler: function (request, reply){

            const data = {
                command: 'HIGH',
                ts: new Date().toISOString()
            };

            server.publish(internals.endpoints.commands, data);
            return reply(`[${ new Date().toISOString() }]: check the output in the console`);
        }
    });

    // called by the client on the rpi whenever the status changes
    server.route({
        path: '/api/v1/set-status',
        method: 'PUT',
        config: {},
        handler: function (request, reply){

            console.log(request.payload);
            server.publish(internals.endpoints.status, request.payload);
            return reply({ ts: new Date().toISOString() });
        }
    });

    // called by the client with the user interface to change the command 
    server.route({
        path: '/api/v1/set-command',
        method: 'PUT',
        config: {},
        handler: function (request, reply){

            // todo: validation, auth
            server.publish(internals.endpoints.commands, request.payload);
            return reply({ ts: new Date().toISOString() });
        }
    });

    // server.route({
    //     path: '/comando',
    //     method: 'GET',
    //     config: {},
    //     handler: function (request, reply){

    //         const data = {
    //             command: 'HIGH',
    //             ts: new Date().toISOString()
    //         };

    //         server.publish(internals.endpoints.commands, data);
    //         return reply(`[${ new Date().toISOString() }]: check the output in the console`);
    //     }
    // });

    server.route({
        path: '/comando',
        method: 'GET',
        config: {
        },
        handler: function (request, reply) {

            const context = {};
            return reply.view(Path.join(__dirname, 'templates/comando.html'), { ctx: context });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ['nes', 'vision']
};
