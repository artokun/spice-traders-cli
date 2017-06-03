'use strict'

var Command = require('../lib/command')
var logger = require('../lib/logger')
var configstore = require('../lib/configstore')
var chalk = require('chalk')
var utils = require('../lib/utils')
var inquirer = require('inquirer')
var firebase = require('firebase')
var Auth = require('../lib/authentication')

module.exports = new Command('login')
  .description('log the CLI into SpaceTraders API')
  .option('--no-localhost', 'copy and paste a code instead of starting a local server for authentication')
  .option('--reauth', 'force reauthentication even if already logged in')
  .action(function(options) {

    // verify if credentails are still stored in memory
    const email = configstore.get('email')
    const password = configstore.get('password')

    if (email && password && !options.reauth) {
      return firebase.auth().signInWithEmailAndPassword(email, password).then(user => {
        logger.info('Already logged in as', chalk.bold(user.email))
        return Promise.resolve(user)
      })
    }
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'collectUsage',
        message: 'Allow SpaceTraders to collect anonymous CLI usage information?'
      },
      {
        type: 'list',
        name: 'provider',
        message: 'Choose authentication method',
        choices: [
          'Email and Password',
          { name: 'Google', disabled: 'Coming Soon'},
          { name: 'Facebook', disabled: 'Coming Soon'},
          { name: 'Phone Number', disabled: 'Coming Soon'}
        ],
        filter: function (val) {
          return val.split(' ')[0].toLowerCase()
        }
      }
    ]).then(function(answers) {
      configstore.set('usage', answers.collectUsage)
      return Auth.login(answers.provider)
    }).then(function(user) {
      if(user) {
        logger.info()
        utils.logSuccess('Success! Logged in as ' + chalk.bold(user.email))
        logger.info()
      }
    })
  })
