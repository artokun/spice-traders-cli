const firebase = require('firebase')

class Game {
    constructor(user) {
        this.db = firebase.database()
        this.init(user)
    }

    init(user) {
        this.user = user
        this.refEventState = this.db.ref(`/events/${user.uid}`)
        this.refCommands = this.db.ref(`/commands/${user.uid}`)
        this.onEventStateChanged = this.refEventState.on("value", this.onEventStateChanged.bind(this))
        this.db.ref(`/players/${user.uid}`).update({
            displayName: user.displayName,
            photoUrl: user.photoURL
        })
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
