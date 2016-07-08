//var Fs = require("fs");
var Path = require("path");
var Config = require("nconf");
var Datastore = require('nedb');
//var Hoek = require("hoek");
var Joi = require("joi");
//var JSON5 = require("json5");
var Nunjucks = require("hapi-nunjucks");
//var Nunjucks = require("/home/pvieira/github/hapi-nunjucks/index.js");
//var Pre = require("../../server/common/prerequisites");
var Boom = require("boom");
var _ = require("underscore");
var Glob = require("glob");
//var Utils = require("../../server/utils/utils");
//var Cp = require("child_process");
var Config = require('nconf');
var JsonMarkup = require('json-markup');

//var Promise = require('bluebird');
//var CsvStringify = Promise.promisify(require("csv-stringify"));
var CsvStringify = require("csv-stringify");

var Promise = require("bluebird");
var execAsync = Promise.promisify(require("child_process").exec, {multiArgs: true})

var internals = {};

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
}


internals.aggSchema = Joi.object({
    'id': Joi.number().integer().required(),
    'mac': Joi.string().required(),
    'sid': Joi.number().integer().required(),
    'type': Joi.string().valid('t', 'h').required(),
    'description': Joi.string().required(),
    'avg': Joi.number().required(),
    'stddev': Joi.number().required(),
    'n': Joi.number().integer().required(),
    'ts': Joi.string().required()
});

exports.register = function(server, options, next){


    server.route({
        path: "/api/v1/sync",
        method: "PUT",
        config: {

            validate: {
                query: {
                    clientToken: Joi.string().required()
                },
                payload: Joi.array().items(internals.aggSchema).required()
            },

            payload: {
                output: 'data', // the incoming payload is read fully into memory
                parse: true,
                timeout: false
            }

        },

        handler: function(request, reply) {
/*
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
*/

            console.log('clientToken: ', request.query.clientToken)
            console.log('payload: ', request.payload)

            return reply({status: "ok"});
           
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
