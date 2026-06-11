# 💰 GoldPro Invest — Full Stack Investment Platform

A complete investment platform with User Panel + Admin Panel, built with Node.js, Express, MongoDB, and vanilla JS + Tailwind CSS.

---

## 📁 Folder Structure

```
investment-platform/
├── backend/
│   ├── controllers/
│   │   └── emailController.js     # OTP email sender
│   ├── middleware/
│   │   └── auth.js                # JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Plan.js
│   │   ├── Investment.js
│   │   ├── Transaction.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.js                # Signup, Login, OTP
│   │   ├── plans.js               # Investment plans CRUD
│   │   ├── transactions.js        # Deposit, Withdraw, Invest
│   │   └── admin.js               # Admin management
│   ├── uploads/                   # Uploaded screenshots (auto-created)
│   ├── server.js                  # Main entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    └── index.html                 # Complete SPA frontend
```

---

## 🚀 Setup & Installation

### 1. Install MongoDB
- Download from: https://www.mongodb.com/try/download/community
- Start MongoDB service

### 2. Setup Backend

```bash
cd investment-platform/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# - Set your MongoDB URI
# - Set a strong JWT_SECRET
# - Set your Gmail credentials for OTP emails
# - Set your JazzCash/Easypaisa account details
```

### 3. Configure .env

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/investment_platform
JWT_SECRET=your_random_secret_here_minimum_32_chars

ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=Admin@123456

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password  # See: Google App Password

JAZZCASH_NUMBER=03001234567
JAZZCASH_NAME=GoldPro Invest
EASYPAISA_NUMBER=03001234567
EASYPAISA_NAME=GoldPro Invest

FRONTEND_URL=http://localhost:3000
```

### 4. Start Backend

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server starts on: http://localhost:5000

### 5. Serve Frontend

Option A — Simple (no build needed):
```bash
# In frontend/ folder, serve with any static server
npx serve .
# or
python3 -m http.server 3000
```

Option B — Just open `frontend/index.html` in browser (change API const in JS if needed).

---

## 🔑 Default Admin Login

```
Email:    admin@goldproinvest.com  (or your ADMIN_EMAIL from .env)
Password: Admin@123456             (or your ADMIN_PASSWORD from .env)
```

---

## ✨ Features

### User Panel
- ✅ Signup with email + OTP verification
- ✅ Login with JWT tokens
- ✅ Dashboard: balance, invested, profit, withdrawn
- ✅ Investment Plans with live profit calculator
- ✅ Invest Now — deducts from balance, creates active investment
- ✅ Daily profit shown with progress bar
- ✅ Deposit via JazzCash / Easypaisa (screenshot + TXN ID)
- ✅ Withdrawal request (pending admin approval)
- ✅ Full transaction history with filters

### Admin Panel
- ✅ Secure admin login (role-based)
- ✅ Platform statistics dashboard
- ✅ View all users with search
- ✅ Block / Unblock any user
- ✅ Add / Deduct balance with reason
- ✅ Approve / Reject deposit requests
- ✅ Approve / Reject withdrawal requests
- ✅ View payment screenshots
- ✅ Create / Edit / Deactivate investment plans
- ✅ Update JazzCash & Easypaisa account details

### Auto Features
- ✅ Daily profit credited at midnight via cron job
- ✅ Principal returned when plan completes
- ✅ Withdrawal amount held during pending, refunded on rejection

---

## 📧 Gmail App Password Setup (for OTP)

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Search "App passwords"
4. Create app password for "Mail"
5. Use that 16-char password in EMAIL_PASS

---

## 🌐 Deploy to Production

### Backend (e.g. Railway, Render, VPS)
1. Push backend/ to GitHub
2. Set environment variables on the platform
3. Change MONGO_URI to MongoDB Atlas URL
4. Deploy

### Frontend (e.g. Netlify, Vercel, cPanel)
1. Change `const API = 'http://localhost:5000/api'` in index.html to your backend URL
2. Upload frontend/index.html to your hosting

---

## 🔒 Security Notes
- All passwords are bcrypt hashed
- JWT tokens expire in 30 days
- Admin routes are protected with role middleware
- File upload limited to 5MB
- Blocked users cannot login
