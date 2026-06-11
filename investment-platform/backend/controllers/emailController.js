const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (email, name, otp) => {
  const mailOptions = {
    from: `"GoldPro Invest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification OTP - GoldPro Invest',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;text-align:center">
          <h1 style="margin:0;font-size:24px">GoldPro Invest</h1>
          <p style="margin:4px 0 0;opacity:0.9">Secure Investment Platform</p>
        </div>
        <div style="padding:32px">
          <p style="font-size:16px">Hi <strong>${name}</strong>,</p>
          <p>Your email verification OTP is:</p>
          <div style="background:#1a1a1a;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#f59e0b">${otp}</span>
          </div>
          <p style="color:#aaa;font-size:14px">This OTP expires in <strong style="color:#fff">10 minutes</strong>.</p>
          <p style="color:#aaa;font-size:14px">If you did not request this, please ignore this email.</p>
        </div>
        <div style="background:#1a1a1a;padding:16px;text-align:center;color:#666;font-size:12px">
          © 2024 GoldPro Invest. All rights reserved.
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — allow dev mode without email
  }
};
