// lib/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Hash password error:', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Verify password error:', error);
    throw new Error('Failed to verify password');
  }
}

export function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '7d',
      algorithm: 'HS256'
    });
  } catch (error) {
    console.error('Generate token error:', error);
    throw new Error('Failed to generate token');
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    console.error('Verify token error:', error);
    throw error;
  }
}