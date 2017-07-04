const CLI = require('clui')
const Spinner = CLI.Spinner
const clear = CLI.Clear

class Game {
  constructor(config, vorpal, firebase, PubSub) {
    this.config = config
    this.vorpal = vorpal
    this.firebase = firebase
    this.PubSub = PubSub

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

  listCommands(context) {
    this.init(this.firebase.auth().currentUser)
    const commandRef = this.refCommands.push({ type: context + '.list' })
    this.key = commandRef.key
    this.list = true

    return new Promise((resolve, reject) => {
      this.spinner = new Spinner(`Fetching ${context} commands...`)
      this.spinner.start()

      const timeout = setTimeout(() => {
        reject(`Timeout Error: Could not get command list for ${context}`)
        this.close()
      }, 60 * 1000)

      this.PubSub.subscribe('list', (msg, data) => {
        resolve(data)
        clear()
        clearTimeout(timeout)
        this.close()
      })
    })
  }

  sendCommand(command) {
    clear()
    this.init(this.firebase.auth().currentUser)
    const commandRef = this.refCommands.push(command)
    this.key = commandRef.key

    return new Promise((resolve, reject) => {
      this.spinner = new Spinner(`Sending ${command.type} command...`)
      this.spinner.start()

      const timeout = setTimeout(() => {
        reject(`Timeout Error: Could not resolve ${command.type}`)
        this.close()
      }, 60 * 1000)

      this.PubSub.subscribe('notification', (msg, data) => {
        resolve(data)
        clear()
        clearTimeout(timeout)
        this.close()
      })
    })
  }

  close() {
    if (this.refEventState) {
      this.refEventState.off("child_added", this.onEventStateChanged)
      this.refEventState = undefined
    }
    this.refCommands = undefined
    this.user = null
    this.list = false
    this.PubSub.clearAllSubscriptions()
    this.spinner.stop()
  }

  onEventStateChanged(snap) {
      const state = snap.val()

      if (state && snap.key === this.key) {
        if (this.list) {
          this.PubSub.publish('list', state.notification)
        } else {
          this.PubSub.publish('notification', state.notification)
        }
      }
  }
}

module.exports = Game
