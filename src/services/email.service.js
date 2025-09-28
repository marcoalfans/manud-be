import nodemailer from 'nodemailer';
import config from '../utils/config.js';

// Email configuration
let transporter = null;

const initializeEmailService = () => {
  try {
    // Check if email config exists
    if (!config.email?.user || !config.email?.password) {
      console.log('Email service disabled - missing credentials');
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    console.log('Email service initialized');
    return transporter;
  } catch (error) {
    console.error('Email service initialization error:', error);
    return null;
  }
};

// Verify email service connection
const verifyEmailService = async () => {
  try {
    if (!transporter) {
      return false;
    }
    await transporter.verify();
    console.log('Email service ready');
    return true;
  } catch (error) {
    console.error('Email service verification error:', error);
    return false;
  }
};

// Send verification email
export const sendVerificationEmail = async (email, token, name) => {
  try {
    if (!transporter) {
      console.log('Email service not available - skipping email send');
      return false;
    }

    const verificationUrl = `${config.app.baseUrl}/auth/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"ManudBE API" <${config.email.user}>`,
      to: email,
      subject: 'Verify Your Email - ManudBE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ManudBE!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with ManudBE. Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          
          <p>This link will expire in 24 hours.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with ManudBE, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't throw error - just log it
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, token, name) => {
  try {
    if (!transporter) {
      console.log('Email service not available - skipping password reset email');
      return false;
    }

    const resetUrl = `${config.app.baseUrl}/auth/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"ManudBE API" <${config.email.user}>`,
      to: email,
      subject: 'Password Reset - ManudBE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your ManudBE account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          
          <p>This link will expire in 1 hour.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Initialize email service
transporter = initializeEmailService();
if (transporter) {
  verifyEmailService();
}