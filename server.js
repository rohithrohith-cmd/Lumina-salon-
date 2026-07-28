const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(cors());

// Parse URL-encoded bodies (Twilio uses this format)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Twilio WhatsApp proxy endpoint
app.post('/api/send-whatsapp', (req, res) => {
    const { accountSid, authToken, to, from, contentSid, contentVariables } = req.body;

    if (!accountSid || !authToken || !to) {
        return res.status(400).json({ error: 'Missing required fields: accountSid, authToken, to' });
    }

    // Build POST body for Twilio
    const postData = new URLSearchParams({
        To: to,
        From: from || 'whatsapp:+14155238886',
        ContentSid: contentSid || 'HX350d429d32e64a552466cafecbe95f3c',
        ContentVariables: contentVariables || '{}'
    }).toString();

    const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log(`📤 Sending WhatsApp to ${to}...`);

    const twilioReq = https.request(options, (twilioRes) => {
        let data = '';
        twilioRes.on('data', (chunk) => { data += chunk; });
        twilioRes.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log(`✅ Twilio response (${twilioRes.statusCode}):`, parsed.sid || parsed.message || data);
                res.status(twilioRes.statusCode).json(parsed);
            } catch (e) {
                console.log(`⚠️ Twilio raw response:`, data);
                res.status(twilioRes.statusCode).send(data);
            }
        });
    });

    twilioReq.on('error', (error) => {
        console.error('❌ Twilio request error:', error.message);
        res.status(500).json({ error: error.message });
    });

    twilioReq.write(postData);
    twilioReq.end();
});

app.listen(PORT, () => {
    console.log(`\n🚀 GlowBook Server running at http://localhost:${PORT}`);
    console.log(`📱 WhatsApp API proxy ready at http://localhost:${PORT}/api/send-whatsapp\n`);
});
