'use strict';

const inquirer = require('inquirer')
const chalk = require('chalk')
const opn = require('opn')
const path = require('path')
const clear = require('clear')
const CLI = require('clui')
const express = require('express')
const bodyParser = require('body-parser')
const detect = require('detect-port')
const killPort = require('kill-port')
const Spinner = CLI.Spinner
const firebaseAuth = require('./config').firebase
const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const CLIENT_ID = '567711902185-j0d9mlpfcjqrm0a45h62hjup3s27c26u.apps.googleusercontent.com'
const CLIENT_SECRET = 'QVFPxoSWs8ve_upuxb7tdIHn'
const REDIRECT_URL = 'http://localhost:9005/auth/google/callback'
const PORT = 9005

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

  googleProvider() {
    this.oauth2Client = new OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URL
    );
    opn(this.oauth2Client.generateAuthUrl({ scope: scopes }))
    return this.localServer(PORT)
  }

  localServer(port) {
    this.spinner = new Spinner('Establishing Command Link...')
    this.spinner.start()

    return new Promise((resolve, reject) => {
      const app = express()
      app.use(bodyParser.json())

      app.get('/auth/google/callback', (req, res) => {
        this.oauth2Client.getToken(req.query.code, (err, tokens) => {
          if (!err) {
            return this.signInWithGoogle(tokens)
              .then((user) => {
                this.config.user = user
                this.spinner.stop()
                resolve()
                res.sendFile(path.resolve('templates/success.html'))
              })
              .catch((error) => {
                reject(error)
                res.send({error})
              })
          } else {
            reject(err)
          }
        });
      })
      detect(port)
        .then(_port => {
          if (port !== _port) {
            return killPort(port)
          }
          return Promise.resolve(port)
        })
        .then(port => app.listen(port))
        .catch(err => console.log(err))
    })
  }

  signInWithGoogle(tokens) {
    const credential = this.firebase.auth.GoogleAuthProvider.credential(null, tokens.access_token)
    return this.firebase.auth().signInWithCredential(credential)
  }

  signOut() {
    this.config.user = {}
    return this.firebase.auth().signOut()
  }
}

module.exports = Auth
