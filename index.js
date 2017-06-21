'use strict'

const vorpal = require('vorpal')()
const clear = require('clear')
const figlet = require('figlet')
const firebase = require('firebase')
const Auth = require('./lib/auth')
const Preferences = require('preferences')
const pkg = require('./package.json')
const chalk = vorpal.chalk

let client = {}
client.config = new Preferences(pkg.name, { credentials: {} })
client.vorpal = vorpal
client.firebase = firebase
client.auth = new Auth(client.config, client.vorpal, client.firebase)

// Bind instance events
client.auth.onAuthStateChanged(user => {
  if (user) {
    return client.vorpal.emit('auth-state-changed', user)
  }
})

// Show banner
clear()
console.log(
  chalk.yellow(figlet.textSync('Spice Traders', {
    horizontalLayout: 'right smushing',
    font: 'Small Slant'
  }))
)
console.log(chalk.bold.green('\n  Online Space Trading MMORPG'))
console.log(chalk.cyan(`  Version ${pkg.version}\n`))
console.log(chalk.white('  Type `help` see available commands. \n'))

// Fetch and instantiate all commands
require('./commands')(client)

// Initiate REPL
vorpal
  .delimiter('spicetraders')
  .show();

// Catch any unknown commands
vorpal
  .catch('[words...]', 'Catches incorrect commands')
  .action(function (args, cb) {
    this.log(args.words.join(' ') + ' is not a valid Spice Traders command.\n');
    cb();
  });
