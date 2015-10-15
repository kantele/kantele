// Generated by CoffeeScript 1.10.0
var EditForm, app;

app = require('./index');

app.get('/edit', function(page, model, params, next) {
  return page.render('edit');
});

app.get('/edit/:id', function(page, model, params, next) {
  var item;
  item = model.at("items." + params.id);
  return item.subscribe(function(err) {
    if (err) {
      return next(err);
    }
    if (!item.get()) {
      return next();
    }
    model.ref('_page.item', item);
    return page.render('edit');
  });
});

EditForm = (function() {
  function EditForm() {}

  EditForm.prototype.done = function() {
    var checkName, model;
    model = this.model;
    if (!model.get('item.name')) {
      checkName = model.on('change', 'item.name', function(value) {
        if (!value) {
          return;
        }
        model.del('nameError');
        model.removeListener('change', checkName);
      });
      model.set('nameError', true);
      this.nameInput.focus();
      return;
    }
    if (!model.get('item.id')) {
      model.root.add('items', model.get('item'));
      model.whenNothingPending(function() {
        app.history.push('/');
      });
    } else {
      app.history.push('/');
    }
  };

  EditForm.prototype.cancel = function() {
    return app.history.back();
  };

  EditForm.prototype["delete"] = function() {
    this.model.silent().del('item');
    return this.model.whenNothingPending(function() {
      app.history.push('/');
    });
  };

  return EditForm;

})();

app.component('edit:form', EditForm);
