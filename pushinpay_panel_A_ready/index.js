import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const CHECKOUTS_PATH = path.join(process.cwd(), 'checkouts.json');

function readJson(p, fallback) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p);
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('readJson error', e);
  }
  return fallback;
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// Init files if missing
if (!fs.existsSync(CONFIG_PATH)) writeJson(CONFIG_PATH, {});
if (!fs.existsSync(CHECKOUTS_PATH)) writeJson(CHECKOUTS_PATH, []);

// Save config (receiver_name, pushin_token, redirect_url)
app.post('/save-config', (req, res) => {
  const { receiver_name, pushin_token, redirect_url } = req.body;
  const config = { receiver_name, pushin_token, redirect_url };
  writeJson(CONFIG_PATH, config);
  res.json({ ok: true, config });
});

// Get config
app.get('/config', (req, res) => {
  const config = readJson(CONFIG_PATH, {});
  res.json(config);
});

// List created checkouts
app.get('/checkouts', (req, res) => {
  const list = readJson(CHECKOUTS_PATH, []);
  res.json(list);
});

// Create PIX checkout using PushinPay
app.post('/create-checkout', async (req, res) => {
  try {
    const { amount_reais, description } = req.body;
    if (!amount_reais) return res.status(400).json({ error: 'amount_reais required' });

    const config = readJson(CONFIG_PATH, {});
    const token = config.pushin_token;

    if (!token) return res.status(400).json({ error: 'PushinPay token not configured. Use the panel to save token.' });

    // Convert reais to centavos (integer)
    const amount_centavos = Math.round(Number(amount_reais) * 100);

    // Build payload - confirm with PushinPay docs if your account requires different fields.
    const payload = {
      amount: amount_centavos,
      payment_type: 'pix',
      description: description || 'Pagamento via PIX',
      // Optional: redirect URL after payment (if PushinPay supports)
      redirect_url: config.redirect_url || undefined,
      customer: {
        name: config.receiver_name || undefined
      }
    };

    // Example endpoint - adjust if your PushinPay account uses a different URL
    const PUSHIN_ENDPOINT = 'https://api.pushinpay.com.br/v1/payments';

    const response = await axios.post(PUSHIN_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    // Save checkout in local file
    const checkouts = readJson(CHECKOUTS_PATH, []);
    const saved = {
      id: data.id || (new Date()).getTime().toString(),
      created_at: new Date().toISOString(),
      amount_reais,
      payload_sent: payload,
      response: data
    };
    checkouts.unshift(saved);
    writeJson(CHECKOUTS_PATH, checkouts);

    res.json(saved);
  } catch (err) {
    console.error('create-checkout error', err.response?.data || err.message);
    res.status(500).json({ error: 'error creating checkout', details: err.response?.data || err.message });
  }
});

// Webhook to receive pushinpay notifications
app.post('/pix/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  // You should validate signature according to PushinPay docs - not implemented here
  // Update checkout status if needed (left as an exercise)
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server started on port', PORT));
