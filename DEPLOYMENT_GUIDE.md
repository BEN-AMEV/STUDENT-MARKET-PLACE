# CampusMarket — Production Deployment & Hosting Guide

This guide outlines step-by-step instructions to deploy both the **Backend API** (Node.js/Express/MongoDB) and **Frontend Client** (React/Vite).

---

## 🏗️ Architecture Overview

| Component | Recommended Host | Build Command | Output / Start Command |
|---|---|---|---|
| **Backend API** | Render / Railway / DigitalOcean App Platform | `npm install` | `npm start` (or `node server.js`) |
| **Frontend Client** | Vercel / Netlify / Render Static | `npm run build` | `dist` |
| **Database** | MongoDB Atlas | Managed M0 / M10+ | Connection URI |
| **Media Storage** | Cloudinary | — | Cloud Name, API Key, Secret |
| **Payments & Escrow** | Paystack (Ghana) | — | Live Keys (`sk_live_...`, `pk_live_...`) |

---

## 1. Backend API Deployment (e.g., Render / Railway)

### Step 1: Push Repository to GitHub
Make sure your repository has both `server/` and `client/` committed.

### Step 2: Create a Web Service
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 3: Configure Environment Variables
Set the following environment variables in your hosting provider's dashboard:

```ini
# Server Environment
NODE_ENV=production
PORT=5000

# Client Domain (Allow multiple by comma-separating)
CLIENT_URL=https://your-frontend-domain.vercel.app

# MongoDB Atlas Database URI
MONGO_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/campusmarket?retryWrites=true&w=majority

# JWT Authentication Secrets (Generate secure random hex strings)
JWT_SECRET=your_super_strong_jwt_secret_hex
JWT_REFRESH_SECRET=your_super_strong_refresh_secret_hex

# Email SMTP (Brevo, SendGrid, Gmail, or Mailgun)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=CampusMarket <noreply@yourdomain.com>

# Cloudinary (Persistent Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Paystack (Live Keys in Production)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# 24-Hour Escrow Hold & Cron Worker
ESCROW_HOLD_HOURS=24
PAYOUT_CRON_SCHEDULE=*/10 * * * *
```

### Step 4: Configure Paystack Webhook
1. Go to your **[Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers)** -> **API Keys & Webhooks**.
2. Set **Live Webhook URL** to:
   ```
   https://your-backend-api.onrender.com/api/orders/paystack-webhook
   ```
3. Test the webhook to confirm HTTP 200 responses.

---

## 2. Frontend Client Deployment (e.g., Vercel / Netlify)

### Option A: Vercel (Recommended)
1. Import your GitHub repository to Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Build Settings will auto-detect:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Configure Environment Variables:
   ```ini
   VITE_API_URL=https://your-backend-api.onrender.com/api
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
   ```
6. Click **Deploy**. SPA rewrites are already pre-configured via `client/vercel.json`.

### Option B: Netlify
1. Import repository on Netlify.
2. **Base directory**: `client`
3. **Build command**: `npm run build`
4. **Publish directory**: `client/dist`
5. Add the same environment variables under **Site configuration -> Environment variables**.
6. SPA rewrites are pre-configured via `client/public/_redirects`.

---

## 3. Production Health Check & Verification

Once deployed, perform this quick 5-minute health checklist:

1. **API Health**: Visit `https://your-backend-api.onrender.com/api/health` -> should return `{"status":"ok", ...}`.
2. **Frontend Navigation**: Visit `https://your-frontend.vercel.app` and refresh on `/explore` and `/login` (ensures SPA routing works without 404s).
3. **Student Registration & OTP**: Register an account with a `.edu` email and verify receipt of verification email or OTP.
4. **Create Listing & Image Upload**: Upload listing photos to verify Cloudinary media pipeline.
5. **Checkout & Paystack**: Open an item and trigger the Paystack Inline checkout modal.
6. **Seller Payout Account**: In **Profile -> Payout Account**, test connecting a Ghana MoMo or Bank account to verify Paystack Transfer Recipient creation.
