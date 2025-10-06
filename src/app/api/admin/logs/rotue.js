// src/app/api/admin/logs/route.js
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

    const skip = (page - 1) * limit;

    const logs = await db.collection('admin_logs')
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalCount = await db.collection('admin_logs').countDocuments();

    return NextResponse.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Admin logs error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}