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
    if (!user) {
      return vorpal.log('You are not logged in')
    }
    this.user = user
    this.refCommands = this.db.ref(`/commands/${user.uid}`)
    this.refEventState = this.db.ref(`/events/${user.uid}`)
    this.onEventStateChanged = this.refEventState.on("child_added", this.onEventStateChanged.bind(this))
  }

  sendCommand(command) {
    clear()
    this.init(this.firebase.auth().currentUser)
    this.spinner = new Spinner(`Sending ${command.type} command...`)
    this.spinner.start()
    const commandRef = this.refCommands.push(command)
    this.key = commandRef.key
  }

  close() {
      if (this.refEventState) {
          this.refEventState.off("child_added", this.onEventStateChanged)
          this.refEventState = undefined
      }
      this.refCommands = undefined
      this.user = null
  }

  onEventStateChanged(snap) {
      const state = snap.val()

      if (state && snap.key === this.key) {
        this.spinner.stop()
        this.close()
        this.vorpal.log(this.vorpal.chalk.green.bold(JSON.stringify(state.notification, null, 2)))
      }
  }
}

module.exports = Game
