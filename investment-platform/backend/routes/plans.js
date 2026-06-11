const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const { protect, adminOnly } = require('../middleware/auth');

// GET all active plans (public)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ minAmount: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: GET all plans
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: CREATE plan
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, minAmount, maxAmount, dailyROI, durationDays, color, icon } = req.body;
    const plan = await Plan.create({ name, description, minAmount, maxAmount, dailyROI, durationDays, color, icon });
    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: UPDATE plan
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: DELETE / deactivate plan
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Plan deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
