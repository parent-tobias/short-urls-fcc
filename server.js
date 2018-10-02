'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

const cors = require('cors');
let connection = mongoose.connect(process.env.MONGO_URI);

let app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

let shortcutSchema = new mongoose.Schema({
  index: Number,
  url: String,
  description: String
});

let Shortcut = mongoose.model("Shortcut", shortcutSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

/**
 * URL for an existing endpoint. Check if the index is stored in our
 *  mongoDB
 **/
app.get("/api/shorturl/:index", function(req, res){
  let myIndex = req.params.index;
  if(myIndex){
    let shortcutRequest = Shortcut.find({index: myIndex}, function(err, data){
      if(err) {
        res.json({"error": err});
        res.end();
      } else if (data) {
        console.log(data);
        res.writeHead(308, {"Location": data[0].url});
        res.end();
      } else {
        res.json({"error": "No page matching that ID."});
        res.end();
      }
    });
  }
});
/***
 * URL to handle the shortcut creation thing.
 ***/
app.post("/api/shorturl/new", function(req, res){
  let myUrl = url.parse(req.body.url).host.split(".");
  let myLookupUrl = myUrl[myUrl.length-2]+"."+myUrl[myUrl.length-1];


 
  dns.lookup(myLookupUrl, (err, address, family) => {
    if (err){
      res.json({"Message": "DNS lookup failed", "error": err});
    } else {
      /**
       * We have a valid DNS address. get the count of current rows, to create
       * an index value.
       **/
      let myIndexQuery = Shortcut.find( (iqError, iqData) => {
        if (iqError) res.json({"error":iqError});

        if(iqData){
          let myShortcut = new Shortcut({"url": req.body.url, "index":iqData.length});
          myShortcut.save( (saveErr, saveData) => {
            if(saveErr) res.json({"error":saveErr});
            if(saveData) res.json(saveData)
          })
        }
      });

    }
  })

  // res.json({"url":myUrl});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});