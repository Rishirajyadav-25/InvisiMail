// src/app/api/upgrade/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';
import Razorpay from 'razorpay';

// Validate Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Razorpay credentials not configured in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    console.log('🚀 Upgrade request initiated');

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      console.error('❌ No authentication token provided');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('✅ Token verified for user:', decoded.userId);

    const client = await clientPromise;
    const db = client.db();

    // Fetch user with fresh data
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👤 User found:', { id: user._id, email: user.email, plan: user.plan });

    // Check if user is already Pro
    if (user.plan === 'pro') {
      console.log('⚠️ User already has Pro plan');
      return NextResponse.json({ error: 'User is already on Pro plan' }, { status: 400 });
    }

    // Generate unique receipt ID (under 40 characters)
    const timestamp = Date.now().toString().slice(-8);
    const userIdShort = user._id.toString().slice(-8);
    const receiptId = `pro_${userIdShort}_${timestamp}`;
    
    console.log('🧾 Generated receipt ID:', receiptId);

    // Get amount from environment or default
    const amountInRupees = Number(process.env.RAZORPAY_PRO_AMOUNT_RUPEES || 499);
    const amountInPaise = amountInRupees * 100;

    console.log('💰 Payment amount:', { amountInRupees, amountInPaise });

    // Create Razorpay order
    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: user._id.toString(),
        email: user.email,
        upgrade: 'pro',
        plan: 'pro_monthly'
      }
    };

    console.log('📦 Creating Razorpay order with options:', orderOptions);
    
    const order = razorpay.orders.create(orderOptions);
    console.log('✅ Razorpay order created:', { id: order.id, amount: order.amount, currency: order.currency });

    // Store payment record in database
    const paymentRecord = {
      userId: new ObjectId(decoded.userId),
      orderId: order.id,
      receiptId: receiptId,
      amount: order.amount,
      currency: 'INR',
      status: 'created',
      plan: 'pro',
      createdAt: new Date(),
      updatedAt: new Date(),
      razorpayOrderData: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    };

    const insertResult = await db.collection('payments').insertOne(paymentRecord);
    console.log('💾 Payment record created:', insertResult.insertedId);

    // Return order details for frontend
    const responseData = {
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      user: {
        email: user.email,
        name: user.name
      }
    };

    console.log('📤 Sending response:', responseData);

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('🔴 Upgrade API Error Details:');
    console.error('- Error message:', error.message);
    console.error('- Error code:', error.code);
    console.error('- Error description:', error.description);
    console.error('- Full error:', error);
    
    // Handle specific Razorpay errors
    if (error.error && error.error.code) {
      const razorpayError = error.error;
      console.error('🔴 Razorpay specific error:', razorpayError);
      
      return NextResponse.json({
        error: `Payment system error: ${razorpayError.description || razorpayError.code}`,
        code: razorpayError.code
      }, { status: 400 });
    }
    
    // Handle database errors
    if (error.name === 'MongoError') {
      console.error('🔴 Database error:', error.message);
      return NextResponse.json({
        error: 'Database error occurred. Please try again.'
      }, { status: 500 });
    }

    // Handle authentication errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.error('🔴 Authentication error:', error.message);
      return NextResponse.json({
        error: 'Authentication failed. Please login again.'
      }, { status: 401 });
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to create upgrade order. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}