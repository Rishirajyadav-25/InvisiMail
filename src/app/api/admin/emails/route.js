// src/app/api/admin/emails/route.js
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

// DELETE endpoint for admins to delete emails
export async function DELETE(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    await verifyAdminToken(token, db);

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(emailId)) {
      return NextResponse.json({ error: 'Invalid email ID' }, { status: 400 });
    }

    // Delete the email
    const result = await db.collection('inbox').deleteOne({
      _id: new ObjectId(emailId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email deleted successfully' 
    });

  } catch (error) {
    console.error('Admin email deletion error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH endpoint for bulk operations (optional - for future use)
export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    await verifyAdminToken(token, db);

    const body = await request.json();
    const { action, emailIds } = body;

    if (!action || !emailIds || !Array.isArray(emailIds)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate all ObjectIds
    const validIds = emailIds.filter(id => ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid email IDs provided' }, { status: 400 });
    }

    const objectIds = validIds.map(id => new ObjectId(id));

    let result;
    switch (action) {
      case 'delete':
        result = await db.collection('inbox').deleteMany({
          _id: { $in: objectIds }
        });
        return NextResponse.json({ 
          success: true, 
          deletedCount: result.deletedCount,
          message: `${result.deletedCount} email(s) deleted successfully` 
        });

      case 'markAsSpam':
        result = await db.collection('inbox').updateMany(
          { _id: { $in: objectIds } },
          { $set: { isSpam: true, spamReason: 'Marked as spam by admin' } }
        );
        return NextResponse.json({ 
          success: true, 
          modifiedCount: result.modifiedCount,
          message: `${result.modifiedCount} email(s) marked as spam` 
        });

      case 'markAsNotSpam':
        result = await db.collection('inbox').updateMany(
          { _id: { $in: objectIds } },
          { $set: { isSpam: false, spamReason: null } }
        );
        return NextResponse.json({ 
          success: true, 
          modifiedCount: result.modifiedCount,
          message: `${result.modifiedCount} email(s) marked as not spam` 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin bulk operation error:', error);
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}