const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Serve static files from current directory
app.use(express.static('.'));

// API endpoint to get images data
app.get('/api/images', (req, res) => {
    try {
        const imagesPath = '/Users/m./Documents/DEV/🌑🦧 - images.csv';
        const data = fs.readFileSync(imagesPath, 'utf8');
        res.json({ data });
    } catch (error) {
        console.error('Error reading images CSV:', error);
        res.status(500).json({ error: 'Failed to read images data' });
    }
});

// API endpoint to get metadata data
app.get('/api/metadata', (req, res) => {
    try {
        const metadataPath = '/Users/m./Documents/DEV/🌑🦧 - JSON Files.csv';
        const data = fs.readFileSync(metadataPath, 'utf8');
        res.json({ data });
    } catch (error) {
        console.error('Error reading metadata CSV:', error);
        res.status(500).json({ error: 'Failed to read metadata data' });
    }
});

// Proxy endpoint for Arweave requests to handle CORS
app.get('/api/proxy', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`🌑 Midnight Apes Gallery server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
});