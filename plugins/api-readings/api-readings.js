'use strict';

//var Fs = require("fs");
const Path = require('path');
const Config = require('nconf');
const Datastore = require('nedb');
//const Hoek = require('hoek');
const Joi = require('joi');
//const JSON5 = require('json5');
//const Nunjucks = require('hapi-nunjucks');
//const Nunjucks = require('/home/pvieira/github/hapi-nunjucks/index.js');
//const Pre = require('../../server/common/prerequisites');
const Boom = require('boom');
//const _ = require('underscore');
//const Glob = require('glob');
const Utils = require('../../utils/util');

//const Config = require('nconf');
const JsonMarkup = require('json-markup');

//const Promise = require('bluebird');
//const CsvStringify = Promise.promisify(require('csv-stringify'));
const CsvStringify = require('csv-stringify');
const Db = require('../../database');
//const Promise = require('bluebird');
//const execAsync = Promise.promisify(require('child_process').exec, { multiArgs: true });

const internals = {};

internals['oneHour'] = 60 * 60 * 1000;
internals['oneDay'] = 24 * 60 * 60 * 1000;

internals.cacheInterval = 5 * 60 * 1000;  // 5 minutes
//internals.cacheInterval = 10*1000;  // 10 seconds
internals.phantomScript = Path.join(__dirname, 'phantom.js');  

internals.db = new Datastore({ filename: Path.join(Config.get('rootDir'), 'database', 'readings-test.json'), autoload: true });

internals.getJsonHtml = function (content){

    const html = `
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

    return html;
};

internals.measurementSchema = Joi.object({
    sid: Joi.number().integer().required(),
    value: Joi.number().required(),
    // if more measurement types are added, we have to update here and in the sql template
    type: Joi.string().required(),
    desc: Joi.string().allow([''])
});

exports.register = function (server, options, next){


    // insert measurements into a test table (client 0003)

    // http://localhost:8000/api/v1/readings?mac=aa-bb-cc&battery=294.12&data[0][sid]=1&data[0][value]=20.1&data[0][type]=t&data[0][desc]=microfone_1

    // http://spinon.ddns.net/api/v1/readings?mac=aa-bb-cc&battery=294.12&data[0][sid]=1&data[0][value]=20.1&data[0][type]=t&data[0][desc]=microfone_1
    server.route({
        path: '/api/v1/readings',
        method: 'GET',
        config: {

            validate: {

                query: {
                    mac: Joi.string().required(),
                    battery: Joi.number(),
                    data: Joi.array().items(internals.measurementSchema).min(1).required()
                },

                options: {
                    allowUnknown: true
                }
            }

        },

        handler: function (request, reply) {

            console.log(request.query);
            //return reply("xyz");

            const mac = request.query.mac;
            request.query.data.forEach((obj) => {

                // mac is not part of the data objects
                obj.mac = mac;

                // the keys in the query string and the names of the columns in db do not match;
                // correct in the data objects
                obj.description = obj.desc;  // the column in the table is 'description'
                obj.val = obj.value;  // the column in the table is 'val'
                
                // note: the other keys in the query string match the names of the columns
            });


            const query = `
                select * from insert_measurements_test(' ${ JSON.stringify(request.query.data) } ')
            `;
            //console.log(query);

            Db.query(query)
                .then(function (result){

                    return reply({ newRecords: result.length, ts: new Date().toISOString() });
                })
                .catch(function (err){

                    Utils.logErr(err, ['api-measurements']);
                    return reply(err);
                });
        }
    });

/*
    server.route({
        path: "/api/readings",
        method: "GET",
        config: {
            handler: function(request, reply) {

                request.query.id = request.query.id || null;
                request.query.t1 = request.query.t1 || null;
                request.query.t2 = request.query.t2 || null;
                request.query.h1 = request.query.h1 || null;
                request.query.h2 = request.query.h2 || null;

                var doc = { 
                    ts: Date.now(),
                    time: new Date().toISOString(),
                    id: request.query.id,
                    t1: request.query.t1,
                    t2: request.query.t2,
                    h1: request.query.h1,
                    h2: request.query.h2,
                };

                internals.db.insert(doc, function (err, newDoc) {

                    if(err){
                        return reply(Boom.badImplementation(err));
                    }

                    return reply(newDoc);
                });
               
               
            },

            validate: {
                query: {
                    id: Joi.string(),
                    t1: Joi.number(),
                    t2: Joi.number(),
                    h1: Joi.number(),
                    h2: Joi.number(),

                }
            }

        }
    });
*/
/*
    server.route({
        path: "/show-readings",
        method: "GET",
        config: {
            handler: function(request, reply) {

                var queryConditions = {};
                var age = request.query.age;
                console.log(age)

                // ...?age=2d
                var agePeriod = age.substr(-1);                    
                if((agePeriod==='d' || agePeriod==='h') && age.length >= 2){
                    var ageValue = age.substring(0, age.length-1);

                    var timeLength;
                    if(agePeriod==='h'){
                        timeLength = Number(ageValue)*internals['oneHour']
                    }
                    else{
                        timeLength = Number(ageValue)*internals['oneDay']
                    }

                    var d = new Date(Date.now() - timeLength);
                    queryConditions['ts'] = { $gt: d.getTime() };
                }

                internals.db
                    .find(queryConditions, {_id: 0, ts: 0})
                    .sort({ 
                        "ts": request.query.sort==="asc" ? 1 : -1 
                    })
                    .exec(function (err, docs) {
                        
                        // docs = docs.map(function(doc){
                        //     return {
                        //         time: doc.time,
                        //         h1: doc.h1,
                        //         h2: doc.h2,
                        //         t1: doc.t1,
                        //         t2: doc.t2,
                        //         id: doc.id
                        //     }
                        // });

                        if(request.query.format==="json"){

                            var html = internals.getJsonHtml(JsonMarkup(docs));
                            //console.log(html);

                            return reply(html)
                         }
                        else if(request.query.format==="csv"){

                            CsvStringify(docs, {header: true}, function(err, csv){

                                return reply(csv)
                                    .code(200)
                                    .header('content-type', 'text/csv')
                                    .header('content-disposition', 'attachment; filename="spinon_readings.csv"')
                            })  
                        }
                    });
               
            },

            validate: {
                query: {
                    "order-by": Joi.any().valid("ts").default("ts"),
                    "sort": Joi.any().valid("asc", "desc").default("asc"),
                    "format": Joi.any().valid("csv", "json").default("json"),
                    "age": Joi.any()

                }
            }

        }
    });
*/
    // example: /show-readings-new?client=permalab&table=measurements   (will show records from the last 24 hours by default)
    // example: /show-readings-new?client=permalab&table=measurements&age=48
    server.route({
        path: '/show-readings-new',
        method: 'GET',
        config: {
            validate: {
                query: {
                    'client': Joi.string().required(),
                    'age': Joi.number().integer().min(1).default(24).optional(), 
                    'table': Joi.string().valid('measurements').required()
                }
            }
        },
        handler: function (request, reply) {

            const clientCode = Utils.getClientCode(request.query.client);
            if (!clientCode){
                return reply(Boom.badRequest('invalid client'));
            }

            const queryOptions = {
                clientCode: clientCode,
                age: request.query.age,
                table: request.query.table
            };

            const query = `
                select * from read_measurements(' ${ JSON.stringify(queryOptions) } ')
            `;
            console.log(query);

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



    server.expose('nedb', internals.db);

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
