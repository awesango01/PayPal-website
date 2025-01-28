const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// Replace with your PayPal API credentials (from developer.paypal.com)
const CLIENT_ID = process.env.CLIENT_ID; // Heroku will provide this
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Heroku will provide this
const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Sandbox URL

// Get PayPal OAuth token
async function getAuthToken() {
  const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials', {
    auth: { username: CLIENT_ID, password: CLIENT_SECRET },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data.access_token;
}

// Create PayPal payment
app.post('/create-payment', async (req, res) => {
  try {
    const { email, amount } = req.body;
    const authToken = await getAuthToken();

    const payment = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: amount },
        payee: { email_address: email } // Recipient's PayPal email
      }],
      application_context: {
        return_url: 'https://YOUR-HEROKU-APP-NAME.herokuapp.com/success',
        cancel_url: 'https://YOUR-HEROKU-APP-NAME.herokuapp.com/cancel'
      }
    };

    const response = await axios.post(`${PAYPAL_API}/v2/checkout/orders`, payment, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running'));