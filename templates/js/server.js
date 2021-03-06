// Generated by CoffeeScript 1.10.0
(function() {
  var kclient, run;

  kclient = require("k-client");

  run = function(app) {
    var createServer, listenCallback;
    if (typeof app === "string") {
      app = require(app);
    }
    listenCallback = function(err) {
      console.log("%d listening.", process.pid);
    };
    createServer = function() {
      return require("http").createServer(app).listen(process.env.PORT || 3000, listenCallback).on('upgrade', app.upgrade);
    };
    kclient.run(createServer);
  };

  run(__dirname + "/src/server");

}).call(this);
