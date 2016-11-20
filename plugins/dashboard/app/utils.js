var $ = require('jquery');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');

module.exports.getRandom = function getRandom(min, max){

    if (typeof min !== 'number'){
        min = 300;
    }
    if (typeof max !== 'number'){
        max = 600;
    }

    return Math.round(min + (Math.random()) * (max - min))
};



module.exports.resetDOM = function resetDOM(){

    // start with an empty dom

    $('body').empty();
    $('body').html('<div data-id="initial-loading">Please wait...</div>');
};

module.exports.createRootRegion = function createRootRegion(){

    $('body').append('<div data-app-id="root-region">  </div>');

    var rootR = new Mn.Region({
        el: '[data-app-id="root-region"]'
    });

    Radio.channel('public').reply('rootR', rootR);
};

module.exports.createModalRegion = function createModalRegion(){

    $('body').append('<div data-app-id="modal-region" class="modal x-fade" tabindex="-1" role="dialog">  </div>');

    var modalR = new Mn.Region({
        el: '[data-app-id="modal-region"]'
    });
    
    Radio.channel('public').reply('modalR', modalR);
};

/*
module.exports.clearStorage = function clearStorage(){

    window.localStorage.removeItem('agency-token');
    window.localStorage.removeItem('connectionName');
};


// check if a "fake" query string was given with a "token=..."; if so store it
// in the local storage; this method is executed just before the router is started

// example: /Agency#?token=...
// example: /Agency#/?token=...
// example: /Agency#/list/123?token=...

module.exports.setCredentialsFromQueryString = function setCredentialsFromQueryString(s){
    
    s = s || '';
    var a = s.split('?');
    if (a.length !== 2){
        return;
    }

    a[1].split('&').forEach(function(qsPair){

        var parts = qsPair.split('=');
        if(parts.length === 2){
            var key = parts[0];
            var value = parts[1];

            if(key === 'token'){
                window.localStorage.setItem('agency-token', value);
            }
            else if(key === 'connectionName'){
                window.localStorage.setItem('connectionName', value);
            }
        }
    });
};

module.exports.getToken = function getToken(){

    return window.localStorage.getItem('agency-token') || '';
};

module.exports.getConnectionName = function getConnectionName(){

    return window.localStorage.getItem('connectionName') || '';
};

module.exports.tokenIsIntact = function tokenIsIntact(){

    var currentToken = module.exports.getToken();
    return window.HOST.initialToken === currentToken;
};
*/
