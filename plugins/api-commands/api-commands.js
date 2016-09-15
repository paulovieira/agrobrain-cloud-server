'use strict';

const Path = require('path');
const Nunjucks = require('hapi-nunjucks');
const Config = require('nconf');
const Joi = require('joi');

const internals = {};

internals.endpoints = {
    commands: '/api/v1/commands',
    state:    '/api/v1/state'
};

internals.state = false;

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


    server.subscription(internals.endpoints.commands, {
        filter: function (path, message, filterOptions, next2){

            server.log(['api-commands', 'subscription filter'], { socketId: filterOptions.socket.id, path: path });
            next2(true);
        },
        auth: false,
        onSubscribe: function (socket, path, params, next2){

            server.log(['api-commands', 'onSubscribe'], { path: path, socketId: socket.id });
            return next2();
        },
        onUnsubscribe: function (socket, path, params){

            server.log(['api-commands', 'onUnsubscribe'], { path: path, socketId: socket.id });
        }
    });


    server.subscription(internals.endpoints.state, {
        filter: function (path, message, filterOptions, next3){

            server.log(['api-commands', 'subscription filter'], { socketId: filterOptions.socket.id, path: path });
            next3(true);
        },
        auth: false,
        onSubscribe: function (socket, path, params, next2){

            server.log(['api-commands', 'onSubscribe'], { path: path, socketId: socket.id });
            return next2();
        },
        onUnsubscribe: function (socket, path, params){

            server.log(['api-commands', 'onUnsubscribe'], { path: path, socketId: socket.id });
        }
    });


    // the client in the rpi will continously send here updates of the gpio 
    server.route({
        path: '/api/v1/set-state',
        method: 'PUT',
        config: {
            validate: {
                payload: Joi.object({
                    state: Joi.number().integer().valid(0, 1).required(),
                    updatedAt: Joi.string().required()
                })
            }

        },
        handler: function (request, reply){

            console.log(request.payload);
            server.publish(internals.endpoints.state, request.payload);

            return reply({ ts: new Date().toISOString() });
        }
    });

    // called by the client with the user interface to change the command
    server.route({
        path: '/api/v1/set-command',
        method: 'PUT',
        config: {
            validate: {
                payload: Joi.object({
                    command: Joi.number().integer().valid(0, 1).required()
                })
            }
        },
        handler: function (request, reply){

            console.log(request.payload);
            server.publish(internals.endpoints.commands, request.payload);

            return reply({ ts: new Date().toISOString() });
        }
    });

    server.route({
        path: '/comando',
        method: 'GET',
        config: {
        },
        handler: function (request, reply) {

            const context = { 
                env: Config.get('env'),
                websocketUrlBase: 'ws://' + Config.get('publicUrl')
            };

            return reply.view(Path.join(__dirname, 'templates/comando.html'), { ctx: context });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ['nes', 'vision']
};
