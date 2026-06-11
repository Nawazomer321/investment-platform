const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

const Settings = mongoose.model('Settings', settingsSchema);

// Default settings initializer
Settings.initDefaults = async () => {
  const defaults = [
    { key: 'jazzcash_number', value: '03001234567' },
    { key: 'jazzcash_name', value: 'Investment Platform' },
    { key: 'easypaisa_number', value: '03001234567' },
    { key: 'easypaisa_name', value: 'Investment Platform' },
    { key: 'platform_name', value: 'GoldPro Invest' },
    { key: 'min_withdrawal', value: 500 },
    { key: 'withdrawal_fee_percent', value: 0 },
  ];
  for (const s of defaults) {
    await Settings.findOneAndUpdate({ key: s.key }, { value: s.value }, { upsert: true, new: true });
  }
};

module.exports = Settings;
