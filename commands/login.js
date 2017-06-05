'use strict'

var inquirer = require('inquirer')
var firebase = require('firebase')
var chalk = require('chalk')
var Command = require('../lib/command')
var logger = require('../lib/logger')
var configstore = require('../lib/configstore')
var utils = require('../lib/utils')
var SpaceTradersError = require('../lib/error')
var Auth = require('../lib/authentication')

module.exports = new Command('login')
  .description('log the CLI into SpaceTraders API')
  // .option('--no-localhost', 'copy and paste a code instead of starting a local server for authentication')
  .option('--reauth', 'force reauthentication even if already logged in')
  .option('--resend-verification', 'resends verification email')
  .action(function(options) {

    // verify if credentails are still stored in memory
    const credentials = {
      email: configstore.get('email'),
      password: configstore.get('password')
    }

    if (options.resendVerification) {
      if (credentials.email && credentials.password) {
        return Auth.sendEmailVerification(credentials)
      }
      throw new SpaceTradersError('You need to be logged in to resend verification email.')
    }

    if (credentials.email && credentials.password && !options.reauth) {
      return Auth.signInWithEmailAndPassword(credentials)
    }

    return inquirer.prompt([
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
      return Auth.login(answers.provider)
    })
  })
