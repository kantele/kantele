app = module.exports = require('k-client').createApp 'kantele-app', __filename
app.serverUse(module, 'k-stylus');
app.loadViews __dirname + '/../../views/app'
app.loadStyles __dirname + '/../../styles/app'

app.component require 'k-connection-alert'
app.component require 'k-before-unload'

require './home'
