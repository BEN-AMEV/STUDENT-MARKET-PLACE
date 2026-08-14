const nodemailer = require('nodemailer');

/**
 * Create email transporter.
 * Supports Gmail service preset, SendGrid, custom SMTP, or console logging fallback.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  // Strip spaces from Google App Password (e.g. 'dhsr vtsd luga xgtz' -> 'dhsrvtsdlugaxgtz')
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const isGmail = (process.env.SMTP_SERVICE || '').toLowerCase() === 'gmail' ||
                  (host || '').toLowerCase().includes('gmail');

  if (isGmail && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed/proxy cert rejection on cloud hosts
      },
    });
  }

  return null;
};

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
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@studentmarketplace.app';
  const mailOptions = {
    from: fromAddress.includes('<') ? fromAddress : `"CampusMarket" <${fromAddress}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
  };

  const transporter = getTransporter();

  if (!transporter) {
    // Dev fallback: log email to console
    console.log('\n📧 ═══════════════════════════════════════════════════════════');
    console.log(`   [DEV EMAIL FALLBACK — NO SMTP CONFIGURED]`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${text || html.replace(/<[^>]*>/g, '').trim()}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    return { messageId: 'dev-console' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${to} [ID: ${info.messageId}]`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed to ${to}:`, error.message);
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
    subject: `${otp} is your CampusMarket verification code`,
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #090e0c; color: #e1e7e4; border-radius: 16px; border: 1px solid #1c2e26;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00e676; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">CampusMarket</h1>
          <p style="color: #84968d; font-size: 14px; margin: 4px 0 0 0;">Student Marketplace Verification</p>
        </div>
        <div style="background-color: #101a16; border-radius: 12px; padding: 24px; border: 1px solid #1c2e26;">
          <p style="color: #e1e7e4; font-size: 16px; margin: 0 0 12px 0;">Hi ${firstName || 'Student'},</p>
          <p style="color: #84968d; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">Use the 6-digit verification code below to verify your student email address and activate your account:</p>
          <div style="background-color: #0d2218; border: 2px dashed #00e676; border-radius: 12px; padding: 18px; text-align: center; margin: 16px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #00e676;">${otp}</span>
          </div>
          <p style="color: #84968d; font-size: 12px; margin: 16px 0 0 0; text-align: center;">⏱️ This code expires in 10 minutes.</p>
        </div>
        <p style="color: #52635a; font-size: 12px; text-align: center; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
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
    subject: 'Reset Your CampusMarket Password',
    html: `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #090e0c; color: #e1e7e4; border-radius: 16px; border: 1px solid #1c2e26;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00e676; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">CampusMarket</h1>
        </div>
        <div style="background-color: #101a16; border-radius: 12px; padding: 24px; border: 1px solid #1c2e26;">
          <h2 style="color: #e1e7e4; font-size: 18px; margin: 0 0 12px 0;">Password Reset Request</h2>
          <p style="color: #84968d; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">Hi ${firstName || 'Student'}, you requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #00e676 0%, #00b359 100%); color: #090e0c; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #84968d; font-size: 12px; margin: 16px 0 0 0; text-align: center;">⏱️ This link expires in 1 hour.</p>
        </div>
        <p style="color: #52635a; font-size: 12px; text-align: center; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
