'use strict';

const Path = require('path');
const Config = require('nconf');
const Datastore = require('nedb');
const Pg = require('pg');
const Joi = require('joi');
const Boom = require('boom');
//const _ = require('underscore');
const Utils = require('../../utils/util');
const Sql = require('./sql-templates');



//const Promise = require('bluebird');
//const CsvStringify = Promise.promisify(require('csv-stringify'));
//const CsvStringify = require('csv-stringify');

const Promise = require('bluebird');
const execAsync = Promise.promisify(require('child_process').exec, {multiArgs: true})

const internals = {};

internals['oneHour'] = 60*60*1000;
internals['oneDay'] = 24*60*60*1000;

internals.cacheInterval = 5*60*1000;  // 5 minutes
//internals.cacheInterval = 10*1000;  // 10 seconds
internals.phantomScript = Path.join(__dirname, "phantom.js");  

internals.db = new Datastore({ filename: Path.join(Config.get("rootDir"), "database", 'readings-new.json'), autoload: true });


internals.measurementsSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'mac': Joi.string().required(),
    'sid': Joi.number().integer().required(),
    'type': Joi.string().valid('t', 'h').required(),
    'description': Joi.string().required(),
    'val': Joi.number().required(),
    'ts': Joi.string().required(),
    'battery': Joi.number().allow([null]),
    'agg': Joi.boolean().required()
});

internals.logStateSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'event': Joi.any().required(),
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

            //console.log('clientToken: ', request.query.clientToken)
            //console.log('payload: ', request.payload)


            const clientCode = Utils.getClientCode(request.query.clientToken);

            // parallel upsert queries
            const sql = [];
            sql.push(`select * from upsert_measurements(' ${ JSON.stringify(request.payload.measurements) } ')`);
            sql.push(`select * from upsert_log_state('    ${ JSON.stringify(request.payload.logState) } ')`);

            Promise.all(sql.map((s) => Db.query(s)))
                .spread(function(measurements, logState){

                    console.log(measurements, logState);

                    return reply({ 
                        measurements: measurements, 
                        logState: logState, 
                        ts: new Date()
                    });
/*
                    // update payload in the wreck options (the other properties are the same)
                    internals.wreckOptions.payload = undefined;
                    internals.wreckOptions.payload = JSON.stringify({
                        measurements: measurements,
                        logState: logState 
                    });

                    return Wreck.putAsync(internals.syncPath, internals.wreckOptions);
*/
                    // TODO: promisify wreck; send data; handle response; handle error; 

                })
                .catch(function(err){

                    console.log(Object.keys(err))
                    Utils.logErr(err, ['sync']);
                    return reply(err);
                });


/*
            Pg.connect(Config.get('db:postgres'), function (err, pgClient, done) {

                let boom;
                if (err) {
                    boom = Boom.badImplementation();
                    boom.output.payload.message = err.message;
                    return reply(boom);
                }

                const clientCode = Utils.getClientCode(request.query.clientToken);

                pgClient.query(Sql.upsertAgg(clientCode, request.payload.agg), function (err, result) {

                    if (err) {
                        boom = Boom.badImplementation();
                        boom.output.payload.message = err.message;
                        done();
                        return reply(boom);
                    }

                    pgClient.query(Sql.upsertMeasurements(clientCode, request.payload.measurements), function (err2, result2) {

                        if (err2) {
                            boom = Boom.badImplementation();
                            boom.output.payload.message = err2.message;
                            return reply(boom);
                        }

                        pgClient.query(Sql.upsertLogState(clientCode, request.payload.logState), function (err3, result3) {

                            done();

                            if (err3) {
                                Utils.logErr(err3, ['query']);
                                boom = Boom.badImplementation();
                                boom.output.payload.message = err3.message;
                                return reply(boom);
                            }

                            return reply({ 
                                agg: result.rows, 
                                measurements: result2.rows, 
                                logState: result3.rows, 
                                ts: new Date().toISOString() 
                            });
                        });

                    });
                });
            });
*/


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

            Pg.connect(Config.get('db:postgres'), function (err, pgClient, done) {

                let boom;
                if (err) {
                    boom = Boom.badImplementation();
                    boom.output.payload.message = err.message;
                    return reply(boom);
                }

                pgClient.query(Sql.getRecords(clientCode, request.query.table, request.query.age), function (err, result) {

                    done();

                    if (err) {
                        boom = Boom.badImplementation();
                        boom.output.payload.message = err.message;
                        return reply(boom);
                    }

                    result.rows.forEach((obj) => {

                        obj.ts = obj.ts.toISOString().slice(0, -5);
                    });

                    return reply(Utils.jsonMarkup(result.rows));

                });
            });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
