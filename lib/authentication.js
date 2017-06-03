'use strict';

var configstore = require('./configstore')
var config = require('../lib/configTwo')
var logger = require('./logger');
var chalk = require('chalk');
var SpaceTradersError = require('./error')
var firebase = require('firebase')
var utils = require('../lib/utils');
var inquirer = require('inquirer')

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
      logger.info("Let's try different credentials")
      logger.info()
      this.emailProvider()
    }).then(user => {
      logger.info()
      logger.info("New user created!")
      logger.info()
      return Promise.resolve(user)
    })
  }
}

module.exports = new Auth(config.firebase)
