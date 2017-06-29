const CLI = require('clui')
const Spinner = CLI.Spinner
const clear = CLI.Clear

class Game {
  constructor(config, vorpal, firebase) {
    this.config = config
    this.vorpal = vorpal
    this.firebase = firebase

    this.db = this.firebase.database()
  }

  init(user) {
    if (!user) { return false }
    this.user = user
    this.refCommands = this.db.ref(`/commands/${user.uid}`)
    this.refEventState = this.db.ref(`/events/${user.uid}`)
    this.onEventStateChanged = this.refEventState.on("value", this.onEventStateChanged.bind(this))
  }

  sendCommand(command) {
    clear()
    this.vorpal.log("Sending command", this.config.user.uid)
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
      const state = snap.val() || null
      if (state) {
        this.vorpal.log(state)
      }
  }
}

module.exports = Game
