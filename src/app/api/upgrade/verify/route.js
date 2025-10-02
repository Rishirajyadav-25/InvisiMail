// src/app/api/upgrade/verify/route.js - NEW ENDPOINT FOR MANUAL VERIFICATION
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    console.log('🔍 Manual verification requested');

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const client = await clientPromise;
    const db = client.db();

    // Check if there's a recent paid payment for this user
    const recentPayment = await db.collection('payments').findOne(
      {
        userId: new ObjectId(decoded.userId),
        status: 'paid',
        updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      },
      { sort: { updatedAt: -1 } }
    );

    if (recentPayment) {
      console.log('✅ Found recent payment, updating user plan');
      
      // Update user to Pro
      await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $set: {
            plan: 'pro',
            upgradedAt: new Date(),
            subscriptionId: recentPayment.orderId,
            subscriptionStatus: 'active',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }
      );

      // Get updated user
      const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      return NextResponse.json({
        success: true,
        message: 'Plan verified and updated',
        user: updatedUser
      });
    }

    // Check current user plan
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    if (user.plan === 'pro') {
      return NextResponse.json({
        success: true,
        message: 'User already on Pro plan',
        user
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No recent payment found',
      user
    }, { status: 200 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 });
  }
}