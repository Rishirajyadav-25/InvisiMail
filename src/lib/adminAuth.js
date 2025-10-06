// src/lib/adminAuth.js
import { verifyToken } from './auth';
import { ObjectId } from 'mongodb';

export async function verifyAdminToken(token, db) {
  try {
    const decoded = verifyToken(token);
    
    // Fetch user from database
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is admin
    if (!user.isAdmin && user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    return { user, decoded };
  } catch (error) {
    throw error;
  }
}