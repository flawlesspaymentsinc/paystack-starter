const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

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
