// src/app/api/upgrade/verify-payment/route.js - FALLBACK VERIFICATION
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  const logPrefix = '[Verify Payment]';
  
  try {
    console.log(`${logPrefix} Manual payment verification requested`);

    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log(`${logPrefix} User: ${decoded.userId}`);

    const client = await clientPromise;
    const db = client.db();

    // Get the most recent payment order for this user
    const recentPayment = await db.collection('payments').findOne(
      {
        userId: new ObjectId(decoded.userId),
        status: { $in: ['created', 'paid'] }
      },
      { sort: { createdAt: -1 } }
    );

    if (!recentPayment) {
      console.log(`${logPrefix} No payment found for user`);
      return NextResponse.json({
        success: false,
        message: 'No payment order found'
      }, { status: 404 });
    }

    console.log(`${logPrefix} Found payment:`, {
      orderId: recentPayment.orderId,
      status: recentPayment.status,
      amount: recentPayment.amount
    });

    // If already marked as paid in our DB, just update user
    if (recentPayment.status === 'paid') {
      console.log(`${logPrefix} Payment already marked as paid, updating user`);
      
      const userUpdateResult = await db.collection('users').updateOne(
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

      console.log(`${logPrefix} User update result:`, userUpdateResult);

      const updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      return NextResponse.json({
        success: true,
        message: 'Payment verified from database',
        user: updatedUser,
        source: 'database'
      });
    }

    // Check with Razorpay directly
    console.log(`${logPrefix} Checking payment status with Razorpay API`);
    
    try {
      const order = await razorpay.orders.fetch(recentPayment.orderId);
      console.log(`${logPrefix} Razorpay order status:`, {
        id: order.id,
        status: order.status,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due
      });

      // Check if order is paid
      if (order.status === 'paid' || order.amount_paid >= order.amount) {
        console.log(`${logPrefix} Order is paid according to Razorpay, updating database`);

        // Fetch payments for this order
        const payments = await razorpay.orders.fetchPayments(recentPayment.orderId);
        const capturedPayment = payments.items.find(p => p.status === 'captured');

        console.log(`${logPrefix} Found ${payments.items.length} payments, captured: ${!!capturedPayment}`);

        // Update user to Pro
        const userUpdateResult = await db.collection('users').updateOne(
          { _id: new ObjectId(decoded.userId) },
          {
            $set: {
              plan: 'pro',
              upgradedAt: new Date(),
              subscriptionId: recentPayment.orderId,
              lastPaymentId: capturedPayment?.id,
              subscriptionStatus: 'active',
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        );

        // Update payment record
        await db.collection('payments').updateOne(
          { orderId: recentPayment.orderId },
          {
            $set: {
              status: 'paid',
              updatedAt: new Date(),
              razorpayPaymentId: capturedPayment?.id,
              manuallyVerified: true,
              verifiedAt: new Date()
            }
          }
        );

        // Create activity log
        await db.collection('activities').insertOne({
          userId: new ObjectId(decoded.userId),
          type: 'upgrade',
          action: 'upgraded_to_pro',
          details: {
            orderId: recentPayment.orderId,
            paymentId: capturedPayment?.id,
            amount: order.amount / 100,
            manuallyVerified: true,
            upgradedAt: new Date()
          },
          createdAt: new Date()
        });

        console.log(`${logPrefix} User updated successfully:`, {
          matchedCount: userUpdateResult.matchedCount,
          modifiedCount: userUpdateResult.modifiedCount
        });

        const updatedUser = await db.collection('users').findOne(
          { _id: new ObjectId(decoded.userId) },
          { projection: { password: 0 } }
        );

        return NextResponse.json({
          success: true,
          message: 'Payment verified and user upgraded to Pro',
          user: updatedUser,
          source: 'razorpay_api'
        });
      } else {
        console.log(`${logPrefix} Order not yet paid:`, order.status);
        
        return NextResponse.json({
          success: false,
          message: `Payment not completed. Status: ${order.status}`,
          orderStatus: order.status
        }, { status: 400 });
      }

    } catch (razorpayError) {
      console.error(`${logPrefix} Razorpay API error:`, razorpayError);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to verify payment with Razorpay',
        error: razorpayError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json({
      error: 'Verification failed',
      details: error.message
    }, { status: 500 });
  }
}