'use strict';

module.exports = function(client) {
  var loadCommand = function(name) {
    var cmd = require('./' + name);
    cmd.register(client);
    return cmd.runner();
  };

  client.help = loadCommand('help');
  client.login = loadCommand('login');
  client.logout = loadCommand('logout');

  return client;
};
