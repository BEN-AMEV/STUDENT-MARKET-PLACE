const nodemailer = require('nodemailer');

/**
 * Create email transporter.
 * Uses SMTP configuration from environment variables.
 * Falls back to Ethereal (fake SMTP) in development.
 */
const createTransporter = () => {
  // Production: use SendGrid, Gmail, or custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback: log to console
  console.warn('⚠️  No SMTP configured. Emails will be logged to console.');
  return null;
};

const transporter = createTransporter();

/**
 * Send an email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML body
 * @param {string} [options.text] - Plain text fallback
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"Student Marketplace Hub" <${process.env.SMTP_FROM || 'noreply@marketplace.hub'}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
  };

  if (!transporter) {
    // Dev fallback: log email to console
    console.log('\n📧 ═══════════════════════════════════════');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text || html.replace(/<[^>]*>/g, '')}`);
    console.log('═══════════════════════════════════════════\n');
    return { messageId: 'dev-console' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw error;
  }
};

// ─── Email Templates ──────────────────────────────────────────────────

/**
 * Send OTP verification email.
 */
const sendVerificationEmail = async (email, otp, firstName) => {
  return sendEmail({
    to: email,
    subject: 'Verify Your Email — Student Marketplace Hub',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Welcome to Student Marketplace Hub!</h2>
        <p style="color: #555; font-size: 15px;">Hi ${firstName},</p>
        <p style="color: #555; font-size: 15px;">Use the code below to verify your email address:</p>
        <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (email, resetUrl, firstName) => {
  return sendEmail({
    to: email,
    subject: 'Reset Your Password — Student Marketplace Hub',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e;">Password Reset Request</h2>
        <p style="color: #555; font-size: 15px;">Hi ${firstName},</p>
        <p style="color: #555; font-size: 15px;">You requested a password reset. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #4361ee; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
