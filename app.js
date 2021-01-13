const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const {Readable}=require('stream');
const gridfs = require("gridfs-stream");
var fs=require('fs');
gridfs.mongo=mongoose.mongo;
const app = express();
require('dotenv/config');



app.use(bodyParser.json());
app.use(cors());



mongoose.connect(
    process.env.DB_STRING,
    { useNewUrlParser: true ,useUnifiedTopology: true },
    (req,res)=>{console.log("connected")});
   
mongoose.connection.on('error',console.error.bind(console,"error "));
  
mongoose.connection.once('open',()=>{
    
    
    var gfs=gridfs(mongoose.connection.db);
    
    app.get('/',(req,res)=>{
      res.send("this is an music API")
    });
    
    app.post('/write',(req,res)=>{
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});
    upload.single('track')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: "Upload Request Validation Failed" });
        } else if(!req.body.name) {
          return res.status(400).json({ message: "No track name in request body" });
        }
      let file_name=req.body.name;
      
      const readableTrackStream = new Readable();
    readableTrackStream.push(req.file.buffer);
    readableTrackStream.push(null);

      var writestream=gfs.createWriteStream({filename:file_name});
      readableTrackStream.pipe(writestream);
      writestream.on('close',(file)=>{
        res.send('file created :'+file.filename);
      });

    });
});
    
    app.get('/read/:name',(req,res)=>{
    let name=req.params.name;
    gfs.exist({filename:name},(err,file)=>{
      if(err ||!file)
      res.send("file is not found");
      else{
        res.set('content-type','audio/mp3');
        var readstream=gfs.createReadStream({filename:name});
        readstream.pipe(res);
      }
    });
    });
    
    app.get('/delete/:name',(req,res)=>{
        let name=req.params.name;
        gfs.exist({filename:name},(err,file)=>{
          if(err ||!file)
          res.send("file is not found");
          else{
           gfs.remove({filename:name});
           res.send("delted "+name);
          }
        });
    });
    
});
app.listen(5000);