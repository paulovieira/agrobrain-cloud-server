
 require("./_config/config");

var $ = require("jquery");
var Backbone = require("backbone");
var Mn = require("backbone.marionette");
// var Radio = require("backbone.radio");

var Main = require('./main/main');
var mainV = new Main({
    model: new Backbone.Model({
        clientName: window.ctx.clientName
    })
});

var mainR = new Mn.Region({ 
    el: $("div.wrapper")
});

mainR.show(mainV);

console.log("hello world @ dashboard " + new Date());
