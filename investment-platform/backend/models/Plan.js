const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  dailyROI: { type: Number, required: true }, // percentage per day
  durationDays: { type: Number, required: true },
  totalROI: { type: Number }, // calculated: dailyROI * durationDays
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#f59e0b' },
  icon: { type: String, default: '💰' },
  createdAt: { type: Date, default: Date.now }
});

planSchema.pre('save', function(next) {
  this.totalROI = parseFloat((this.dailyROI * this.durationDays).toFixed(2));
  next();
});

module.exports = mongoose.model('Plan', planSchema);
