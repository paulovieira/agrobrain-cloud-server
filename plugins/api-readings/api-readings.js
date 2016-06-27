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

internals.db = new Datastore({ filename: Path.join(Config.get("rootDir"), "database", 'readings-test.json'), autoload: true });
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



exports.register = function(server, options, next){

  

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
    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
