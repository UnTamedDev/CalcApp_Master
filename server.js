// --- FILE: server.js (CONTRACTOR VERSION - UPDATED FOR EMAIL) ---

// Load environment variables FIRST
require('dotenv').config(); // Reads .env file

const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer'); // Require nodemailer
const { calculateOverallTotal } = require('./calculation.js'); // Should be in root

const app = express();
const PORT = process.env.PORT || 3002; // Use a different port (e.g., 3002) for Contractor app

// --- Load Pricing Data ---
const pricingPath = path.join(__dirname, 'data', 'pricingData.json'); // Correct path relative to server.js
let pricingData;
try {
    const rawData = fs.readFileSync(pricingPath, 'utf8');
    pricingData = JSON.parse(rawData);
    console.log("[Server Contractor] Pricing data loaded successfully from:", pricingPath);
    // Basic validation
    if (!pricingData || !pricingData.doorPricingGroups || !pricingData.hingeCosts || !pricingData.customPaint || !pricingData.lazySusan) {
         throw new Error("Pricing data is missing required sections.");
    }
} catch (error) {
    console.error("[Server Contractor] FATAL ERROR loading pricing data:", error);
    console.error(`[Server Contractor] Ensure file exists at: ${pricingPath}`);
    process.exit(1);
}

// --- Nodemailer Transporter Setup ---
// Use environment variables for security
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'), // Default port if not set
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Optional: Add TLS options if needed for certain providers
    // tls: {
    //    ciphers:'SSLv3' // Example if needed for older services
    // }
});

// Verify transporter connection (optional, good for debugging)
transporter.verify(function(error, success) {
  if (error) {
    console.error("[Server Contractor] Email transporter config error:", error);
  } else {
    console.log("[Server Contractor] Email transporter is ready to send messages");
  }
});


// --- Middleware ---
app.use(express.json({ limit: '5mb' })); // Increase limit slightly for HTML content
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Calculation Endpoint (Contractor specific calculation if needed, otherwise use shared)
// Assuming a different endpoint or logic might exist for contractor server
app.post('/calculate', (req, res) => { // Changed from /api/calculate if desired
    console.log(`[Server Contractor] Received POST request on /calculate`);
    try {
        // *** IMPORTANT: You might need a different calculation file/logic for contractor ***
        // const { calculateContractorTotal } = require('./contractor-calculation.js');
        // const result = calculateContractorTotal(req.body, pricingData);

        // Using the same calculation for now, adjust if needed
        const result = calculateOverallTotal(req.body, pricingData); // Ensure this includes contractor logic
        console.log(`[Server Contractor] Calculation successful.`);
        res.json(result);
    } catch (error) {
        console.error('[Server Contractor] Error during calculation:', error.message);
        res.status(400).json({ error: 'Calculation error', message: error.message });
    }
});

// --- NEW Email Endpoint ---
app.post('/api/send-email', async (req, res) => {
    console.log(`[Server Contractor] Received POST request on /api/send-email`);
    const { clientEmail, estimateHtml } = req.body;

    // Basic Validation
    if (!clientEmail || typeof clientEmail !== 'string' || !clientEmail.includes('@')) {
        return res.status(400).json({ error: 'Invalid client email address provided.' });
    }
    if (!estimateHtml || typeof estimateHtml !== 'string' || estimateHtml.length < 50) { // Basic check for HTML content
        return res.status(400).json({ error: 'Invalid or missing estimate HTML content.' });
    }

    // Set up email data
    const mailOptions = {
        from: process.env.EMAIL_FROM || '"nuDoors Estimator" <no-reply@example.com>', // Use ENV variable or default
        to: clientEmail, // Email address from the request
        subject: 'Your nuDoors Project Estimate',
        html: `
            <h1>nuDoors Estimate</h1>
            <p>Hello,</p>
            <p>Thank you for your interest in nuDoors! Please find your generated project estimate below:</p>
            <hr>
            ${estimateHtml}
            <hr>
            <p><em>This is an automated estimate. Prices subject to final review and measurement. Please contact your nuDoors representative with any questions.</em></p>
        `,
        // Optional: Add a plain text version
        // text: `Hello,\n\nYour nuDoors estimate details are attached or included in the HTML.\n\n${overallTotal}\n...`
    };

    // Send mail with defined transport object
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('[Server Contractor] Message sent: %s', info.messageId);
        res.status(200).json({ success: true, message: `Estimate successfully sent to ${clientEmail}` });
    } catch (error) {
        console.error('[Server Contractor] Error sending email:', error);
        // Provide a more generic error message to the client
        res.status(500).json({ error: 'Failed to send email. Please check server logs or configuration.' });
    }
});

// --- Base Route ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Generic Error Handler ---
app.use((err, req, res, next) => {
  console.error("[Server Contractor] Unhandled Error:", err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`[Server Contractor] Contractor server running at http://localhost:${PORT}`);
});