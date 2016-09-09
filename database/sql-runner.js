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
    const tempDir = Path.join(__dirname, '__temp__' + String(Date.now()).substr(-6));

	// "mkdir" method from fs-extra ("If the parent hierarchy doesn't exist, it's created. Like mkdir -p")
    Fs.mkdirsSync(tempDir);

    const clientCodes = Config.get('clientTokens');
    const clientCodesValues = [];
    for (const key in clientCodes){
        clientCodesValues.push(clientCodes[key]);
    }

    Glob.sync('database/1_tables/*t_measurements.sql').forEach(function (scriptPath){

        const script = Fs.readFileSync(scriptPath, 'utf8');

        // we want to make a replacement with the following pattern
        const before = 'create table if not exists t_measurements(';
        let after    = 'create table if not exists t_measurements_XXXX(';

        for (let i = 0; i < clientCodesValues.length; ++i){
            after = `create table if not exists t_measurements_${ clientCodesValues[i] }(`;
        }

        const tempFile = Path.join(tempDir, 't_measurements.sql');
        Fs.writeFileSync(tempFile, script.replace(before, after));

        try {
            Psql({ file: tempFile });
        }
        catch (err){
            process.exit();
        }
    });

    Glob.sync('database/1_tables/*t_agg.sql').forEach(function (scriptPath){

        const script = Fs.readFileSync(scriptPath, 'utf8');

        const before = 'create table if not exists t_agg(';
        let after    = 'create table if not exists t_agg_XXXX(';

        for (let i = 0; i < clientCodesValues.length; ++i){
            after = `create table if not exists t_agg_${ clientCodesValues[i] }(`;
        }

        const tempFile = Path.join(tempDir, 't_agg.sql');
        Fs.writeFileSync(tempFile, script.replace(before, after));

        try {
            Psql({ file: tempFile });
        }
        catch (err){
            process.exit();
        }
    });

    Glob.sync('database/1_tables/*t_log_state.sql').forEach(function (scriptPath){

        const script = Fs.readFileSync(scriptPath, 'utf8');

        const before = 'create table if not exists t_log_state(';
        let after    = 'create table if not exists t_log_state_XXXX(';

        for (let i = 0; i < clientCodesValues.length; ++i){
            after = `create table if not exists t_log_state_${ clientCodesValues[i] }(`;
        }

        const tempFile = Path.join(tempDir, 't_log_state.sql');
        Fs.writeFileSync(tempFile, script.replace(before, after));

        try {
            Psql({ file: tempFile });
        }
        catch (err){
            process.exit();
        }

    });

    // "remove" method from fs-extra ("directory can have contents")
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
    dbname: Config.get('db:postgres:database'),
    username: Config.get('db:postgres:username')
});

internals.createPreRequisites();
//internals.createTables();
//internals.createFunctions();

//console.log(Chalk.green.bold('\nsql scripts ran successfully!'));
console.log(Chalk.red.bold('\nSEE TODO!'));
