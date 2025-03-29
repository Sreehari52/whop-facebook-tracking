require("dotenv").config();
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json()); // Parse JSON payloads

const FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const PORT = process.env.PORT || 3015;

if (!FACEBOOK_PIXEL_ID || !FACEBOOK_ACCESS_TOKEN) {
    console.error("❌ Missing environment variables: FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN");
    process.exit(1);
}

app.get("/whop", (req, res) => {
    res.send("✅ Webhook server is running!");
});

app.post("/whop-webhook", async (req, res) => {
    try {
        const event = req.body;
        if (!event || !event.amount || !event.customer_email) {
            return res.status(400).send("Invalid webhook data");
        }

        // Extract payment details
        const purchaseValue = event.amount / 100;
        const currency = event.currency || "USD";
        const userEmail = event.customer_email;

        // Hash email for Facebook CAPI
        const hashedEmail = crypto.createHash("sha256").update(userEmail.toLowerCase()).digest("hex");

        // Send Purchase Event to Facebook CAPI
        const response = await axios.post(`https://graph.facebook.com/v13.0/${FACEBOOK_PIXEL_ID}/events`, {
            data: [{
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                user_data: { em: [hashedEmail] },
                custom_data: { value: purchaseValue, currency: currency },
                action_source: "website"
            }],
            access_token: FACEBOOK_ACCESS_TOKEN
        });

        console.log(`✅ Sent purchase event for ${userEmail}: $${purchaseValue}`);
        res.status(200).json({ message: "Event sent to Facebook", fb_response: response.data });

    } catch (error) {
        console.error("❌ Error sending event:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to send event", details: error.message });
    }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
