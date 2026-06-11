require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// 404
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');

    const Settings = require('./models/Settings');
    await Settings.initDefaults();

    // Create default admin if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@goldproinvest.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        phone: '03000000000',
        password: adminPass,
        role: 'admin',
        isVerified: true
      });
      console.log(`✅ Admin created: ${adminEmail} / ${adminPass}`);
    }

    // Create sample plans if none exist
    const Plan = require('./models/Plan');
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany([
        { name: 'Silver Plan', description: 'Perfect for beginners', minAmount: 1000, maxAmount: 10000, dailyROI: 1.5, durationDays: 30, color: '#94a3b8', icon: '🥈' },
        { name: 'Gold Plan', description: 'Most popular plan', minAmount: 10000, maxAmount: 100000, dailyROI: 2.5, durationDays: 30, color: '#f59e0b', icon: '🥇' },
        { name: 'Diamond Plan', description: 'High returns for serious investors', minAmount: 50000, maxAmount: 500000, dailyROI: 3.5, durationDays: 45, color: '#06b6d4', icon: '💎' },
        { name: 'Platinum Plan', description: 'Maximum returns, premium tier', minAmount: 100000, maxAmount: 1000000, dailyROI: 5.0, durationDays: 60, color: '#8b5cf6', icon: '👑' },
      ]);
      console.log('✅ Sample plans created');
    }

    // CRON: Credit daily profit at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('⏰ Running daily profit cron...');
      try {
        const Investment = require('./models/Investment');
        const Transaction = require('./models/Transaction');
        const now = new Date();

        const activeInvestments = await Investment.find({ status: 'active' });
        let credited = 0;

        for (const inv of activeInvestments) {
          const dailyProfit = parseFloat(((inv.amount * inv.dailyROI) / 100).toFixed(2));
          const user = await User.findById(inv.user);
          if (!user || user.isBlocked) continue;

          user.balance += dailyProfit;
          user.totalProfit += dailyProfit;
          inv.profitEarned += dailyProfit;
          inv.daysCompleted += 1;
          inv.lastProfitCredited = now;

          // Check if plan completed
          if (inv.daysCompleted >= inv.durationDays) {
            // Return principal
            user.balance += inv.amount;
            inv.status = 'completed';
          }

          await user.save();
          await inv.save();

          await Transaction.create({
            user: user._id,
            type: 'profit',
            amount: dailyProfit,
            status: 'completed',
            paymentMethod: 'system',
            description: `Daily profit from ${inv.planName}`,
            investment: inv._id
          });
          credited++;
        }
        console.log(`✅ Profit credited to ${credited} investments.`);
      } catch (err) {
        console.error('Cron error:', err.message);
      }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
