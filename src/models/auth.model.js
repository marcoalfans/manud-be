import { admin } from '../config/firebase.js';
import { deleteToken, deleteAllTokens, createVerificationToken, verifyEmailToken } from './token.model.js';
import { sendVerificationEmail } from '../services/email.service.js';
import bcrypt from 'bcrypt';

const auth = admin.auth();

export const userRegister = async (data) => {
  try {
    // Hash password for storage
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Test Firestore connection first
    const db = admin.firestore();
    
    // Check if user already exists in Firestore
    const existingUser = await db.collection('users').where('email', '==', data.email).get();
    
    if (!existingUser.empty) {
      throw new Error('Email already in use');
    }
    
    // Create user document in Firestore
    const userRef = db.collection('users').doc();
    await userRef.set({
      name: data.name,
      email: data.email,
      hashedPassword: hashedPassword,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create verification token and send email
    try {
      const verificationToken = await createVerificationToken(userRef.id, data.email);
      await sendVerificationEmail(data.email, verificationToken, data.name);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail registration if email fails
    }

    // Return user-like object
    return {
      uid: userRef.id,
      displayName: data.name,
      email: data.email,
      emailVerified: false,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const userLogin = async (data) => {
  try {
    // Get user from Firestore by email
    const db = admin.firestore();
    const userQuery = await db.collection('users').where('email', '==', data.email).get();
    
    if (userQuery.empty) {
      throw new Error('Incorrect email or password');
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(data.password, userData.hashedPassword);
    
    if (!isPasswordValid) {
      throw new Error('Incorrect email or password');
    }

    await deleteAllTokens(userDoc.id);

    // Return user-like object
    return {
      uid: userDoc.id,
      displayName: userData.name,
      email: userData.email,
      emailVerified: userData.emailVerified,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const userLogout = async (userId, token) => {
  await deleteToken(userId, token);
};

export const userResetPassword = async (email) => {
  try {
    // Generate password reset link using Admin SDK
    const link = await auth.generatePasswordResetLink(email);
    
    // In a real application, you would send this link via email
    // For now, we'll just return success
    console.log('Password reset link:', link);
    
    return { success: true, message: 'Password reset link generated' };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No user found with this email');
    }

    throw error;
  }
};

export const verifyUserEmail = async (token) => {
  try {
    const result = await verifyEmailToken(token);
    
    if (!result) {
      return null; // Invalid or expired token
    }

    // Update user's email verified status in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(result.userId).update({
      emailVerified: true,
      emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

export const resendVerificationEmail = async (email) => {
  try {
    const db = admin.firestore();
    
    // Find user by email
    const userQuery = await db.collection('users').where('email', '==', email).get();
    
    if (userQuery.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    if (userData.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Create new verification token and send email
    const verificationToken = await createVerificationToken(userDoc.id, email);
    await sendVerificationEmail(email, verificationToken, userData.name);

    return { success: true };
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
};
