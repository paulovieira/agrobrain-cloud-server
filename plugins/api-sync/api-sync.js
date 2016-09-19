'use strict';

const Path = require('path');
const Config = require('nconf');
const Datastore = require('nedb');
const Joi = require('joi');
const Boom = require('boom');
//const _ = require('underscore');
const Utils = require('../../utils/util');
const Sql = require('./sql-templates');
const Db = require('../../database');


//const Promise = require('bluebird');
//const CsvStringify = Promise.promisify(require('csv-stringify'));
//const CsvStringify = require('csv-stringify');

const Promise = require('bluebird');
const execAsync = Promise.promisify(require('child_process').exec, {multiArgs: true})

const internals = {};

internals['oneHour'] = 60 * (60 * 1000);
internals['oneDay'] = 24 * 60 * (60 * 1000);

internals.cacheInterval = 5 * (60 * 1000);  // 5 minutes
//internals.cacheInterval = 10*1000;  // 10 seconds
internals.phantomScript = Path.join(__dirname, "phantom.js");  

internals.idProjection = function(obj){
    return { id: obj.id };
};

internals.db = new Datastore({ filename: Path.join(Config.get("rootDir"), "database", 'readings-new.json'), autoload: true });


internals.measurementsSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'mac': Joi.string().required(),
    'sid': Joi.number().integer().required(),
    'type': Joi.string().required(),
    'description': Joi.string().allow(['', null]).required(),
    'val': Joi.number().required(),
    'ts': Joi.string().required(),
    'battery': Joi.number().allow([null])
});

internals.logStateSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'segment': Joi.string().min(1).required(),
    'data': Joi.object().required(),
    'ts_start': Joi.string().required(),
    'ts_end': Joi.string().required()
});

exports.register = function (server, options, next){


    server.route({
        path: '/api/v1/sync',
        method: 'PUT',
        config: {

            validate: {
                query: {
                    clientToken: Joi.string().min(1).required()
                },
                payload: Joi.object({
                    measurements: Joi.array().items(internals.measurementsSchema).required(),
                    logState:     Joi.array().items(internals.logStateSchema).required()
                })
            },

            payload: {
                output: 'data', // the incoming payload is read fully into memory
                parse: true,
                timeout: false
            }
        },

        handler: function (request, reply){

            const clientCode = Utils.getClientCode(request.query.clientToken);
            if (!clientCode){
                return reply(Boom.badRequest('invalid client code'));
            }

            // parallel upsert queries
            const sql = [];

            sql.push(`
                select * from upsert_measurements(
                    '${ JSON.stringify(request.payload.measurements) }',
                    '${ JSON.stringify({ clientCode: clientCode }) }'
                )
            `);

            sql.push(`
                select * from upsert_log_state(
                    '${ JSON.stringify(request.payload.logState) }',
                    '${ JSON.stringify({ clientCode: clientCode }) }'
                )
            `);

            //console.log("sql:\n", sql)

            Promise.all(sql.map((s) => Db.query(s)))
                .spread(function (measurements, logState){

                    //console.log(measurements, logState);

                    return reply({ 
                        measurements: measurements.map(internals.idProjection), 
                        logState: logState.map(internals.idProjection)
                        //ts: new Date()
                    });

                })
                .catch(function (err){

                    Utils.logErr(err, ['api-sync']);
                    return reply(err);
                });
        }
    });

    // example: /show-readings-new?client=permalab&table=agg&age=24
    // example: /show-readings-new?client=permalab&table=measurements&age=24
    server.route({
        path: '/show-readings-new',
        method: 'GET',
        config: {
            validate: {
                query: {
                    'client': Joi.string().required(),
                    'table': Joi.string().valid('agg', 'measurements').required(),
                    'age': Joi.number().integer().required()

                }
            }
        },
        handler: function (request, reply) {

            const clientCode = Utils.getClientCode(request.query.client);
            if (!clientCode){
                return reply(Boom.badRequest('invalid client'));
            }

            const query = Sql.getRecords(clientCode, request.query.table, request.query.age);
            console.log(query)

            Db.query(query)
                .then(function (data){

                    data.forEach((obj) => {

                        obj.ts = obj.ts.toISOString().slice(0, -5);
                    });

                    return reply(Utils.jsonMarkup(data));



                })
                .catch(function (err){

                    Utils.logErr(err, ['show-readings-new']);
                    return reply(err);
                });

        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
