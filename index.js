const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config();
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Paystack API Integration Server Running');
});

app.post('/initialize-payment', async (req, res) => {
  const { email, amount } = req.body;
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      { email, amount },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No authorization code provided");
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/connect/token",
      { code },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token, account_id, subaccount } = response.data;

    console.log("Merchant onboarded:", { access_token, account_id, subaccount });

    res.send("Merchant onboarding successful!");
  } catch (error) {
    console.error("Token exchange failed", error.response?.data || error.message);
    res.status(500).send("Something went wrong during onboarding");
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Root route
app.get("/", (req, res) => {
  res.send("Paystack API Integration Server Running");
});

// Paystack Connect OAuth - Redirect to authorize
app.get("/connect", (req, res) => {
  const redirectUri = `${process.env.BASE_URL}/callback`;
  const clientId = process.env.PAYSTACK_CLIENT_ID;

  const url = `https://connect.paystack.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  res.redirect(url);
});

// OAuth Callback - Exchange code for access token
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post("https://connect.paystack.com/oauth/token", {
      client_id: process.env.PAYSTACK_CLIENT_ID,
      client_secret: process.env.PAYSTACK_SECRET,
      code: code
    });

    const accessToken = response.data.access_token;
    const subaccountInfo = response.data;

    // TODO: Save accessToken and subaccountInfo in a real DB
    console.log("Merchant Connected:", subaccountInfo);

    res.send("Merchant successfully connected to your platform!");
  } catch (error) {
    console.error("OAuth Error:", error.response?.data || error.message);
    res.status(500).send("OAuth connection failed.");
  }
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
  const event = req.body;

  // TODO: Verify signature with Paystack secret if needed

  console.log("Webhook Event Received:", event.event);

  res.sendStatus(200); // Always respond with 200
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
