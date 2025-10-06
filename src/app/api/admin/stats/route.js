// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify admin access
    await verifyAdminToken(token, db);

    // Get system-wide statistics
    const [
      totalUsers,
      proUsers,
      freeUsers,
      totalAliases,
      collaborativeAliases,
      totalEmails,
      spamEmails,
      totalRevenue
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('users').countDocuments({ plan: 'pro' }),
      db.collection('users').countDocuments({ plan: 'free' }),
      db.collection('aliases').countDocuments(),
      db.collection('aliases').countDocuments({ isCollaborative: true }),
      db.collection('inbox').countDocuments(),
      db.collection('inbox').countDocuments({ isSpam: true }),
      db.collection('payments')
        .aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        .toArray()
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await db.collection('users').countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get email volume trends (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const emailTrends = await db.collection('inbox').aggregate([
      {
        $match: {
          receivedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Get top active users by email volume
    const topUsers = await db.collection('aliases').aggregate([
      {
        $group: {
          _id: '$ownerId',
          emailsSent: { $sum: '$emailsSent' },
          emailsReceived: { $sum: '$emailsReceived' },
          aliasCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1, plan: 1 } }]
        }
      },
      { $unwind: '$user' },
      { $sort: { emailsReceived: -1 } },
      { $limit: 10 }
    ]).toArray();

    return NextResponse.json({
      overview: {
        totalUsers,
        proUsers,
        freeUsers,
        totalAliases,
        collaborativeAliases,
        totalEmails,
        spamEmails,
        totalRevenue: (totalRevenue[0]?.total || 0) / 100,
        recentRegistrations,
        conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(2) : 0
      },
      emailTrends,
      topUsers
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}