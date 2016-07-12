'use strict';

const Config = require('nconf');

const internals = {};

exports.getTableCode = function (token){

    return Config.get('tables')[token];
};


