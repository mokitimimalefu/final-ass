const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, verificationToken, userType = 'user') => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://final-group-3.onrender.com'}/verify-email?token=${verificationToken}`;
    
    const userTypeMessages = {
      student: 'Thank you for registering as a student with the Career Guidance Platform!',
      company: 'Thank you for registering your company with the Career Guidance Platform!',
      institute: 'Thank you for registering your institution with the Career Guidance Platform!',
      admin: 'Thank you for registering as an admin with the Career Guidance Platform!'
    };

    const message = userTypeMessages[userType] || 'Thank you for registering with the Career Guidance Platform!';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Career Guidance Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Verification</h2>
          <p>${message}</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}"
             style="display: inline-block; background-color: #2563eb; color: white;
                    padding: 12px 24px; text-decoration: none; border-radius: 4px;
                    margin: 20px 0;">
            Verify Email
          </a>
          <p>If the button doesn't work, copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email} (${userType})`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendVerificationEmail };