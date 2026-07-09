// test-email.js — Run with: node test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const config = {
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
};

console.log('\n📧 Testing SMTP Connection...');
console.log('Host    :', config.host);
console.log('Port    :', config.port);
console.log('User    :', config.auth.user);
console.log('Password:', config.auth.pass ? `${'*'.repeat(config.auth.pass.length)} (${config.auth.pass.length} chars)` : 'NOT SET');
console.log('From    :', process.env.MAIL_FROM);
console.log('-----------------------------------\n');

const transporter = nodemailer.createTransport(config);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection FAILED:', error.message);
    console.error('\n🔍 Likely cause:');
    if (error.message.includes('535') || error.message.includes('Username and Password')) {
      console.error('   → Wrong App Password. Generate a new one at:');
      console.error('     https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('534') || error.message.includes('Application-specific')) {
      console.error('   → 2-Step Verification not enabled on this Gmail account.');
      console.error('     Enable it at: https://myaccount.google.com/security');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.error('   → Cannot reach smtp.gmail.com:587. Check firewall/network.');
    } else {
      console.error('   → Check credentials and Gmail settings.');
    }
  } else {
    console.log('✅ SMTP Connection SUCCESSFUL! Server is ready to send emails.');
    console.log('\nSending test OTP email...');

    transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_USERNAME, // send to self as test
      subject: 'Test OTP — Vita Platform',
      html: '<h2>Test OTP: <strong>123456</strong></h2><p>If you see this, email is working correctly!</p>',
    }, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:', err.message);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Check inbox at:', process.env.MAIL_USERNAME);
      }
    });
  }
});
