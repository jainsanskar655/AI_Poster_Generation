// server.js - CLEAN FINAL VERSION
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // load .env

console.log("Loaded ENV:", {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deployment: process.env.DALLE_DEPLOYMENT,
  version: process.env.OPENAI_API_VERSION,
  apiKey: process.env.AZURE_OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Azure DALL-E Image Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ success: false, error: "Prompt is required" });
        }

        // Load from .env
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://dev-anakge-ai.openai.azure.com/
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.DALLE_DEPLOYMENT;   // e.g. dall-e-3
        const apiVersion = process.env.OPENAI_API_VERSION || "2024-04-01-preview";

        if (!endpoint || !apiKey || !deployment) {
            return res.status(500).json({ success: false, error: "Azure configuration missing in .env" });
        }

        const apiUrl = `${endpoint}openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;

        console.log("Calling Azure DALL-E:", apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                prompt,
                size: "1024x1024",
                n: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Azure API Error:", data);
            return res.status(response.status).json({
                success: false,
                error: data.error?.message || "Unknown Azure API error"
            });
        }

        res.json({
            success: true,
            imageUrl: data.data[0].url
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
