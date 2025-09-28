import nodemailer from 'nodemailer';
import config from '../utils/config.js';

// Email configuration
let transporter = null;

const initializeEmailService = () => {
  try {
    // Check if email is enabled
    if (!config.email?.enabled) {
      console.log('Email service disabled by configuration');
      return null;
    }

    // Check if email config exists
    if (!config.email?.user || !config.email?.password) {
      console.log('Email service disabled - missing credentials');
      return null;
    }

    // Try alternative SMTP configuration for better reliability
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
      // More aggressive timeout settings
      connectionTimeout: 60000,  // 60 seconds
      greetingTimeout: 30000,    // 30 seconds  
      socketTimeout: 60000,      // 60 seconds
      
      // Additional settings for reliability
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      
      // Connection pooling with conservative settings
      pool: false,               // Disable pooling to avoid connection issues
      maxConnections: 1,         
      maxMessages: 1,            // One message per connection
    });

    console.log('Email service initialized with SMTP settings');
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

// Send verification email with retry mechanism
export const sendVerificationEmail = async (email, token, name, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
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

      // Send email with timeout
      const emailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 25000) // 25 seconds timeout
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`Verification email sent to ${email} (attempt ${attempt + 1})`);
      return true;
      
    } catch (error) {
      console.error(`Error sending verification email (attempt ${attempt + 1}):`, error.message);
      
      // If this was the last attempt, give up
      if (attempt === retries) {
        console.error(`Failed to send verification email to ${email} after ${retries + 1} attempts`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return false;
};

// Send password reset email with retry mechanism
export const sendPasswordResetEmail = async (email, token, name, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
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

      // Send email with timeout
      const emailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 25000) // 25 seconds timeout
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`Password reset email sent to ${email} (attempt ${attempt + 1})`);
      return true;
      
    } catch (error) {
      console.error(`Error sending password reset email (attempt ${attempt + 1}):`, error.message);
      
      // If this was the last attempt, give up
      if (attempt === retries) {
        console.error(`Failed to send password reset email to ${email} after ${retries + 1} attempts`);
        return false;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return false;
};

// Initialize email service
transporter = initializeEmailService();
if (transporter) {
  verifyEmailService();
}