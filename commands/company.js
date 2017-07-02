const clear = require('clui').Clear
const Game = require('../lib/game')
const client = require('../')
const {game, vorpal, firebase} = client

module.exports = function() {
  vorpal
    .command('company [command]')
    .description('list available commands')
    .action(function(args, cb) {
      if (args.command) {
        switch (args.command) {
          case 'view':
            game.sendCommand({
              type: 'company.view'
            })
            cb()
            return
          default:
            this.log(`${args.command} is not a valid company command.`)
        }
      }
      this.prompt([
        {
          type: 'list',
          name: 'company',
          message: 'Choose a company option',
          choices: [
            { name: 'Create create company', value: 'create' },
            { name: 'View company details', value: 'view' },
            { name: 'Back', value: 'back' }
          ]
        },
        {
          type: 'input',
          name: 'name',
          when(answers) {
            return answers.company === 'create'
          },
          message: 'Company Name: ',
          validate(input) { return input.length > 5 || 'Name is too short!'}
        },
        {
          type: 'input',
          name: 'slogan',
          when(answers) {
            return answers.company === 'create'
          },
          message: 'Company Slogan: ',
          validate(input) { return input.length > 5 || 'Slogan is too short!'}
        },
        {
          type: 'list',
          name: 'faction',
          when(answers) {
            return answers.company === 'create'
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
        switch (company) {
          case 'create':
            game.sendCommand({
              type: 'company.create',
              payload: {
                name,
                slogan,
                faction
              }
            })
            break
          case 'view':
            game.sendCommand({
              type: 'company.view'
            })
            break
        }
        cb()
      })
    })
}
