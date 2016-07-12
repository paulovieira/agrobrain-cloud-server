'use strict';

const Path = require('path');
const Config = require('nconf');
const Datastore = require('nedb');
const Pg = require('pg');
const Joi = require('joi');
const Boom = require('boom');
const _ = require('underscore');
const JsonMarkup = require('json-markup');
const Utils = require('../../util/utils');
const Sql = require('./sql-templates');



//const Promise = require('bluebird');
//const CsvStringify = Promise.promisify(require('csv-stringify'));
const CsvStringify = require('csv-stringify');

const Promise = require('bluebird');
const execAsync = Promise.promisify(require('child_process').exec, {multiArgs: true})

const internals = {};

internals['oneHour'] = 60*60*1000;
internals['oneDay'] = 24*60*60*1000;

internals.cacheInterval = 5*60*1000;  // 5 minutes
//internals.cacheInterval = 10*1000;  // 10 seconds
internals.phantomScript = Path.join(__dirname, "phantom.js");  

internals.db = new Datastore({ filename: Path.join(Config.get("rootDir"), "database", 'readings-new.json'), autoload: true });

internals.getJsonHtml = function(content){

    var s = `
<html>
<head>
<style>

.json-markup {
    line-height: 17px;
    font-size: 13px;
    font-family: monospace;
    white-space: pre;
}
.json-markup-key {
    font-weight: bold;
}
.json-markup-bool {
    color: firebrick;
}
.json-markup-string {
    color: green;
}
.json-markup-null {
    color: gray;
}
.json-markup-number {
    color: blue;
}

</style>
</head>
<body>

    ${ content }

</body>
</html>
`;

    return s;
};


internals.aggSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'mac': Joi.string().required(),
    'sid': Joi.number().integer().required(),
    'type': Joi.string().valid('t', 'h').required(),
    'description': Joi.string().required(),
    'avg': Joi.number().required(),
    'stddev': Joi.number().required(),
    'n': Joi.number().integer().required(),
    'ts': Joi.string().required(),
    'battery': Joi.number().allow([null])
});

exports.register = function(server, options, next){


    server.route({
        path: '/api/v1/sync/agg',
        method: 'PUT',
        config: {

            validate: {
                query: {
                    clientToken: Joi.string().required()
                },
                payload: Joi.array().items(internals.aggSchema).required(),
                // options: {
                //     allowUnknown: true
                // }

            },

            payload: {
                output: 'data', // the incoming payload is read fully into memory
                parse: true,
                timeout: false
            }

        },

        handler: function(request, reply) {

            //console.log('clientToken: ', request.query.clientToken)
            //console.log('payload: ', request.payload)

            Pg.connect(Config.get('db:postgres'), function (err, pgClient, done) {

                let boom;
                if (err) {
                    boom = Boom.badImplementation();
                    boom.output.payload.message = err.message;
                    return reply(boom);
                }

                const tableCode = Utils.getTableCode(request.query.clientToken);
                var upsert = Sql.upsertAgg(tableCode, request.payload);

                pgClient.query(Sql.upsertAgg(tableCode, request.payload), function (err, result) {

                    done();

                    if (err) {
                        boom = Boom.badImplementation();
                        boom.output.payload.message = err.message;
                        return reply(boom);
                    }

                    if (result.rowCount === 0){
                        boom = Boom.badImplementation();
                        boom.output.payload.message = 'result.rowCount should be > 0 (data was not saved?)';
                        return reply(boom);
                    }

                    return reply({ records: result.rows, ts: new Date().toISOString() });
                });
            });
           
        },
    });


    server.route({
        path: "/show-readings-new",
        method: "GET",
        config: {
            validate: {
                query: {
                    "order-by": Joi.any().valid("ts").default("ts"),
                    "sort": Joi.any().valid("asc", "desc").default("asc"),
                    "format": Joi.any().valid("csv", "json").default("json"),
                    "age": Joi.any()

                }
            }
        },
        handler: function(request, reply) {

            return reply('to be done');

           
        },
    });


    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
