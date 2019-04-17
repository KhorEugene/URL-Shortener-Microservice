'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
const dns = require('dns');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true});
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  url:String,
  urlNo:Number,
  shortUrl:String
});
const urlModel = mongoose.model('urlModel',urlSchema);
const createAndSave = function(link,num){
  const urlDoc = new urlModel({
    url:link,
    urlNo:num,
    shortUrl:'/api/shorturl/'+num
  });
  urlDoc.save(function(err,data){
    if(err){
     console.log(err); 
    }
      console.log("Document has been created for "+data.url);
    })
}
const findAndUpdate = function(link){
  urlModel.findOne({url:link},function(err,data){
    if(err){
   return console.log(err); 
  } 
    if(data==null){
      urlModel.estimatedDocumentCount(function(err,count){
        if(err){
         return console.log(err); 
        }
        createAndSave(link,count+1);
      });
      return console.log("Document was not present in database.");
    }
    console.log("Document found in database having url number "+data.urlNo);
  })
}
const deleteAll = function(){
  urlModel.deleteMany({},function(err){
  if(err){
    return console.log(err);
  }
    console.log("All documents deleted. Database cleared.");
  });
  
}

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// Updating (and deleting) database documents
urlModel.find({},function(err,data){
app.post("/api/shorturl/new", function (req, res) {
  dns.lookup(req.body.url.split('://')[1], function (err, addresses, family) {
    if(addresses == undefined){
      res.send({"error":"invalid URL"});
      return console.log('Wrong hostname format'); 
    }
    findAndUpdate(req.body.url);
    urlModel.estimatedDocumentCount(function(err,count){
      let short = 0;
      data.forEach(function(val){
        if(val.url==req.body.url){
          short = val.urlNo;
        } 
      })
      if(short==0){
        short = count+1;
      }
      console.log(short);
      res.send({"original_url":req.body.url.split('://')[1],"short_url":short});
    })
  });
  /*deleteAll();
  res.end();*/
});
});

//Redirection

app.get("/api/shorturl/:urlNo",function(req,res){
  urlModel.find({},function(err,data){
  if(err){
    console.log('Error with retrieving data from database');
  }
  let link = "";
  data.forEach(function(val){
  if(val.urlNo==req.params.urlNo){
   link=val.url; 
  }
  console.log(data);
  })
  if(link==""){
  res.send('Error in redirection. URL not in database.');
   return console.log("Not in database.") 
  }
  res.redirect(link);
  console.log('Redirect to '+link+' successful.');
});
});



app.listen(port, function () {
  console.log('Node.js listening on port '+port);
});
