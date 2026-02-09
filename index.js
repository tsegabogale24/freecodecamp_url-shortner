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
app.post('/api/shorturl', (req, res) => {
  let original_url = req.body.url;

  // Add protocol if missing
  if (!/^https?:\/\//i.test(original_url)) {
    original_url = 'http://www.' + original_url;
  }

  // Validate URL
  let urlObj;
  try {
    urlObj = new URL(original_url); // will throw if invalid
  } catch {
    return res.json({ error: "invalid url" });
  }

  // Check if hostname exists
  dns.lookup(urlObj.hostname, (err) => {
    if (err) return res.json({ error: "invalid url" });

    // Assign short URL
    const short_url = urldatabase.length + 1;

    // Store the **full URL string** exactly as received (with protocol)
    urldatabase.push({ original_url, short_url });

    // Respond with JSON
    res.json({ original_url, short_url });
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const shorturl = req.params.shorturl;
  const record = urldatabase.find(u => u.short_url == shorturl);

  if (record) {
    return res.redirect(record.original_url); // full URL including path/query
  }

  return res.json({ error: "short url not found" });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
