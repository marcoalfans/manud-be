import { db, admin } from '../config/firebase.js';
import crypto from 'crypto';

export const addToken = async (userId, token) => {
  const docRef = db.collection('tokens').doc();

  const newData = {
    token,
    userId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(newData);
};

export const deleteToken = async (userId, token) => {
  const querySnapshot = await db.collection('tokens')
    .where('userId', '==', userId)
    .where('token', '==', token)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    throw new Error('token not found');
  }

  // Delete found documents
  const docId = querySnapshot.docs[0].id;
  await db.collection('tokens').doc(docId).delete();
};

export const deleteAllTokens = async (userId) => {
  const tokensRef = db.collection('tokens').where('userId', '==', userId);
  const snapshot = await tokensRef.get();

  const batch = db.batch();
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

export const isTokenValid = async (userId, token) => {
  const querySnapshot = await db.collection('tokens')
    .where('userId', '==', userId)
    .where('token', '==', token)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return false;
  }

  return true;
};

// Email verification token functions
export const createVerificationToken = async (userId, email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const docRef = db.collection('verificationTokens').doc();
  await docRef.set({
    token,
    userId,
    email,
    type: 'email_verification',
    expiresAt,
    used: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return token;
};

export const verifyEmailToken = async (token) => {
  const querySnapshot = await db.collection('verificationTokens')
    .where('token', '==', token)
    .where('type', '==', 'email_verification')
    .where('used', '==', false)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const tokenData = doc.data();

  // Check if token is expired
  const now = new Date();
  const expiresAt = tokenData.expiresAt.toDate();
  
  if (now > expiresAt) {
    return null; // Token expired
  }

  // Mark token as used
  await doc.ref.update({ used: true });

  return {
    userId: tokenData.userId,
    email: tokenData.email,
  };
};

export const createPasswordResetToken = async (userId, email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const docRef = db.collection('verificationTokens').doc();
  await docRef.set({
    token,
    userId,
    email,
    type: 'password_reset',
    expiresAt,
    used: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return token;
};
