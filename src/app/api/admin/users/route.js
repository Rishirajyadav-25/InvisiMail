// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    await verifyAdminToken(token, db);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchQuery = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || 'all';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (searchQuery) {
      query.$or = [
        { email: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (planFilter !== 'all') {
      query.plan = planFilter;
    }

    // Fetch users with aggregation for additional data
    const users = await db.collection('users').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'aliases',
          localField: '_id',
          foreignField: 'ownerId',
          as: 'aliases'
        }
      },
      {
        $addFields: {
          aliasCount: { $size: '$aliases' },
          totalEmailsSent: { $sum: '$aliases.emailsSent' },
          totalEmailsReceived: { $sum: '$aliases.emailsReceived' }
        }
      },
      {
        $project: {
          password: 0,
          aliases: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    const totalCount = await db.collection('users').countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user (suspend, change plan, etc.)
export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const { user: adminUser } = await verifyAdminToken(token, db);
    const { userId, action, data } = await request.json();

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Valid user ID required' }, { status: 400 });
    }

    let updateData = {};
    let logAction = '';

    switch (action) {
      case 'suspend':
        updateData = { isSuspended: true, suspendedAt: new Date() };
        logAction = 'suspended_user';
        break;
      
      case 'unsuspend':
        updateData = { isSuspended: false, unsuspendedAt: new Date() };
        logAction = 'unsuspended_user';
        break;
      
      case 'changePlan':
        if (!data?.plan || !['free', 'pro'].includes(data.plan)) {
          return NextResponse.json({ error: 'Valid plan required' }, { status: 400 });
        }
        updateData = { 
          plan: data.plan,
          ...(data.plan === 'pro' ? {
            upgradedAt: new Date(),
            subscriptionStatus: 'active'
          } : {})
        };
        logAction = 'changed_plan';
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log admin action
    await db.collection('admin_logs').insertOne({
      adminId: new ObjectId(adminUser._id),
      adminEmail: adminUser.email,
      action: logAction,
      targetUserId: new ObjectId(userId),
      data: updateData,
      createdAt: new Date()
    });

    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}