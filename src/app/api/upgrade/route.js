// src/app/api/upgrade/route.js - CORRECT VERSION
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';
import Razorpay from 'razorpay';

// Validate Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('CRITICAL: Razorpay credentials not configured');
  throw new Error('Razorpay credentials not configured in environment variables');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  const logPrefix = '[Create Order]';
  
  try {
    console.log(`${logPrefix} Upgrade request initiated`);

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      console.error(`${logPrefix} No authentication token`);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log(`${logPrefix} User authenticated: ${decoded.userId}`);

    const client = await clientPromise;
    const db = client.db();

    // Fetch user
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user) {
      console.error(`${logPrefix} User not found: ${decoded.userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`${logPrefix} User found:`, { 
      email: user.email, 
      currentPlan: user.plan 
    });

    // Check if already Pro
    if (user.plan === 'pro') {
      console.log(`${logPrefix} User already Pro`);
      return NextResponse.json({ error: 'User is already on Pro plan' }, { status: 400 });
    }

    // Get amount
    const amountInRupees = Number(process.env.RAZORPAY_PRO_AMOUNT_RUPEES || 499);
    const amountInPaise = amountInRupees * 100;

    console.log(`${logPrefix} Amount: ₹${amountInRupees} (${amountInPaise} paise)`);

    // Generate receipt ID
    const timestamp = Date.now().toString().slice(-8);
    const userIdShort = user._id.toString().slice(-8);
    const receiptId = `pro_${userIdShort}_${timestamp}`;
    
    console.log(`${logPrefix} Receipt ID: ${receiptId}`);

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

    console.log(`${logPrefix} Creating Razorpay order...`);
    
    // IMPORTANT: await the order creation
    const order = await razorpay.orders.create(orderOptions);
    
    console.log(`${logPrefix} Razorpay order created successfully:`, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

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
        receipt: order.receipt,
        notes: order.notes
      }
    };

    const insertResult = await db.collection('payments').insertOne(paymentRecord);
    console.log(`${logPrefix} Payment record saved:`, insertResult.insertedId);

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

    console.log(`${logPrefix} Sending response to frontend`);

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error(`${logPrefix} ERROR:`, error.message);
    console.error(`${logPrefix} Stack:`, error.stack);
    
    // Handle specific Razorpay errors
    if (error.error && error.error.code) {
      const razorpayError = error.error;
      console.error(`${logPrefix} Razorpay error:`, razorpayError);
      
      return NextResponse.json({
        error: `Payment system error: ${razorpayError.description || razorpayError.code}`,
        code: razorpayError.code
      }, { status: 400 });
    }
    
    // Handle database errors
    if (error.name === 'MongoError') {
      return NextResponse.json({
        error: 'Database error occurred. Please try again.'
      }, { status: 500 });
    }

    // Handle authentication errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
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