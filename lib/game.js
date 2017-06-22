const CLI = require('clui')
const Spinner = CLI.Spinner

class Game {
  constructor(config, vorpal, firebase, cb) {
    this.config = config
    this.vorpal = vorpal
    this.firebase = firebase
    this.cb = cb

    this.db = this.firebase.database()
    return this.init(this.firebase.auth().currentUser)
  }

  init(user) {
    this.user = user
    this.refCommands = this.db.ref(`/commands/${user.uid}`)
    this.refEventState = this.db.ref(`/events/${user.uid}`)
    this.onEventStateChanged = this.refEventState.on("value", this.onEventStateChanged.bind(this))

    return this.homeCommands()
  }

  homeCommands() {

    // TODO: have a better navigation flow
    // wrap all in promise that resolves on exit
    // remove filter and add value key
    // leverage when() for question strings
    // look into dynamic question injection with RX
    // add back links, exit on main menu
    // look at how to make ship status boards (hard!)

    return this.vorpal.prompt([
      {
        type: 'list',
        name: 'command',
        message: 'Welcome back commander.',
        choices: [
          'Ships'
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
    return this.vorpal.prompt([
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
    console.log("Sending command", this.config.user.uid)
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
