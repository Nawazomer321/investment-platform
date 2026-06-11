const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  planName: { type: String },
  amount: { type: Number, required: true },
  dailyROI: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  totalExpectedProfit: { type: Number },
  profitEarned: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  lastProfitCredited: { type: Date, default: Date.now },
  daysCompleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

investmentSchema.pre('save', function(next) {
  if (!this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + this.durationDays * 24 * 60 * 60 * 1000);
  }
  if (!this.totalExpectedProfit) {
    this.totalExpectedProfit = parseFloat(((this.amount * this.dailyROI / 100) * this.durationDays).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Investment', investmentSchema);
