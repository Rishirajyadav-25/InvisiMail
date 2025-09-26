// src/app/api/user/route.js - ENHANCED VERSION
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // FIXED: Add no-cache headers to prevent stale user data
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { 
        status: 401,
        headers 
      });
    }

    const decoded = verifyToken(token);
    const client = await clientPromise;
    const db = client.db();

    // FIXED: Force fresh read from database with no caching
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        projection: { 
          password: 0 // Don't return password
        }
      }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers 
      });
    }

    // ENHANCED: Add subscription status check
    let subscriptionStatus = 'inactive';
    if (user.plan === 'pro') {
      const now = new Date();
      const nextBilling = user.nextBillingDate ? new Date(user.nextBillingDate) : null;
      
      if (nextBilling && nextBilling > now) {
        subscriptionStatus = 'active';
      } else if (nextBilling && nextBilling <= now) {
        subscriptionStatus = 'expired';
        // Optionally downgrade expired subscriptions
        // await db.collection('users').updateOne(
        //   { _id: new ObjectId(decoded.userId) },
        //   { $set: { plan: 'free', subscriptionStatus: 'expired' } }
        // );
      }
    }

    const userResponse = {
      ...user,
      subscriptionStatus,
      isProActive: user.plan === 'pro' && subscriptionStatus === 'active'
    };

    console.log('User fetched from DB:', { 
      id: user._id, 
      email: user.email, 
      plan: user.plan,
      subscriptionStatus,
      upgradedAt: user.upgradedAt 
    });

    return NextResponse.json(userResponse, { headers });

  } catch (error) {
    console.error('User API error:', error);
    
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { 
        status: 401,
        headers 
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user data' }, 
      { 
        status: 500,
        headers 
      }
    );
  }
}