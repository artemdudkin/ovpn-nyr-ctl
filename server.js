const fs = require('fs');
const http = require('http');
const express = require('express');
const compression = require('compression');
const ovpn = require('./ovpn');
const utils = require('./utils');


const SERVER_PORT = 2222;
const KEY_STORAGE_FOLDER = '/srv/www/xyz123man.ru/keys/'
const KEY_STORAGE_URL = 'http://xyz123man.ru/keys/';

console.log('cwd dir == ' + process.cwd());
console.log("config dir == ", __dirname);
console.log('port == ' + SERVER_PORT);
console.log('key storage folder == ' + KEY_STORAGE_FOLDER);
console.log('key storage url == ' + KEY_STORAGE_URL);


var app = express();

app.use(compression());

// log request details
app.use(function(req, res, next) {
  console.log('<<', req.protocol + '://' + req.get('host') + req.originalUrl);
  next();
})

// get request body
app.use (function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', function() {
      //convert req.body to json
      if (data) {
        try { 
          req.body = JSON.parse(data);
          console.log('<< body', JSON.stringify(req.body, null, 4));
        } catch(e) {
          req.body = data
          console.log('<< cannot parse body', req.body);
        }
      } else {
        req.body = {}
      }

      next();
    });
});



app.all('/get-prefix', function(req, res, next) {
  let ret = { resultCode:0, data: ovpn.getPrefix() }
  console.log('>>', ret);
  res.end( JSON.stringify(ret))
})


app.all('/get', function(req, res, next) {
  ovpn.get()
  .then(r => {
    let ret = {resultCode:0, data:r}
    console.log('>>', ret);
    res.end( JSON.stringify(ret));
  })
  .catch( err => {
    console.log("ERROR", err);
    console.log('>> 500');
    res.status(500).end();
  })
})


app.post('/add', function(req, res, next) {
  var name = req.body.name;
  if (!name) {
    const day = req.body.day;
    const d = new Date();
    name = utils.formatWith('yyMMdd', new Date(d.getFullYear(), d.getMonth(), d.getDate()+day)) + '-' + Math.floor(100000 + Math.random() * 900000);
  }

  if (name) {
    ovpn.add(name)
    .then(r => {
      //move ovpn file to key storage folder
      const fn = ovpn.getPrefix() + name + '.ovpn';
      fs.renameSync( '/root/'+fn, KEY_STORAGE_FOLDER + fn);

      let ret = {resultCode:0, url:KEY_STORAGE_URL+fn}
      console.log('>>', ret);
      res.end( JSON.stringify(ret));
    })
    .catch( err => {
      console.log("ERROR", err);
      console.log('>> 500');
      res.status(500).end();
    })
  } else {
    res.status(404).end();
  }
});


app.post('/remove', function(req, res, next) {
  const name = req.body.name;
  if (name) {
    ovpn.remove(name)
    .then(r => {
      //delete ovpn file from key storage folder
      const prefix = ovpn.getPrefix();
      const fn = (name.startsWith(prefix) ? '' : prefix) + name + '.ovpn';
      try { fs.unlinkSync( KEY_STORAGE_FOLDER + fn); } catch(e) {}

      let ret = {resultCode:0}
      console.log('>>', ret);
      res.end( JSON.stringify(ret));
    })
    .catch( err => {
      console.log("ERROR", err);
      console.log('>> 500');
      res.status(500).end();
    })
  } else {
    res.status(404).end();
  }
});


app.post('/hide', function(req, res, next) {
  const name = req.body.name;

  if (name) {
      //delete ovpn file from key storage folder
      const prefix = ovpn.getPrefix();
      const fn = (name.startsWith(prefix) ? '' : prefix) + name + '.ovpn';
      try { 
        fs.unlinkSync( KEY_STORAGE_FOLDER + fn); 

        let ret = {resultCode:0}
        console.log('>>', ret);
        res.end( JSON.stringify(ret));
      } catch(e) {
        console.log("ERROR", e);
      }
  } else {
    res.status(404).end();
  }
});


http.createServer(app).listen(SERVER_PORT);