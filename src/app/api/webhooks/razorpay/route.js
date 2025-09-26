// src/app/api/webhooks/razorpay/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb.js';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  console.log("📨 Razorpay Webhook Received");

  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('🔴 RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('🔴 Invalid webhook signature');
      console.log('Received Signature:', signature);
      console.log('Expected Signature:', expectedSignature);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    console.log("✅ Webhook signature verified");
    
    const payload = JSON.parse(bodyText);
    const { event } = payload;
    console.log(`📨 Processing event: ${event}`);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const userId = paymentEntity.notes?.userId;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount;

      console.log('💳 Payment Details:', { 
        orderId, 
        userId, 
        paymentId, 
        amount,
        notes: paymentEntity.notes 
      });

      if (!userId || !orderId) {
        console.error('🔴 Missing critical data in webhook payload', { 
          userId, 
          orderId, 
          notes: paymentEntity.notes 
        });
        return NextResponse.json({ error: 'Invalid payload data' }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db();

      // ENHANCED: Use transaction for atomic updates
      const session = client.startSession();

      try {
        await session.withTransaction(async () => {
          // 1. Update user plan to 'pro' with subscription details
          const userUpdateResult = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
              $set: { 
                plan: 'pro', 
                upgradedAt: new Date(), 
                subscriptionId: orderId,
                lastPaymentId: paymentId,
                lastPaymentAmount: amount,
                subscriptionStatus: 'active',
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
              } 
            },
            { session }
          );

          console.log(`👤 User update result:`, {
            matchedCount: userUpdateResult.matchedCount,
            modifiedCount: userUpdateResult.modifiedCount,
            userId
          });

          // 2. Update payment record
          const paymentUpdateResult = await db.collection('payments').updateOne(
            { orderId: orderId },
            { 
              $set: { 
                status: 'paid', 
                updatedAt: new Date(), 
                razorpayPaymentId: paymentId,
                webhookProcessedAt: new Date(),
                paymentMethod: paymentEntity.method,
                paidAt: new Date(paymentEntity.created_at * 1000)
              } 
            },
            { session }
          );

          console.log(`💰 Payment update result:`, {
            matchedCount: paymentUpdateResult.matchedCount,
            modifiedCount: paymentUpdateResult.modifiedCount,
            orderId
          });

          // 3. Create upgrade activity log
          await db.collection('activities').insertOne({
            userId: new ObjectId(userId),
            type: 'upgrade',
            action: 'upgraded_to_pro',
            details: {
              orderId,
              paymentId,
              amount: amount / 100, // Convert paise to rupees
              method: paymentEntity.method,
              upgradedAt: new Date()
            },
            createdAt: new Date()
          }, { session });

          console.log(`📝 Activity log created for user ${userId}`);

          // 4. Verify the user was actually updated
          const verifyUser = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { plan: 1, upgradedAt: 1, subscriptionId: 1 }, session }
          );

          console.log(`🔍 User verification after update:`, verifyUser);

          if (verifyUser?.plan !== 'pro') {
            throw new Error(`User plan update failed - current plan: ${verifyUser?.plan}`);
          }
        });

        console.log(`🎉 Successfully processed payment for userId: ${userId}`);

        // Send success email notification (optional)
        try {
          const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { email: 1, name: 1 } }
          );

          if (user?.email) {
            // You can add email notification here if needed
            console.log(`📧 Pro upgrade confirmed for ${user.email}`);
          }
        } catch (emailError) {
          console.log('Email notification failed, but payment processed successfully');
        }

      } catch (transactionError) {
        console.error('🔴 Transaction failed:', transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }

    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      console.log(`❌ Payment failed for order: ${orderId}`);
      
      // Update payment record to failed
      const client = await clientPromise;
      const db = client.db();
      
      await db.collection('payments').updateOne(
        { orderId: orderId },
        { 
          $set: { 
            status: 'failed', 
            updatedAt: new Date(),
            failureReason: paymentEntity.error_description || 'Payment failed',
            webhookProcessedAt: new Date()
          } 
        }
      );

    } else {
      console.log(`ℹ️ Ignoring event: ${event}`);
    }

    return NextResponse.json({ success: true, event, processed: true });

  } catch (error) {
    console.error('🔴 Webhook processing error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Still return 200 to prevent Razorpay retries for parsing errors
    if (error.message.includes('JSON') || error.message.includes('signature')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}