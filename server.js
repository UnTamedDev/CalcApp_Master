// --- FILE: server.js ---

const express = require('express');
const path = require('path');
const fs = require('fs');
const { calculateOverallTotal } = require('./calculation.js'); // Import CONTRACTOR calculation logic

const app = express();
const PORT = process.env.PORT || 3002; // Use a different port (e.g., 3002) for local dev if running DIY app simultaneously

// --- Load Pricing Data ---
// Construct the absolute path to the pricing data file inside the 'data' folder
const pricingPath = path.join(__dirname, 'data', 'pricingData.json'); // Path updated
let pricingData;
try {
    const rawData = fs.readFileSync(pricingPath, 'utf8');
    pricingData = JSON.parse(rawData);
    console.log("[Server Contractor] Pricing data loaded successfully from data/pricingData.json."); // Updated log
    // Basic validation of loaded data
    if (!pricingData || !pricingData.doorPricingGroups || !pricingData.hingeCosts || !pricingData.customPaint || !pricingData.lazySusan) {
         throw new Error("Pricing data is missing required sections (doorPricingGroups, hingeCosts, customPaint, lazySusan).");
    }
} catch (error) {
    console.error("[Server Contractor] FATAL ERROR: Could not load or parse pricing data.", error);
    // Exit if pricing data is essential and cannot be loaded
    process.exit(1);
}


// --- Middleware ---
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (HTML, CSS, JS, Assets) from 'public' folder

// --- API Routes ---
app.post('/calculate', (req, res) => {
    console.log(`[Server Contractor] Received POST request on /calculate`);
    try {
        // Pass the loaded pricing data to the calculation function
        const result = calculateOverallTotal(req.body, pricingData);
        console.log(`[Server Contractor] Calculation successful. Sending response.`);
        res.json(result);
    } catch (error) {
        console.error('[Server Contractor] Error during calculation:', error.message);
        // Send a more informative error response
        res.status(400).json({ error: 'Calculation error', message: error.message }); // Use 400 for bad input/calc errors
    }
});

// --- Base Route (Serve index.html) ---
// Optional: Explicitly serve index.html for the root path,
// though express.static usually handles this. Good for clarity.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Generic Error Handler (Place after all routes) ---
app.use((err, req, res, next) => {
  console.error("[Server Contractor] Unhandled Error:", err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
});


// --- Start Server ---
// Use PORT variable defined earlier
app.listen(PORT, () => {
    console.log(`[Server Contractor] nuDoors Contractor Estimator server running at http://localhost:${PORT}`);
});

// --- Optional: Export for potential modular use (Render doesn't strictly need it for 'npm start') ---
module.exports = app; // Keep for flexibility