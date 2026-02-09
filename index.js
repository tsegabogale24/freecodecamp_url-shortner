require('dotenv').config();
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
urldatabase = [];
app.post('/api/shorturl' , (req , res) => {
  original_url = req.body.url;
  const urlObj = new URL(original_url);
 const hostname = urlObj.hostname;
  dns.lookup(hostname , (err , address , family) => {
    if(err){
      res.json({error: "invalid url"})
    }
    else{
      shortUrl = urldatabase.length + 1;
      urldatabase.push({original_url: original_url , short_url: shortUrl});
      res.json({original_url: original_url , short_url: shortUrl});
    }
  })
})
app.get('/api/shorturl/:shorturl' , (req , res) => {
  shorturl = req.params.shorturl;
  url = urldatabase.find(url => url.short_url == shorturl);
  if(url){
    res.redirect(url.original_url);
  }
  else{
    res.json({error: "short url not found"});
  }
})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
