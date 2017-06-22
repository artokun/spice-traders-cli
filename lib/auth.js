'use strict'

const opn = require('opn')
const path = require('path')
const CLI = require('clui')
const express = require('express')
const detect = require('detect-port')
const google = require('googleapis')
const Spinner = CLI.Spinner
const OAuth2 = google.auth.OAuth2
const { firebaseConfig } = require('./config')

const CLIENT_ID = '567711902185-j0d9mlpfcjqrm0a45h62hjup3s27c26u.apps.googleusercontent.com'
const CLIENT_SECRET = 'QVFPxoSWs8ve_upuxb7tdIHn'
const PORT = 9005

const scopes = [
  'openid',
  'profile',
  'email'
]

class Auth {
  constructor(firebase, config) {
    this.firebase = firebase
    this.config = config
    this.firebase.initializeApp(firebaseConfig)
  }

  googleProvider() {
    return new Promise((resolve, reject) => {
      detect(PORT)
        .then(port => {
          this.oauth2Client = new OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            `http://localhost:${port}/auth/google/callback`
          )
          opn(this.oauth2Client.generateAuthUrl({ scope: scopes }))
          return this.localServer(port)
        }).then(user => resolve(user))
    })
  }

  localServer(port) {
    this.spinner = new Spinner('Establishing Command Link...')
    this.spinner.start()

    return new Promise((resolve, reject) => {
      const app = express()

      app.get('/auth/google/callback', (req, res) => {
        this.oauth2Client.getToken(req.query.code, (err, tokens) => {
          if (!err) {
            return this.signInWithGoogle(tokens)
              .then((user) => {
                this.config.user = user
                this.spinner.stop()
                res.sendFile(path.resolve('templates/success.html'))
                resolve()
              })
              .catch((error) => {
                reject(error)
                res.send({error})
              })
          } else {
            reject(err)
          }
        })
      })

      app.listen(port)
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
