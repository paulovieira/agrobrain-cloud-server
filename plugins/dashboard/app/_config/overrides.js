//var $ = require('jquery');
var _ = require('underscore');
//var Backbone = require('backbone');
//debugger;
var Mn = require('backbone.marionette');
var Marionette = Mn;
//var Radio = require("backbone.radio");


// override the default renderer (this works because Marionette.renderer has been
// changed according to pr #2911 (add a custom renderer
//debugger;
Mn.View.prototype.renderer = function(template, data) {
    //debugger;
    if (!template) {
        throw new Mn.Error({
            name: 'TemplateNotFoundError',
            message: 'Cannot render the template since its false, null or undefined.'
        });
    }

    try {
        // nunjucks will look for the pre-compiled template at window.nunjucksPrecompiled;
        // more details here: https://mozilla.github.io/nunjucks/api.html#browser-usage
        // however here we are using webpack's "nunjucks-loader"
        return template.render(data);
        
    } catch (err) {
        throw new Mn.Error({
            name: 'NunjucksError',
            message: err.message
        });
    }
};

Mn.ItemView.prototype._renderTemplate = function() {
  var template = this.getTemplate();

  // Allow template-less item views
  if (template === false) {
    return;
  }

  if (!template) {
    throw new Marionette.Error({
      name: 'UndefinedTemplateError',
      message: 'Cannot render the template since it is null or undefined.'
    });
  }

  // Add in entity data and template helpers
  var data = this.mixinTemplateHelpers(this.serializeData());

  // CHANGED 16.03.10: add custom renderer (pr #2911)
  // Render and add to el
  //var html = Marionette.Renderer.render(template, data, this);

  var html = '';
  
  // micro-optimization: _.isFunction is called only if we actually have
  // a custom renderer
  if (this.renderer && _.isFunction(this.renderer)) {
    html = this.renderer(template, data);
  } else {
    html = Marionette.Renderer.render(template, data, this);
  }

  this.attachElContent(html);

  return this;
};

Mn.Region.prototype.show = function(view, options) {

  if (!this._ensureElement()) {
    return;
  }

  this._ensureViewIsIntact(view);
  Marionette.MonitorDOMRefresh(view);

  var showOptions     = options || {};
  var isDifferentView = view !== this.currentView;
  var preventDestroy  = !!showOptions.preventDestroy;
  var forceShow       = !!showOptions.forceShow;

  // We are only changing the view if there is a current view to change to begin with
  var isChangingView = !!this.currentView;

  // Only destroy the current view if we don't want to `preventDestroy` and if
  // the view given in the first argument is different than `currentView`
  var _shouldDestroyView = isDifferentView && !preventDestroy;

  // Only show the view given in the first argument if it is different than
  // the current view or if we want to re-show the view. Note that if
  // `_shouldDestroyView` is true, then `_shouldShowView` is also necessarily true.
  var _shouldShowView = isDifferentView || forceShow;

  if (isChangingView) {
    this.triggerMethod('before:swapOut', this.currentView, this, options);
  }


  if (this.currentView && isDifferentView) {
    delete this.currentView._parent;
  }

  if (_shouldDestroyView) {
    this.empty();

  // A `destroy` event is attached to the clean up manually removed views.
  // We need to detach this event when a new view is going to be shown as it
  // is no longer relevant.
  } else if (isChangingView && _shouldShowView) {
    this.currentView.off('destroy', this.empty, this);
  }

  if (_shouldShowView) {

    // We need to listen for if a view is destroyed
    // in a way other than through the region.
    // If this happens we need to remove the reference
    // to the currentView since once a view has been destroyed
    // we can not reuse it.
    view.once('destroy', this.empty, this);

    // make this region the view's parent,
    // It's important that this parent binding happens before rendering
    // so that any events the child may trigger during render can also be
    // triggered on the child's ancestor views
    view._parent = this;

    // CHANGE 16.10.04
    //debugger;
    if(!showOptions.preventRender){
      this._renderView(view);
    }
    

    if (isChangingView) {
      this.triggerMethod('before:swap', view, this, options);
    }

    this.triggerMethod('before:show', view, this, options);
    Marionette.triggerMethodOn(view, 'before:show', view, this, options);

    if (isChangingView) {
      this.triggerMethod('swapOut', this.currentView, this, options);
    }

    // An array of views that we're about to display
    var attachedRegion = Marionette.isNodeAttached(this.el);

    // The views that we're about to attach to the document
    // It's important that we prevent _getNestedViews from being executed unnecessarily
    // as it's a potentially-slow method
    var displayedViews = [];

    var attachOptions = _.extend({
      triggerBeforeAttach: this.triggerBeforeAttach,
      triggerAttach: this.triggerAttach
    }, showOptions);

    if (attachedRegion && attachOptions.triggerBeforeAttach) {
      displayedViews = this._displayedViews(view);
      this._triggerAttach(displayedViews, 'before:');
    }

    this.attachHtml(view);
    this.currentView = view;

    if (attachedRegion && attachOptions.triggerAttach) {
      displayedViews = this._displayedViews(view);
      this._triggerAttach(displayedViews);
    }

    if (isChangingView) {
      this.triggerMethod('swap', view, this, options);
    }

    this.triggerMethod('show', view, this, options);
    Marionette.triggerMethodOn(view, 'show', view, this, options);

    return this;
  }

  return this;
};

// handle the case where the model has a collection as an attribute;
// we want the call to .serializeData to return an array of simple 
// js objects containing the data in that attribute

Marionette.View.prototype.serializeModel = function serializeModel(model) {
  
  var data = model.toJSON.apply(model, _.rest(arguments));
  this.model.keys().forEach(function(key){

      var value = this.model.get(key);
      if (value instanceof Backbone.Collection){
          data[key] = value.toJSON.apply(value, _.rest(arguments));
      }
  }, this);

  return data;
};


