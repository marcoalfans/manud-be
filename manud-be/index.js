/**
 * ManudBE Firebase Functions
 * Email verification and other cloud functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

// For cost control, set maximum instances
setGlobalOptions({ maxInstances: 10, region: "asia-southeast1" });

// Import nodemailer for email sending
const nodemailer = require("nodemailer");

// Gmail transporter configuration
const gmailTransporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: "panda.mti2025@gmail.com",
    pass: "rbgz vomh btsr jiiv", // App password
  },
});

/**
 * Send verification email function
 * Triggered by HTTPS request
 */
exports.sendVerificationEmail = onCall(async (request) => {
  try {
    const { email, name, verificationToken } = request.data;
    
    if (!email || !name || !verificationToken) {
      throw new Error("Missing required parameters: email, name, verificationToken");
    }

    const verificationUrl = `https://manudaja.my.id:7777/auth/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: '"ManudBE API" <panda.mti2025@gmail.com>',
      to: email,
      subject: "Verify Your Email - ManudBE",
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
          <p style="color: #666; font-size: 12px;">
            This email was sent by Firebase Functions - ManudBE
          </p>
        </div>
      `,
    };

    await gmailTransporter.sendMail(mailOptions);
    
    logger.info(`Verification email sent successfully to ${email}`);
    
    return {
      success: true,
      message: `Verification email sent to ${email}`,
    };
  } catch (error) {
    logger.error("Error sending verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
});

/**
 * Auto-send verification email when user is created
 * Triggered by Firestore document creation
 */
exports.onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  try {
    const userData = event.data?.data();
    
    if (!userData || userData.emailVerified) {
      return; // Skip if no data or already verified
    }
    
    logger.info(`New user created: ${userData.email}`);
    
    // This will be handled by the main app calling sendVerificationEmail function
    // We don't auto-send here to avoid conflicts
    
  } catch (error) {
    logger.error("Error in onUserCreated trigger:", error);
  }
});

/**
 * Test function
 */
exports.helloManudBE = onRequest((request, response) => {
  logger.info("Hello from ManudBE!", {structuredData: true});
  response.send("Hello from ManudBE Firebase Functions!");
});
