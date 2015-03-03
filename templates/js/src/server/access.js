var checkAdmin, checkSecret, getMethod, preValidateWrite, validateDocRead,
  __slice = [].slice;

getMethod = function(opData, op) {
  if (opData.create) {
    return 'create';
  }
  if (opData.del) {
    return 'del';
  }
  if (op != null) {
    if ((op.od != null) && op.oi) {
      return 'change';
    }
    if (op.oi != null) {
      return 'set';
    }
    if (op.od != null) {
      return 'del';
    }
    if (op.oi === null) {
      return 'del';
    }
    if ((op.li != null) && op.ld) {
      return 'change';
    }
    if (op.li != null) {
      return 'insert';
    }
    if (op.ld != null) {
      return 'remove';
    }
    if (op.si != null) {
      return 'string-ins';
    }
    if (op.sd != null) {
      return 'string-del';
    }
    if (op.na != null) {
      return 'increment';
    }
  }
  return console.log('could not find method', opData, op);
};

module.exports = function(shareClient) {
  shareClient.use('connect', function(shareRequest, next) {
    shareRequest.agent.connectSession = shareRequest.req.session;
    return next();
  });

  shareClient.filter(function(collection, docName, docData, next) {
    return validateDocRead(this, collection, docName, docData.data, next);
  });

  shareClient.use('submit', function(shareRequest, next) {
    var opData;
    opData = shareRequest.opData;
    opData.connectSession = shareRequest.agent.connectSession;
    opData.collection = shareRequest.collection;
    opData.docName = shareRequest.docName;
    return next();
  });

  shareClient.preValidate = function(opData, docData) {
    var component, d, err, key, obj, path, pathMap, session, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    opData.validators = [];
    session = opData.connectSession;
    d = docData.data || ((_ref = opData.op) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.create) != null ? _ref2.data : void 0 : void 0 : void 0);

    if (!opData.op || opData.op.length === 1) {
      return preValidateWrite(session, opData.validators, getMethod(opData, (_ref3 = opData.op) != null ? _ref3[0] : void 0), (_ref4 = opData.op) != null ? _ref4[0] : void 0, opData.collection, opData.docName, ((_ref5 = opData.op) != null ? _ref5[0].p : void 0) || [], docData.data || ((_ref6 = opData.create) != null ? _ref6.data : void 0));
    }

    pathMap = {};
    _ref7 = opData.op;

    for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
      component = _ref7[_i];
      path = component.p || [];
      key = path.join('.');
      pathMap[key] = {
        path: component.p,
        method: getMethod(opData, component),
        op: component
      };
    }

    for (key in pathMap) {
      obj = pathMap[key];
      err = preValidateWrite(session, opData.validators, obj[method], op, opData.collection, opData.docName, obj[path], docData.data || (typeof op !== "undefined" && op !== null ? (_ref8 = op.create) != null ? _ref8.data : void 0 : void 0));
      if (err) {
        return err;
      }
    }
  };

  return shareClient.validate = function(opData, docData) {
    var doc, err, fn, _i, _len, _ref;
    if (!opData.validators.length) {
      return;
    }
    doc = docData.data;
    _ref = opData.validators;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fn = _ref[_i];
      err = fn(doc, opData);
      if (err) {
        return err;
      }
    }
  };
};

validateDocRead = function(agent, collection, docId, doc, next) {
  var session, userId;
  session = agent.connectSession;
  userId = session != null ? session.userId : void 0;

  if (!session) {
    console.error('Warning: Doc read access no session ', collection, docId);
    return next('403: No session');
  }

  if (!userId) {
    console.error('Warning: Doc read access no session.userId ', collection, docId, session);
    return next('403: No session.userId');
  }

  if (collection === 'auths') {
    if (docId !== userId) {
      return next("403: Cannot read " + collection + " who is not you.. (" + docId + ", " + userId + ")");
    }
  }

  return next();
};

preValidateWrite = function(session, validators, method, opData, collection, docId, path, doc) {
  var admin, fullPath, loggedIn, userId;
  userId = session != null ? session.userId : void 0;
  admin = session != null ? session.admin : void 0;
  loggedIn = session != null ? session.loggedIn : void 0;
  fullPath = path.join('.');

  if (!session) {
    console.error.apply(console, ['Warning: Write access no session'].concat(__slice.call(arguments)));
    return '403: No session';
  }

  if (!userId) {
    console.error.apply(console, ['Warning: Write access no session.userId'].concat(__slice.call(arguments)));
    return '403: No session.userId';
  }

  if (!docId) {
    console.error.apply(console, ['Warning: Write access no docId'].concat(__slice.call(arguments)));
    return '403: No docId';
  }

  if (!doc) {
    console.error.apply(console, ['Error: No document snapshot or create data'].concat(__slice.call(arguments)));
    return '403: No document snapshot or create data';
  }

  if (collection === 'auth_try') {
    return;
  }

  if (collection === 'auths') {
    if (docId !== userId) {
      return "403: Cannot modify " + collection + " who is not you";
    }
    return;
  }

  if (collection === 'auths') {
    validators.push(function(mutatedDoc) {
      if (!mutatedDoc || mutatedDoc.admin === doc.admin) {
        return;
      }
      return '403: Cannot modify a document to have a different admin status';
    });
  }

  if (collection === 'auths_public') {
    if (fullPath === 'local.reset.token' || fullPath === 'local.reset.when' || fullPath === 'local.reg' || fullPath === 'local.reg.when' || fullPath === 'local.reg.token') {
      return;
    }
    if (method === 'create') {
      return;
    }
    return "403: Cannot modify auths_public";
  }

  console.log('access denied...', userId, method, collection, fullPath);

  return "403: cannot modify " + collection;
};

checkSecret = function(collection, docId, userId, cb) {
  if (!docId) {
    return cb('403: Cannot access document missing id reference');
  }
  return agent.fetch(collection, docId, function(err, doc) {
    var _ref;
    if (err) {
      return cb(err);
    }
    if (((_ref = doc.data) != null ? _ref.secretTo : void 0) !== userId) {
      return cb();
    }
    return cb('403: Cannot access secret document');
  });
};

checkAdmin = function(collection, docId, userId, cb) {
  if (!docId) {
    return cb('403: Cannot access document missing id reference');
  }
  return agent.fetch(collection, docId, function(err, doc) {
    var _ref;
    if (err) {
      return cb(err);
    }
    if (((_ref = doc.data) != null ? _ref.secretTo : void 0) !== userId) {
      return cb();
    }
    return cb('403: Cannot access secret document');
  });
};