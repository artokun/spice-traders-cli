const firebase = require('firebase')
const inquirer = require('inquirer')
const chalk = require('chalk')
const logger = require('../lib/logger')
const configstore = require('../lib/configstore')
const utils = require('../lib/utils')
const SpaceTradersError = require('../lib/error')
const Auth = require('../lib/authentication')

class Game {
    constructor(user, options) {
        this.db = firebase.database()
        this.options = options
        return this.init(user)
    }

    init(user) {
        this.user = user
        this.refCommands = this.db.ref(`/commands/${user.uid}`)
        this.refEventState = this.db.ref(`/events/${user.uid}`)
        this.onEventStateChanged = this.refEventState.on("value", this.onEventStateChanged.bind(this))

        return this.homeCommands()
    }

    homeCommands() {
      return inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'Welcome back commander.',
          choices: [
            'Ships',
            { name: 'Company', disabled: 'Coming Soon'},
            { name: 'Profile', disabled: 'Coming Soon'},
          ],
          filter: function (val) {
            return val.split(' ')[0].toLowerCase()
          }
        }
      ]).then(answer => {
        switch(answer.command) {
          case 'ships':
          return this.shipCommands()
          case 'company':
          return this.companyCommands()
          case 'profile':
          return this.profileCommands()
        }
      })
    }

    shipCommands() {
      // fetch commands
      return inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'Please Select Ship Command',
          choices: [
            'Undock',
            'Plot Course',
            'Scan'
          ],
          filter: function (val) {
            return val.split(' ')[0].toLowerCase()
          }
        }
      ]).then(answer => {
        return this.sendCommand(answer.command)
      }).then(() => {
        this.sendingCommand = false
        return this.shipCommands()
      })
    }
    companyCommands() {
      return
    }
    profileCommands() {
      return
    }


    sendCommand(command) {
      console.log("Sending command", firebase.auth().currentUser.uid)
      if (this.sendingCommand) {
          console.log("Throttling command")
          return
      }
      this.sendingCommand = true
      return this.refCommands.push(command)
    }

    close() {
        if (this.refEventState) {
            this.refEventState.off("value", this.onEventStateChanged)
            this.refEventState = undefined
        }
        this.refCommands = undefined
        this.user = null
        this.reset()
    }

    onEventStateChanged(snap) {
        const state = snap.val() || {}
        console.log(state)
    }
}

module.exports = Game
