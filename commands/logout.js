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

module.exports = new Command('logout')
  .description('Logout of SpaceTraders MMO')
  .action(function(options) {

    // verify if credentails are still stored in memory
    const email = configstore.get('email')
    const password = configstore.get('password')

    if (!email && !password) {
      logger.info()
      utils.logBullet("There's no need to log out. You are not logged in.")
      logger.info()
      return Promise.resolve()
    }
    return firebase.auth().signInWithEmailAndPassword(email, password).then(() => {
      const user = firebase.auth().currentUser
      logger.info()
      utils.logSuccess('Currently logged in as ' + chalk.bold(user.email))
      Promise.resolve(user)
    }).then(user => {
      return inquirer.prompt([
        {
          type: 'confirm',
          name: 'logout',
          message: 'Are you sure you want to log out?'
        }
      ])
    }).then(({logout}) => {
      if (logout) {
        return firebase.auth().signOut().then(() => {
          return Promise.resolve(true)
        })
      }
      return Promise.resolve(false)
    }).then(loggedOut => {
      if (loggedOut) {
        configstore.delete('email')
        configstore.delete('password')

        logger.info()
        utils.logSuccess('Successfully logged out. See you soon!')
        logger.info()
        return Promise.resolve()
      }
      logger.info()
      utils.logSuccess('Logout cancelled')
      logger.info()
      return Promise.resolve()
    })
  })
