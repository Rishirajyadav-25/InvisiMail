// src/app/api/admin/emails/route.js
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

    await verifyAdminToken(token, db);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const typeFilter = searchParams.get('type') || 'all';

    const skip = (page - 1) * limit;

    let query = {};
    
    if (typeFilter === 'spam') {
      query.isSpam = true;
    } else if (typeFilter === 'sent') {
      query.isSentEmail = true;
    } else if (typeFilter === 'received') {
      query.isSentEmail = { $ne: true };
      query.isSpam = { $ne: true };
    }

    // Get email metadata only (no body content for privacy)
    const emails = await db.collection('inbox').find(query)
      .project({
        from: 1,
        to: 1,
        subject: 1,
        receivedAt: 1,
        isSpam: 1,
        isSentEmail: 1,
        isRead: 1,
        aliasEmail: 1,
        spamReason: 1
      })
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await db.collection('inbox').countDocuments(query);

    return NextResponse.json({
      emails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Admin emails error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}