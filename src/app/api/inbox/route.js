import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';
import { verifyToken } from '../../../lib/auth.js';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = new ObjectId(decoded.userId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const aliasFilter = searchParams.get('alias');
    const unreadOnly = searchParams.get('unread') === 'true';
    const mailType = searchParams.get('type') || 'all';

    const client = await clientPromise;
    const db = client.db();

    const accessibleAliases = await db.collection('aliases').find({
      $or: [
        { ownerId: userId },
        { 'collaborators.userId': userId }
      ]
    }).project({ aliasEmail: 1 }).toArray();

    const userAliasEmails = accessibleAliases.map(a => a.aliasEmail);

    if (aliasFilter && !userAliasEmails.includes(aliasFilter)) {
      return NextResponse.json({ error: 'Unauthorized access to alias' }, { status: 403 });
    }

    // --- START: CORRECTED QUERY LOGIC ---
    // All conditions will be added to this '$and' array to ensure they all apply.
    const queryConditions = [];

    // 1. Alias/User Access Condition: An email must belong to the user's accessible aliases OR their old userId.
    const accessCondition = {
        $or: [
            { aliasEmail: { $in: userAliasEmails } },
            { userId: userId } // For backward compatibility
        ]
    };
    if(aliasFilter){
        // If a specific alias is filtered, make it the primary condition
        accessCondition.$or[0] = { aliasEmail: aliasFilter };
    }
    queryConditions.push(accessCondition);

    // 2. Mail Type Condition: Apply the filter for sent, received, or spam.
    switch (mailType) {
      case 'sent':
        queryConditions.push({ isSentEmail: true });
        break;
      case 'received':
        queryConditions.push({ isSentEmail: { $ne: true } });
        queryConditions.push({ isSpam: { $ne: true } });
        break;
      case 'spam':
        queryConditions.push({ isSpam: true });
        break;
      case 'all':
      default:
        // 'all' means all non-spam emails (both sent and received)
        queryConditions.push({ isSpam: { $ne: true } });
        break;
    }

    // 3. Unread Condition (Optional): If requested, add the unread filter.
    if (unreadOnly) {
      queryConditions.push({ isRead: false });
    }

    // Combine all conditions into a single final query object
    const finalQuery = { $and: queryConditions };
    // --- END: CORRECTED QUERY LOGIC ---

    const emails = await db.collection('inbox').aggregate([
      { $match: finalQuery },
      { $sort: { receivedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'sentBy',
          foreignField: '_id',
          as: 'senderInfo',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $addFields: {
          senderName: { $first: '$senderInfo.name' }
        }
      },
      { $project: { senderInfo: 0 } }
    ]).toArray();

    const totalCount = await db.collection('inbox').countDocuments(finalQuery);

    // Get counts for the sidebar
    const createCountQuery = (filter) => {
        const base = { $or: [{ aliasEmail: { $in: userAliasEmails } }, { userId: userId }] };
        return { $and: [base, filter]};
    };

    const receivedCount = await db.collection('inbox').countDocuments(createCountQuery({ isSentEmail: { $ne: true }, isSpam: { $ne: true } }));
    const sentCount = await db.collection('inbox').countDocuments(createCountQuery({ isSentEmail: true }));
    const spamCount = await db.collection('inbox').countDocuments(createCountQuery({ isSpam: true }));
    const unreadCount = await db.collection('inbox').countDocuments(createCountQuery({ isRead: false, isSpam: { $ne: true } }));


    return NextResponse.json({
      emails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      counts: {
        all: receivedCount + sentCount,
        sent: sentCount,
        received: receivedCount,
        spam: spamCount,
        unread: unreadCount
      },
    });

  } catch (error) {
    console.error('Inbox API error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}