import httpStatus from 'http-status';
import { admin } from '../config/firebase.js';

export const testFirestore = async (req, res) => {
  try {
    // Test basic Firebase Admin initialization
    console.log('Testing Firebase Admin...');
    
    const db = admin.firestore();
    console.log('Firestore instance created');
    
    // Simple test - just try to get a reference (doesn't require database to exist)
    const testRef = db.collection('test').doc('connection');
    console.log('Collection reference created');
    
    // Try to create the database by writing a document
    await testRef.set({
      message: 'Firestore connection test',
      timestamp: new Date().toISOString(),
      projectId: 'manud-db-f253e',
    });
    console.log('Document written successfully');
    
    // Try to read it back
    const doc = await testRef.get();
    const data = doc.data();
    console.log('Document read successfully:', data);
    
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Firestore connection successful',
      projectId: 'manud-db-f253e',
      data: data,
    });
  } catch (error) {
    console.error('Firestore test error:', error);
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: error.message,
      code: error.code,
      projectId: 'manud-db-f253e',
    });
  }
};