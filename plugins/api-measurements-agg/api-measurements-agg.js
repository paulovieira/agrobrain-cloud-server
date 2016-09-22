'use strict';

const Path = require('path');
const Config = require('nconf');
const Joi = require('joi');
const Boom = require('boom');
const Json2csv = require('json2csv');
const Fecha = require('fecha');
const Nunjucks = require('hapi-nunjucks');
const Utils = require('../../utils/util');
const Db = require('../../database');


const internals = {};

internals.defaultDate = new Date(2016,0,1);


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

    server.route({
        path: '/measurements',
        method: 'GET',
        config: {
        },
        handler: function (request, reply) {

            const context = { 
                env: Config.get('env'),
            };

            return reply.view(Path.join(__dirname, 'templates/measurements.html'), { ctx: context });
        }
    });


    //  /api/v1/measurements-agg?clientName=XXXX&start=16-09-01&end=16-09-02&timeInterval=1&format=json
    server.route({
        path: '/api/v1/measurements-agg',
        method: 'GET',
        config: {

            validate: {
                query: {
                    clientName: Joi.string().min(1).required(),
                    start: Joi.date().format(['YY-MM-DD', 'YYYY-MM-DD']).default(internals.defaultDate),
                    end: Joi.date().format(['YY-MM-DD', 'YYYY-MM-DD']).default(internals.defaultDate),
                    timeInterval: Joi.number().integer().valid([1,2,3,4,6,12,24]).default(1),
                    format: Joi.string().valid(['json', 'csv']).default('json'),
                    stddev: Joi.boolean().default(false)
                }
            }
        },

        handler: function (request, reply){

            const clientCode = Utils.getClientCode(request.query.clientName);
            if (!clientCode){
                return reply(Boom.badRequest('invalid client code'));
            }

            const queryOptions = {
                clientCode: clientCode, 
                start: request.query.start, 
                end: request.query.end,
                timeInterval: request.query.timeInterval,
                stddev: request.query.stddev
            };
            console.log(queryOptions);


            const query = `
                select * from read_measurements_agg(' ${ JSON.stringify(queryOptions) } ')
            `;

            Db.query(query)
                .then(function (result){

                    // cont how many readings for each (mac,sid,type)
                    const countKeys = {};
                    
                    for (let i = 0; i < result.length; ++i){

                        const obj = result[i];

                        result[i].ts = Fecha.format(result[i].ts, 'YYYY-DD-MM HH:mm');
                        for (let j = 0; j < obj.data.length; ++j){

                            const obj2 = obj.data[j];
                            obj[obj2['key']] = obj2['val_avg'];
                            countKeys[obj2['key']] = countKeys[obj2['key']] || 0;
                            countKeys[obj2['key']]++;
                        }

                        delete obj['data'];
                    }

                    // second loop to add the missing properties
                    const keys = Object.keys(countKeys);
                    for (let i = 0; i < result.length; ++i){
                        for (let j = 0; j < keys.length; ++j){
                            if (!result[i][keys[j]] && result[i][keys[j]] !== 0){
                                result[i][keys[j]] = null;
                            }
                        }
                    }

                    if (request.query.format === 'json'){
                        return reply(result);
                    }

                    // else, output format is csv (show a download dialog in the browser)
                    keys.unshift('ts');
                    const csv = Json2csv({ data: result, fields: keys });

                    const filename = `measurements_${ Fecha.format(request.query.start, 'YYMMDD') }_${ Fecha.format(request.query.end, 'YYMMDD') }_${ request.query.timeInterval }h.csv`

                    return reply(csv)
                        .code(200)
                        .header('content-type', 'text/csv')
                        .header('content-disposition', `attachment; filename="${ filename }"`)
                    
                })
                .catch(function (err){

                    Utils.logErr(err, ['api-measurements']);
                    return reply(err);
                });
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: ['vision']
};
