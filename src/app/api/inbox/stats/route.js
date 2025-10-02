// src/app/api/inbox/stats/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const client = await clientPromise;
    const db = client.db();

    // Get user's accessible aliases
    const accessibleAliases = await db.collection('aliases').find({
      $or: [
        { ownerId: new ObjectId(decoded.userId) },
        { 'collaborators.userId': new ObjectId(decoded.userId) }
      ]
    }).project({ aliasEmail: 1 }).toArray();

    const userAliasEmails = accessibleAliases.map(a => a.aliasEmail);

    if (userAliasEmails.length === 0) {
      return NextResponse.json({
        unreadCount: 0,
        totalEmails: 0,
        spamCount: 0,
        sentCount: 0,
        receivedCount: 0
      });
    }

    // Build query for user's emails
    const baseQuery = {
      $or: [
        { aliasEmail: { $in: userAliasEmails } },
        { userId: new ObjectId(decoded.userId) }, // Legacy
        { userId: decoded.userId } // Legacy string
      ]
    };

    // Get counts
    const [unreadCount, totalEmails, spamCount, sentCount, receivedCount] = await Promise.all([
      // Unread count (excluding spam)
      db.collection('inbox').countDocuments({
        ...baseQuery,
        isRead: false,
        isSpam: { $ne: true }
      }),
      
      // Total emails (excluding spam)
      db.collection('inbox').countDocuments({
        ...baseQuery,
        isSpam: { $ne: true }
      }),
      
      // Spam count
      db.collection('inbox').countDocuments({
        ...baseQuery,
        isSpam: true
      }),
      
      // Sent emails count
      db.collection('inbox').countDocuments({
        ...baseQuery,
        isSentEmail: true
      }),
      
      // Received emails count (not sent, not spam)
      db.collection('inbox').countDocuments({
        ...baseQuery,
        isSentEmail: { $ne: true },
        isSpam: { $ne: true }
      })
    ]);

    return NextResponse.json({
      unreadCount,
      totalEmails,
      spamCount,
      sentCount,
      receivedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Inbox stats error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch inbox stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}