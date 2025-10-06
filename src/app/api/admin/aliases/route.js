// src/app/api/admin/aliases/route.js
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchQuery = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    let query = {};
    
    if (searchQuery) {
      query.aliasEmail = { $regex: searchQuery, $options: 'i' };
    }

    const aliases = await db.collection('aliases').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
          pipeline: [{ $project: { name: 1, email: 1, plan: 1 } }]
        }
      },
      { $unwind: '$owner' },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    const totalCount = await db.collection('aliases').countDocuments(query);

    return NextResponse.json({
      aliases,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Admin aliases error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}