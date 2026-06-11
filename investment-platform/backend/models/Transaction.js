const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'investment', 'profit', 'adjustment'],
    required: true
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['jazzcash', 'easypaisa', 'system'] },
  transactionId: { type: String }, // user-provided TXN ID
  screenshotUrl: { type: String }, // uploaded screenshot path
  accountNumber: { type: String }, // user's jazzcash/easypaisa number
  accountTitle: { type: String },
  description: { type: String },
  adminNote: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
