//require("./menu-main.css");

var $ = require("jquery");
var Backbone = require("backbone");
var Mn = require("backbone.marionette");
var Radio = require("backbone.radio");

var StateV = require("../state/state");
var ControlV = require("../control/control");

var Main = Mn.LayoutView.extend({
    template: require('./main.html'),
    regions: {
        "content": "div.main-container"
    },
    ui: {
        //'anchor': 'li > a',
        'mainMenuAnchor': 'li[data-main-menu="true"] > a'
    },
    events: {
        'click @ui.mainMenuAnchor': 'route'
    },
    route: function(e){

        var view;
        var href = $(e.currentTarget).attr('href');

        //debugger;
        if (href === '#pivot-permalab'){
            view = new ControlV({
                model: new Backbone.Model(window.ctx.pivots[0])
            });
        }
        else if (href === '#state'){
            view = new StateV({
                model: new Backbone.Model(window.ctx.pivots[0])
            });
        }
        else {
            throw new Error('invalid href')
        }

        this.getRegion('content').show(view)

    },
    onBeforeAttach: function(){

        //debugger;        
        var stateV = new StateV({
            model: new Backbone.Model(window.ctx.pivots[0])
        })
        this.getRegion('content').show(stateV)

        
    }
});

module.exports = Main;
