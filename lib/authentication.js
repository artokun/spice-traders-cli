'use strict';

var configstore = require('./configstore')
var config = require('../lib/configTwo')
var logger = require('./logger')
var chalk = require('chalk')
var SpaceTradersError = require('./error')
var firebase = require('firebase')
var utils = require('../lib/utils')
var inquirer = require('inquirer')
var cmdify = require('cmdify')

class Auth {
  constructor(config) {
    firebase.initializeApp(config);
  }

  login(provider) {
    switch (provider) {
      case 'email':
        return this.emailProvider()
      default:
        throw SpaceTradersError('Invalid Provider: ', provider)
    }
  }

  emailProvider() {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Enter your email address',
        validate (val) {
          const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
          return val.match(emailRegex) ? true : 'Please enter a valid email address'
        }
      },
      {
        type: 'password',
        message: 'Enter your password',
        name: 'password',
        mask: '*'
      }
    ]).then(({email, password}) => {
      configstore.set('email', email)
      configstore.set('password', password)
      return firebase.auth().signInWithEmailAndPassword(email, password)
    }).catch(error => {
      this.processing = false
      switch (error.code) {
        case 'auth/user-not-found':
          return this.createUserWithEmailAndPassword()
          break;
        case 'auth/wrong-password':
          logger.warn();
          utils.logWarning(chalk.bold('Invalid Password') + ' please try again.');
          logger.warn();
          return this.emailProvider()
          break;
        default:
          console.log(error.code)
          throw new SpaceTradersError(error.message, {exit: 2})
      }
    })
  }

  createUserWithEmailAndPassword() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'new',
        message: 'This user does not exist, would you like to create a new account?'
      }
    ]).then(answers => {
      if (answers.new) {
        return firebase.auth().createUserWithEmailAndPassword(configstore.get('email'), configstore.get('password'))
      }
      logger.info()
      utils.logWarning(chalk.bold('Okay') + ', lets try something else.');
      logger.info()
      return this.emailProvider()
    }).then(() => {
      const user = firebase.auth().currentUser

      return user.sendEmailVerification().then(() => {
        logger.info()
        utils.logSuccess(chalk.bold('User Created!') + ' Please verify your email address and log in again');
        logger.info()
      })
    })
  }

  bottomBar(text) {
    const loading = text || 'Working'
    const loader = [
      `/ ${loading}`,
      `| ${loading}`,
      `\\ ${loading}`,
      `- ${loading}`
    ];
    let i = 4
    const ui = new inquirer.ui.BottomBar({bottomBar: loader[i % 4]});

    this.processing = true

    const bottomBarInterval = setInterval(() => {
      if (!this.processing) {
        clearInterval(bottomBarInterval)
        return ui.updateBottomBar('');
      }
      ui.updateBottomBar(loader[i++ % 4]);
    }, 200);
  }
}

module.exports = new Auth(config.firebase)
