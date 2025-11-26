# PushinPay Panel (Option A) - Ready for Render

This project contains a simple static frontend (public/) and a Node.js backend (index.js) that:

- Allows you to save PushinPay token and basic config via the panel
- Create a PIX checkout using the stored PushinPay token
- List created checkouts stored in checkouts.json
- Receive webhook calls at /pix/webhook (no signature validation implemented)

## How to use on Render

1. Create a GitHub repository and push these files (or upload directly to Render via GitHub).
2. In Render, create a **New Web Service** → Deploy from GitHub.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Environment variables: none required for Option A (token is provided in panel), but you can set PUSHINPAY_KEY if you prefer.

Notes:
- The PushinPay endpoint used in the code is `https://api.pushinpay.com.br/v1/payments`. Confirm with your PushinPay account docs and change if necessary.
- The server saves config and created checkouts to files in the project folder (config.json and checkouts.json). On Render the filesystem persists while the instance is running but will be reset on redeploys.
- For production, implement proper authentication and secure token storage.

