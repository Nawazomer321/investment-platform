const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// USER: Submit deposit
router.post('/deposit', protect, upload.single('screenshot'), async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, accountNumber, accountTitle } = req.body;
    if (!amount || !paymentMethod || !transactionId)
      return res.status(400).json({ success: false, message: 'Amount, payment method and transaction ID required.' });
    if (parseFloat(amount) < 100)
      return res.status(400).json({ success: false, message: 'Minimum deposit is PKR 100.' });

    const txn = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      paymentMethod,
      transactionId,
      accountNumber,
      accountTitle,
      screenshotUrl: req.file ? `/uploads/${req.file.filename}` : null,
      description: `Deposit via ${paymentMethod}`
    });

    res.status(201).json({ success: true, message: 'Deposit request submitted. Pending admin approval.', transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER: Submit withdrawal
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, paymentMethod, accountNumber, accountTitle } = req.body;
    if (!amount || !paymentMethod || !accountNumber)
      return res.status(400).json({ success: false, message: 'All withdrawal fields required.' });

    const user = await User.findById(req.user._id);
    if (parseFloat(amount) > user.balance)
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    if (parseFloat(amount) < 500)
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is PKR 500.' });

    // Hold amount during pending
    user.balance -= parseFloat(amount);
    await user.save();

    const txn = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      status: 'pending',
      paymentMethod,
      accountNumber,
      accountTitle,
      description: `Withdrawal via ${paymentMethod}`
    });

    res.status(201).json({ success: true, message: 'Withdrawal request submitted. Processing within 24 hours.', transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER: Invest
router.post('/invest', protect, async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const user = await User.findById(req.user._id);
    const plan = await Plan.findById(planId);

    if (!plan || !plan.isActive)
      return res.status(404).json({ success: false, message: 'Plan not found or inactive.' });
    if (parseFloat(amount) < plan.minAmount)
      return res.status(400).json({ success: false, message: `Minimum investment is PKR ${plan.minAmount}.` });
    if (parseFloat(amount) > plan.maxAmount)
      return res.status(400).json({ success: false, message: `Maximum investment is PKR ${plan.maxAmount}.` });
    if (parseFloat(amount) > user.balance)
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });

    // Deduct balance
    user.balance -= parseFloat(amount);
    user.totalInvested += parseFloat(amount);
    await user.save();

    const investment = await Investment.create({
      user: req.user._id,
      plan: plan._id,
      planName: plan.name,
      amount: parseFloat(amount),
      dailyROI: plan.dailyROI,
      durationDays: plan.durationDays
    });

    await Transaction.create({
      user: req.user._id,
      type: 'investment',
      amount: parseFloat(amount),
      status: 'completed',
      paymentMethod: 'system',
      description: `Invested in ${plan.name}`,
      investment: investment._id
    });

    res.status(201).json({ success: true, message: `Investment of PKR ${amount} in ${plan.name} started!`, investment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER: Get my transactions
router.get('/my', protect, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const txns = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, transactions: txns, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// USER: Get my investments
router.get('/investments', protect, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .populate('plan', 'name color icon')
      .sort({ createdAt: -1 });
    res.json({ success: true, investments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Get all transactions
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const txns = await Transaction.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, transactions: txns, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Approve or reject deposit/withdrawal
router.patch('/admin/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'
    const txn = await Transaction.findById(req.params.id).populate('user');
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (txn.status !== 'pending') return res.status(400).json({ success: false, message: 'Already processed.' });

    const user = await User.findById(txn.user._id);

    if (action === 'approve') {
      txn.status = 'approved';
      if (txn.type === 'deposit') {
        user.balance += txn.amount;
        await user.save();
      }
      // Withdrawal was already deducted on submit; nothing to do on approve
    } else if (action === 'reject') {
      txn.status = 'rejected';
      if (txn.type === 'withdrawal') {
        // Refund on rejection
        user.balance += txn.amount;
        await user.save();
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    txn.adminNote = adminNote;
    txn.processedBy = req.user._id;
    txn.processedAt = new Date();
    await txn.save();

    res.json({ success: true, message: `Transaction ${action}d successfully.`, transaction: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
