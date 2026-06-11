const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const Settings = require('../models/Settings');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// STATS
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      activeInvestments,
      totalProfitPaid,
      pendingDeposits,
      pendingWithdrawals
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Transaction.aggregate([{ $match: { type: 'deposit', status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'withdrawal', status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Investment.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Transaction.aggregate([{ $match: { type: 'profit' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'pending' })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        activeInvestmentsAmount: activeInvestments[0]?.total || 0,
        activeInvestmentsCount: activeInvestments[0]?.count || 0,
        totalProfitPaid: totalProfitPaid[0]?.total || 0,
        pendingDeposits,
        pendingWithdrawals
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ALL USERS
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'user' };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(filter)
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER DETAIL
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [investments, recentTxns] = await Promise.all([
      Investment.find({ user: user._id }).populate('plan', 'name').sort({ createdAt: -1 }).limit(10),
      Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(15)
    ]);

    res.json({ success: true, user, investments, recentTxns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// BLOCK / UNBLOCK USER
router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block admin.' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`, isBlocked: user.isBlocked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADJUST BALANCE
router.patch('/users/:id/balance', async (req, res) => {
  try {
    const { action, amount, reason } = req.body;
    if (!action || !amount || !reason)
      return res.status(400).json({ success: false, message: 'Action, amount, and reason required.' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const amt = parseFloat(amount);
    if (action === 'add') {
      user.balance += amt;
    } else if (action === 'deduct') {
      if (user.balance < amt) return res.status(400).json({ success: false, message: 'User balance insufficient.' });
      user.balance -= amt;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'adjustment',
      amount: action === 'add' ? amt : -amt,
      status: 'completed',
      paymentMethod: 'system',
      description: `Admin ${action}: ${reason}`,
      processedBy: req.user._id,
      processedAt: new Date()
    });

    res.json({ success: true, message: `Balance ${action === 'add' ? 'added' : 'deducted'} successfully.`, newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET / UPDATE SETTINGS
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.find();
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json({ success: true, settings: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Settings.findOneAndUpdate({ key }, { value, updatedAt: new Date() }, { upsert: true });
    }
    res.json({ success: true, message: 'Settings updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
