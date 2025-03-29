const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.json()); // Parse JSON webhook payloads

// Manually set Facebook Pixel ID & Access Token
const FACEBOOK_PIXEL_ID = "658182220125214"; // Replace with your Pixel ID
const FACEBOOK_ACCESS_TOKEN = "EAAQC9vIxIIcBO4PmUhdQuZAh8dNTOCjyigC2bVqZCKZA708NUFAWP7WpZCZANCKOY3RcMh7YBWuZB1aGQjAQo7DkGIJnPFYl689RBaoqU8IMLGq9DRdLrniyaZCzPgwP56Blkdr6jMCP3QvRKSoDatjgtZB8XDVkSbuglv7ZC6FZBVZCHVTYOKKi6kr8wPOy4UDALYtigZDZD"; // Replace with your Token

const PORT = process.env.PORT || 3015;

// Test Route
app.get("/whop", (req, res) => {
    res.send("✅ Webhook server is running!");
});

// Webhook Route
app.post("/whop-webhook", async (req, res) => {
    try {
        const event = req.body;

        if (!event || !event.amount || !event.customer_email) {
            return res.status(400).send("Invalid webhook data");
        }

        // Extract Payment Data
        const purchaseValue = event.amount / 100; // Convert cents to dollars
        const currency = event.currency || "USD";
        const userEmail = event.customer_email;

        // Hash Email for Facebook CAPI
        const hashedEmail = crypto.createHash("sha256").update(userEmail.toLowerCase()).digest("hex");

        // Send Purchase Event to Facebook
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

// Start Server
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
