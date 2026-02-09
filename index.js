require('dotenv').config();
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Database - should use let/const
const urlDatabase = [];

// Helper function to validate URL
function isValidUrl(urlString) {
  try {
    // Try to create a URL object
    const urlObj = new URL(urlString);
    
    // Check if protocol is http or https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
}

// Helper function to check if hostname exists
function checkHostnameExists(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

// POST endpoint to create short URL
app.post('/api/shorturl', async (req, res) => {
  try {
    let original_url = req.body.url;
    
    // Check if URL was provided
    if (!original_url) {
      return res.json({ error: 'invalid url' });
    }
    
    // Check if URL has protocol, add http:// if missing
    if (!original_url.startsWith('http://') && !original_url.startsWith('https://')) {
      original_url = 'http://' + original_url;
    }
    
    // Validate URL format
    if (!isValidUrl(original_url)) {
      return res.json({ error: 'invalid url' });
    }
    
    // Extract hostname from URL
    const urlObj = new URL(original_url);
    const hostname = urlObj.hostname;
    
    // Check if hostname exists via DNS lookup
    try {
      await checkHostnameExists(hostname);
    } catch (err) {
      return res.json({ error: 'invalid url' });
    }
    
    // Check if URL already exists in database
    const existingUrl = urlDatabase.find(item => item.original_url === original_url);
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }
    
    // Create new short URL
    const short_url = urlDatabase.length + 1;
    urlDatabase.push({
      original_url: original_url,
      short_url: short_url
    });
    
    // Respond with JSON
    res.json({
      original_url: original_url,
      short_url: short_url
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:shorturl', (req, res) => {
  const shorturl = parseInt(req.params.shorturl);
  
  // Validate that shorturl is a number
  if (isNaN(shorturl)) {
    return res.json({ error: 'Wrong format' });
  }
  
  // Find the URL in database
  const record = urlDatabase.find(item => item.short_url === shorturl);
  
  if (record) {
    // Redirect to the original URL
    res.redirect(record.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

// Optional: Add an endpoint to see all URLs
app.get('/api/allurls', (req, res) => {
  res.json(urlDatabase);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});