'use strict';

var Command = require('../lib/command');
var configstore = require('../lib/configstore');
var logger = require('../lib/logger');
var chalk = require('chalk');
var utils = require('../lib/utils');
var api = require('../lib/api');
var auth = require('../lib/auth');
var firebase = require('firebase')
var _ = require('lodash');

module.exports = new Command('logout')
  .description('log the CLI out of Spacetraders')
  .action(function(options) {
    var user = configstore.get('user');
    var token = configstore.get('refreshToken');

    const next = firebase.auth().signOut()

    var cleanup = function() {
      configstore.delete('user')
      configstore.delete('refreshToken')

      if (token || user) {
        utils.logSuccess(`Logged out from ${chalk.bold(user.email)}`);
      } else {
        logger.info('No need to logout, not logged in');
      }
    };

    return next.then(cleanup)
  });
