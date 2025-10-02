// src/app/api/activities/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { verifyToken } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const client = await clientPromise;
    const db = client.db();

    // Get user's aliases to find activities
    const userAliases = await db.collection('aliases').find({
      $or: [
        { ownerId: new ObjectId(decoded.userId) },
        { 'collaborators.userId': new ObjectId(decoded.userId) }
      ]
    }).project({ _id: 1 }).toArray();

    const aliasIds = userAliases.map(a => a._id);

    // Fetch activities from multiple sources
    const activities = [];

    // 1. Get sent emails (from inbox)
    const sentEmails = await db.collection('inbox').find({
      isSentEmail: true,
      aliasId: { $in: aliasIds }
    })
    .sort({ receivedAt: -1 })
    .limit(limit)
    .toArray();

    sentEmails.forEach(email => {
      activities.push({
        _id: email._id,
        type: 'sent',
        userId: email.userId || email.sentBy,
        aliasId: email.aliasId,
        data: {
          to: email.to,
          subject: email.subject,
          textPreview: email.bodyPlain?.substring(0, 100)
        },
        createdAt: email.receivedAt
      });
    });

    // 2. Get shared activities (collaborative aliases)
    const sharedActivities = await db.collection('shared_activities').find({
      aliasId: { $in: aliasIds }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

    activities.push(...sharedActivities);

    // 3. Get user's own activities
    const userActivities = await db.collection('activities').find({
      userId: new ObjectId(decoded.userId)
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

    activities.push(...userActivities);

    // Sort all activities by date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return NextResponse.json(sortedActivities, { status: 200 });

  } catch (error) {
    console.error('Activities API error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}