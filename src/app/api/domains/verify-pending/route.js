// src/app/api/domains/verify-pending/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import dns from 'dns/promises';
import { mg } from '../../../../lib/mailgun';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  // Secure this endpoint with a secret key
  const secret = request.headers.get('x-verification-secret');
  if (secret !== process.env.DOMAIN_VERIFICATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Find all pending domains
  const pendingDomains = await db.collection('custom_domains').find({
    isVerified: false
  }).toArray();

  if (pendingDomains.length === 0) {
    return NextResponse.json({ message: 'No pending domains to verify.' });
  }

  const verificationResults = [];

  for (const domain of pendingDomains) {
    try {
      const txtRecords = await dns.resolveTxt(`_mailalias-verification.${domain.domain}`);
      const isVerified = txtRecords.flat().includes(domain.verificationToken);

      if (isVerified) {
        // Add domain to Mailgun
        await mg.domains.create({
            name: domain.domain,
            smtp_password: `mailgun-${Math.random().toString(36).substring(2, 15)}`,
            spam_action: 'disabled',
            wildcard: false,
            force_dkim_authority: false
        });

        // Update domain as verified
        await db.collection('custom_domains').updateOne(
          { _id: new ObjectId(domain._id) },
          {
            $set: {
              isVerified: true,
              status: 'verified',
              verifiedAt: new Date(),
              mailgunStatus: 'added'
            }
          }
        );
        verificationResults.push({ domain: domain.domain, status: 'verified' });
      } else {
        verificationResults.push({ domain: domain.domain, status: 'pending' });
      }
    } catch (error) {
      // DNS record not found or other error
      verificationResults.push({ domain: domain.domain, status: 'failed', error: error.message });
    }
  }

  return NextResponse.json({ results: verificationResults });
}