const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const FACEBOOK_PIXEL_ID = "1762550680948330";
const FACEBOOK_ACCESS_TOKEN = "EAAQC9vIxIIcBO8fepusAVOPtnUZAejnv9J2goyEqKOZAha3eRYOGdrFOLAIdE33blIUhq888F650fwEFBJMFWrwENxDkRtdTBAg2FhqwFzEYA1MR7QZCcupSnrAit8WMo5ZCZBhcwhHWuyWmKYbc6qeJ7CN5v7ZBfEySMeeS0NaLPbbocd5I5V4j9t3M2X0CnmZAQZDZD";

const PORT = process.env.PORT || 3015;

// Health Check Route
app.get("/whop", (req, res) => {
    res.send("✅ Webhook server is running!");
});

// Webhook Route
app.post("/whop-webhook", async (req, res) => {
    try {
        console.log("📥 Incoming Webhook Data:", req.body);
        const event = req.body;

        if (!event || !event.amount || !event.customer_email) {
            console.error("❌ Invalid webhook data received", event);
            return res.status(400).send("Invalid webhook data");
        }

        const purchaseValue = event.amount / 100;
        const currency = event.currency || "USD";
        const userEmail = event.customer_email;

        // Hash the email (SHA-256 required by Facebook)
        const hashedEmail = crypto.createHash("sha256").update(userEmail.toLowerCase()).digest("hex");

        const facebookEvent = {
            data: [{
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                user_data: { em: [hashedEmail] },
                custom_data: { value: purchaseValue, currency: currency },
                action_source: "website"
            }],
            access_token: FACEBOOK_ACCESS_TOKEN
        };

        console.log("📤 Sending event to Facebook:", JSON.stringify(facebookEvent, null, 2));

        const response = await axios.post(`https://graph.facebook.com/v13.0/${FACEBOOK_PIXEL_ID}/events`, facebookEvent);

        console.log("✅ Facebook Response:", response.data);
        res.status(200).json({ message: "Event sent to Facebook", fb_response: response.data });
    } catch (error) {
        console.error("❌ Facebook API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send event", details: error.message });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
