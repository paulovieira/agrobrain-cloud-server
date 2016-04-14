var Path = require("path");
//var Fs = require("fs");

var internals = {};

internals.rootDir  = Path.join(__dirname, "..");

module.exports = {

    host: "localhost",
    port: 6010,
    rootDir: internals.rootDir,

/*
    publicUri: "localhost",  // host
    publicPort: 6001,  // probably 80
    publicIp: "127.0.0.1",



    email: {
        send: false,
        moderatorAddress: "moderadores@redeconvergir.net",
        moderatorName: "Rede Convergir - moderadores",
        infoAddress: "info@redeconvergir.net",
        infoName: "Rede Convergir - info",

        mandrill: {
            apiKey: ""
        },
        //templatesDir: Path.join(internals.rootDir, "server/email-mandrill/templates"),
    },

    db: {

        postgres: {
            host: "",
            port: 5432,
            database: "",
            username: "",
            password: "",

            getConnectionString: function(){
                return "postgres://" +
                        this.username + ":" +
                        this.password + "@" +
                        this.host + ":" + this.port +  "/" +
                        this.database;
            }
        },
    },

    hapi: {

        ironPassword: "",


        // documentation: https://github.com/hapijs/joi#validatevalue-schema-options-callback
        joi: {
            abortEarly: true,  // returns all the errors found (does not stop on the first error)
            stripUnknown: true,  // delete unknown keys; this means that when the handler executes, only the keys that are explicitely stated
            // in the schema will be present in request.payload and request.query 
            convert: true

        },
    },

    apiPrefix: {
        v1: "/api/v1"
    },

    dashboard: {
        user: "",
        password: ""
    }
*/
};

