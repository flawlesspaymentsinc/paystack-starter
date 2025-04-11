require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Root route
app.get("/", (req, res) => {
  res.send("Paystack API Integration Server Running");
});

// Initialize Payment
app.post("/initialize-payment", async (req, res) => {
  const { email, amount } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ error: "Email and amount are required" });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Payment Init Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// Redirect to Paystack Connect
app.get("/connect", (req, res) => {
  const redirectUri = `${process.env.BASE_URL}/callback`;
  const clientId = process.env.PAYSTACK_CLIENT_ID;

  const url = `https://connect.paystack.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  res.redirect(url);
});

// Callback handler for Paystack Connect
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No authorization code provided");
  }

  try {
    const response = await axios.post(
      "https://connect.paystack.com/oauth/token",
      {
        client_id: process.env.PAYSTACK_CLIENT_ID,
        client_secret: process.env.PAYSTACK_SECRET,
        code: code,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token, subaccount, account_id } = response.data;

    console.log("Merchant onboarded:", { access_token, subaccount, account_id });

    res.send("Merchant successfully connected to your platform!");
  } catch (error) {
    console.error("OAuth Error:", error.response?.data || error.message);
    res.status(500).send("OAuth token exchange failed.");
  }
});

// Webhook handler
app.post("/webhook", (req, res) => {
  const event = req.body;

  // TODO: Add signature verification here
  console.log("Webhook Event Received:", event.event);

  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
