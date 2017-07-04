'use strict'

const vorpal = require('vorpal')()
const Auth = require('./lib/auth')
const Game = require('./lib/game')
const Preferences = require('preferences')
const PubSub = require('pubsub-js')
const clear = require('clui').Clear
const figlet = require('figlet')
const firebase = require('firebase')
const pkg = require('./package.json')
const config = new Preferences(pkg.name, { user: {} })
const chalk = vorpal.chalk

module.exports = {
  vorpal,
  firebase,
  config,
  PubSub,
  auth: new Auth(firebase, config),
  game: new Game(config, vorpal, firebase, PubSub)
}

// Show banner
clear()
vorpal.log(
  chalk.yellow(figlet.textSync('SpiceTraders', {
    font: 'Small Slant'
  }))
)
vorpal.log(chalk.bold.green('\n  Online Space Trading MMORPG'))
vorpal.log(chalk.cyan(`  Version ${pkg.version}`))

// Fetch and instantiate all commands
require('./commands')()

// Initialize Auth and Game classes
vorpal
  .exec('login -c')

// Initiate REPL command listening
vorpal
  .delimiter('spicetraders')
  .show()

// Catch any unknown commands
vorpal
  .catch('[words...]', 'Catches incorrect commands')
  .action(function (args, cb) {
    this.log(args.words.join(' ') + ' is not a valid SpiceTraders command.\n');
    cb();
  });
