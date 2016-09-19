/*
TODO: the sql runner should execute the patches in alphabetical order, and also 
take into account the dependencies and incompatibilities
*/
'use strict';

require('../config/load');

const Path = require('path');
const Fs = require('fs-extra');
const Config = require('nconf');
const Glob = require('glob');
const Chalk = require('chalk');
const Psql = require('psql-wrapper');

const internals = {};

internals.createPreRequisites = function (){

    // the order in the array returned by glob is lexicographic, so we can define the order
    // that the scripts will run by simply pre-pending numbers in the filename
    Glob.sync('database/0_prerequisites/*.sql').forEach((scriptPath) => {

        try {
            Psql({ file: scriptPath });
        }
        catch (err){
            process.exit();
        }

    });
};

// the scripts in database/1_tables/*.sql will be executed repeatedly for each client
internals.createTables = function (){

	// temporary directory with random name
    const tempDir = Path.join(__dirname, '__temp__' + String(Math.random()).substr(-6));

	// method from fs-extra ("If the parent hierarchy doesn't exist, it's created. Like mkdir -p")
    Fs.mkdirsSync(tempDir);

    const clientTokens = Config.get('clientTokens')
    const tokens = Object.keys(clientTokens).map((key) => clientTokens[key]);

    // add an 'empty token' to make sure there is 1 canonical version of the tables
    // (it will be empty)
    tokens.push('canonical');

    Glob.sync('database/1_tables/*.sql').forEach(function (scriptPath){

        const script = Fs.readFileSync(scriptPath, 'utf8');
        for (let i = 0; i < tokens.length; ++i){

            // replace 'XXXX' with the correct code, write to a temporary file and call psql
            const tempFilename = `${ Path.basename(scriptPath, '.sql') }_${ tokens[i] }.sql`;
            const pathTempFilename = Path.join(tempDir, tempFilename);
            let scriptReplaced;
            
            if (tokens[i] !== 'canonical'){
                scriptReplaced = script.replace(/XXXX/g, tokens[i]);
            }
            else {
                scriptReplaced = script.replace(/(_XXXX|XXXX|-XXXX)/g, '');
            }
      
            Fs.writeFileSync(pathTempFilename, scriptReplaced);

            try {
                Psql({ file: pathTempFilename });
            }
            catch (err){
                process.exit();
            }
        }
    });

    //Fs.removeSync(tempDir);

};

internals.createFunctions = function (){

    // the order in the array returned by glob is lexicographic, so we can define the order
    // that the scripts will run by simply pre-pending numbers in the filename
    Glob.sync('database/2_functions/*.sql').forEach((scriptPath) => {

        try {
            Psql({ file: scriptPath });
        }
        catch (err){
            process.exit();
        }

    });
};


Psql.configure({
    port: String(Config.get('db:postgres:port')),
    dbname: Config.get('db:postgres:database'),
    username: Config.get('db:postgres:username')
});

internals.createPreRequisites();
internals.createTables();
internals.createFunctions();

console.log(Chalk.green.bold('\nsql scripts ran successfully!'));

