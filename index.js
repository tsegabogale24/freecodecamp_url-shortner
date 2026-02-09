require('dotenv').config();
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL).then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));
// Define URL schema and model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});
const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(`${process.cwd()}/views/index.html`);
});

// Simple test API
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// Helper function to validate URL
function isValidUrl(urlString) {
  try {
    const urlObj = new URL(urlString);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper function to check if hostname exists
function checkHostnameExists(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

// POST endpoint to create short URL
app.post('/api/shorturl', async (req, res) => {
  try {
    let original_url = req.body.url;

    if (!original_url) return res.json({ error: 'invalid url' });

    // Add http:// if missing
    if (!/^https?:\/\//i.test(original_url)) {
      original_url = 'http://' + original_url;
    }

    // Validate format
    if (!isValidUrl(original_url)) return res.json({ error: 'invalid url' });

    const urlObj = new URL(original_url);
    try {
      await checkHostnameExists(urlObj.hostname);
    } catch {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists
    const existing = await Url.findOne({ original_url });
    if (existing) {
      return res.json({
        original_url: existing.original_url,
        short_url: existing.short_url,
      });
    }

    // Create new short URL
    const count = await Url.countDocuments({});
    const newUrl = new Url({
      original_url,
      short_url: count + 1,
    });
    await newUrl.save();

    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url,
    });

  } catch (err) {
    console.error(err);
    res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = parseInt(req.params.short_url);
  if (isNaN(shorturl)) return res.json({ error: 'Wrong format' });

  const record = await Url.findOne({ short_url: shorturl });
  if (!record) return res.json({ error: 'No short URL found for the given input' });

  res.redirect(301 , record.original_url);
});

// Start server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
