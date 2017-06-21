'use strict';

const inquirer = require('inquirer')
const chalk = require('chalk')
const opn = require('opn')
const path = require('path')
const clear = require('clear')
const CLI = require('clui')
const express = require('express')
const bodyParser = require('body-parser')
const Spinner = CLI.Spinner
const firebaseAuth = require('./config').firebase
const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = '567711902185-j0d9mlpfcjqrm0a45h62hjup3s27c26u.apps.googleusercontent.com'
const CLIENT_SECRET = 'QVFPxoSWs8ve_upuxb7tdIHn'
const REDIRECT_URL = 'http://localhost:9005/auth/google/callback'

const scopes = [
  'openid',
  'profile',
  'email'
];

class Auth {
  constructor(config, vorpal, firebase) {
    this.config = config
    this.vorpal = vorpal
    this.firebase = firebase
    this.firebase.initializeApp(firebaseAuth);
  }

  get db() {
    return this.firebase.database()
  }

  get user() {
     return this.firebase.auth().currentUser
  }

  onAuthStateChanged(callback) {
    return this.firebase.auth().onAuthStateChanged(callback)
  }

  login(provider) {
    switch (provider) {
      case 'email':
        return this.emailProvider()
      case 'google':
        return this.googleProvider()
      default:
        throw new Error('Invalid Provider: ', provider)
    }
  }

  emailProvider(options = {}) {
    let questions = []
    this.vorpal.log(chalk.yellow('Authenticating with email and password...\n'))
    if (!options.passwordOnly) {
      questions.push({
        type: 'input',
        name: 'email',
        message: 'Enter your email address',
        validate (val) {
          const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
          return val.match(emailRegex) ? true : 'Please enter a valid email address'
        }
      })
    }
    questions.push({
      type: 'password',
      message: 'Enter your password',
      name: 'password',
      mask: '*',
      validate (val) {
        const passwordRegex = new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/)
        return val.match(passwordRegex) ? true : 'Password must be at least 6 characters long and contain at least one number or uppercase letter'
      }
    })
    return inquirer.prompt(questions).then((answers) => {
      if (options.passwordOnly) {
        answers.email = this.config.credentials.email
      }
      this.config.credentials = answers
      return this.signInWithEmailAndPassword()
    })
  }

  googleProvider(options = {}) {
    this.vorpal.log(chalk.yellow('Authenticating with Google...\n'))
    this.port = 9005
    this.oauth2Client = new OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URL
    );
    opn(this.oauth2Client.generateAuthUrl({ scope: scopes }))
    return this.localServer(this.port)
  }

  localServer(port) {
    return new Promise((resolve, reject) => {
      const app = express()
      app.use(bodyParser.json())

      app.get('/auth/google/callback', (req, res) => {
        this.oauth2Client.getToken(req.query.code, (err, tokens) => {
          if (!err) {
            return this.signInWithGoogle(tokens)
              .then((user) => {
                this.config.user = user
                resolve(user)
                res.send('You have been authenticated: You can close this window')
              })
              .catch((error) => {
                reject(error)
                res.send(error)
              })
          } else {
            reject(err)
          }
        });
      })

      app.listen(port)
    })
  }

  signInWithGoogle(tokens) {
    const credential = this.firebase.auth.GoogleAuthProvider.credential(null, tokens.access_token)
    return this.firebase.auth().signInWithCredential(credential)
  }

  signInWithEmailAndPassword() {
    // Sign In User
    this.spinner = new Spinner('Authenticating, please wait...')

    clear()
    this.spinner.start()
    return new Promise((resolve, reject) => {
      this.firebase.auth().signInWithEmailAndPassword(this.config.credentials.email, this.config.credentials.password)
        .then(user => {
          this.spinner.stop()
          this.config.user = user
          if (!user.emailVerified) {
            clear()
            this.vorpal.log(chalk.yellow('Please verify your email by clicking the\nverification link sent to: ') + chalk.bold(user.email) + '\n')
            resolve(user)
          }
          resolve(user)
        })
        .catch(error => {
          this.spinner.stop()
          this.config.error = error
          reject(error)
        })
    })
  }

  createUserWithEmailAndPassword() {
    this.spinner = new Spinner('Creating new user, please wait...')
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'new',
        message: 'This user does not exist, would you like to create a new account with this email?'
      }
    ]).then(answers => {
      if (answers.new) {
        this.spinner.start()
        return this.firebase.auth().createUserWithEmailAndPassword(this.config.credentials.email, this.config.credentials.password)
      }
      this.config.credentials = {}
      return this.emailProvider()
    }).then(() => {
      this.config.user = this.firebase.auth().currentUser
      return this.sendEmailVerification()
    }).catch(error => {
        switch (error.code) {
          default:
            this.vorpal.log('Create User Error: ', error.code)
            throw new Error(error)
        }
      })
  }

  collectUsage() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'collectUsage',
        message: 'Allow SpiceTraders to collect anonymous CLI usage information?'
      }
    ]).then(function(answers) {
      config.usage = answers.collectUsage
      return Promise.resolve()
    })
  }

  sendEmailVerification(credentials) {
    return new Promise((resolve, reject) => {
      if (credentials) {
        return this.firebase.auth().signInWithEmailAndPassword(credentials.email, credentials.password)
          .then(user => {
            if (user.emailVerified) {
              return resolve()
            }
            user.resendOnly = true
            return resolve(user)
          })
          .catch(error => {
            this.spinner.stop()
            throw new Error(error.message)
          })
      }
      return resolve(this.user)
    }).then((user) => {
      this.spinner.message('Sending verification email, please wait...')
      if (user) {
        return user.sendEmailVerification().then(() => {
          clear()
          this.spinner.stop()
          this.vorpal.log(`Please click on the verification link\nsent to ${chalk.bold(user.email)}\n`)
          return Promise.resolve(user)
        })
      }
      clear()
      this.vorpal.log(chalk.bold(this.config.user.email) + ' is already verified!')
      return Promise.resolve()
    })
  }

  signOut() {
    this.config.credentials = {}
    delete this.config.user
    return this.firebase.auth().signOut()
  }
}

module.exports = Auth
