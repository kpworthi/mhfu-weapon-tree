
"use strict";
require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');
const app        = express();
const server     = require('http').createServer(app);

const currentTimeEST = () => new Date().toLocaleString();

// helmet and other custom headers
app.use(helmet());
app.use(function (req, res, next){
  res.set({
    'surrogate-control': 'no-store',
    'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'pragma': 'no-cache',
    'expires': '0',
    'x-powered-by': 'PHP 7.4.3'
  });
  next();
});

// public folder
app.use('/', express.static(process.cwd() + '/dist'));

// icons folder
app.use('/ico', express.static(process.cwd() + '/ico'));

// index page
app.route('/')
  .get(function (req, res) {
    console.log(`Landing page GET @ ${currentTimeEST()}`);
    res.sendFile(process.cwd() + '/dist/index.html');
  });
  
// favicon
app.route('/favicon.ico')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/favicon.ico');
  });
 
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// Set up server
const portNum = process.env.PORT;
server.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
});

module.exports = server;
