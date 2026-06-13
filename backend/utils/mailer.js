const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'AYUSHI Clinic <no-reply@ayushi.in>';

// Returns true only if email credentials look configured (not the placeholder).
const isEmailConfigured = () =>
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASS &&
  process.env.EMAIL_PASS !== 'your_gmail_app_password_here';

const shell = (inner) => `
  <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; background: #f9f5f0; padding: 32px; border-radius: 12px; border:1px solid #e6ddcf;">
    <h2 style="color: #4a7c59; text-align: center; margin:0 0 4px;">🌿 AYUSHI</h2>
    <p style="color:#999; text-align:center; font-size:12px; letter-spacing:2px; margin:0 0 24px;">AYURVEDIC CLINICAL SYSTEM</p>
    ${inner}
    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
    <p style="color: #888; font-size: 12px; text-align: center;">AYUSHI — Ayurvedic Patient Data Management System</p>
  </div>`;

// OTP email (kept for completeness)
const sendOTPEmail = async (to, name, otp) => {
  await transporter.sendMail({
    from: FROM, to, subject: 'AYUSHI — Email Verification OTP',
    html: shell(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your email verification OTP is:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="background:#4a7c59;color:#fff;font-size:30px;font-weight:bold;letter-spacing:8px;padding:14px 28px;border-radius:8px;">${otp}</span>
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>`),
  });
};

// Sent to the doctor confirming their join request was received.
const sendRequestReceivedEmail = async (to, name) => {
  await transporter.sendMail({
    from: FROM, to, subject: 'AYUSHI — Join Request Received',
    html: shell(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for your interest in joining the AYUSHI Ayurvedic Clinical System.</p>
      <p>Your request to join has been received and is now <strong>pending review</strong> by our administrator.
         You will receive another email with your login credentials once your request is approved.</p>
      <p style="color:#888;font-size:13px;">No action is needed from you at this time.</p>`),
  });
};

// Sent to the doctor once the admin approves — contains login credentials.
const sendApprovalEmail = async (to, name, email, password, loginUrl) => {
  await transporter.sendMail({
    from: FROM, to, subject: 'AYUSHI — Your Doctor Account is Approved 🎉',
    html: shell(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>Great news! Your request to join AYUSHI has been <strong style="color:#4a7c59;">approved</strong>.</p>
      <p>You can now sign in with the credentials below:</p>
      <div style="background:#fff;border:1px solid #c8e6c9;border-radius:8px;padding:16px 20px;margin:18px 0;">
        <p style="margin:6px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:6px 0;"><strong>Temporary Password:</strong>
          <span style="font-family:monospace;background:#f0f7f3;padding:3px 8px;border-radius:5px;">${password}</span></p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${loginUrl}" style="background:#4a7c59;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:Inter,Arial,sans-serif;">Sign In to AYUSHI</a>
      </div>
      <p style="color:#b8860b;font-size:13px;">⚠ For your security, please change this password after your first login (Profile → Change Password).</p>`),
  });
};

// Sent to the doctor if the admin rejects the request.
const sendRejectionEmail = async (to, name, note) => {
  await transporter.sendMail({
    from: FROM, to, subject: 'AYUSHI — Update on Your Join Request',
    html: shell(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for your interest in joining AYUSHI. After review, we are unable to approve your request at this time.</p>
      ${note ? `<p><strong>Note from administrator:</strong> ${note}</p>` : ''}
      <p>You are welcome to reach out to the clinic administrator for more information.</p>`),
  });
};

module.exports = {
  transporter,
  isEmailConfigured,
  sendOTPEmail,
  sendRequestReceivedEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};
