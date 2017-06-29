const clear = require('clui').Clear
const Game = require('../lib/game')
const client = require('../')
const {game, vorpal, firebase} = client

module.exports = function() {
  vorpal
    .command('company')
    .description('list available commands')
    .action(function(args, cb) {
      game.init(firebase.auth().currentUser)
      if (!game.user) {
        return cb('You are not logged in. Please enter `login` below\n')
      }
      this.prompt([
        {
          type: 'list',
          name: 'company',
          message: 'Choose a company option',
          choices: [
            { name: 'Create new company', value: 'new' },
            { name: 'Back', value: 'back' }
          ]
        },
        {
          type: 'input',
          name: 'name',
          when(answers) {
            return answers.company === 'new'
          },
          message: 'Company Name: ',
          validate(input) { return input.length > 5 || 'Name is too short!'}
        },
        {
          type: 'input',
          name: 'slogan',
          when(answers) {
            return answers.company === 'new'
          },
          message: 'Company Slogan: ',
          validate(input) { return input.length > 5 || 'Slogan is too short!'}
        },
        {
          type: 'list',
          name: 'faction',
          when(answers) {
            return answers.company === 'new'
          },
          message: 'Choose a faction',
          default: 'UN',
          choices: [
            { name: 'United Nations', value: 'UN' },
            { name: 'Martian Federation', value: 'Mars' },
            { name: 'Outer Planets Alliance', value: 'OPA' }
          ]
        }
      ]).then(({company, name, slogan, faction}) => {
        if (company === 'back') {
          clear()
          return cb()
        }
        game.sendCommand({
          type: 'company/new',
          payload: {
            name,
            slogan,
            faction
          }
        })
        cb()
      })
    })
}
