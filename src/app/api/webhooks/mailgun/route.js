// src/app/api/webhooks/mailgun/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { mg } from '../../../../lib/mailgun';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let recipient, sender, subject, bodyPlain, bodyHtml, messageId, timestamp, token, signature;
    let attachments = [];
    
    if (contentType.includes('application/json')) {
      const jsonData = await request.json();
      console.log('Parsed JSON payload:', JSON.stringify(jsonData, null, 2).substring(0, 1000));
      
      recipient = jsonData.recipient || jsonData['event-data']?.recipient;
      sender = jsonData.sender || jsonData['event-data']?.envelope?.sender;
      subject = jsonData.subject || jsonData['event-data']?.message?.headers?.subject || '(No Subject)';
      bodyPlain = jsonData['body-plain'] || jsonData['event-data']?.message?.bodyPlain || '';
      bodyHtml = jsonData['body-html'] || jsonData['event-data']?.message?.bodyHtml || '';
      messageId = jsonData['Message-Id'] || jsonData['event-data']?.message?.headers?.['message-id'];
      timestamp = jsonData.timestamp || jsonData['event-data']?.timestamp;
      token = jsonData.token || jsonData.signature?.token;
      signature = jsonData.signature || jsonData.signature?.signature;
      
      const eventType = jsonData['event-data']?.event;
      if (eventType === 'accepted' || eventType === 'delivered') {
        console.log(`Ignoring outbound event: ${eventType}`);
        return NextResponse.json({ message: 'Outbound event ignored' }, { status: 200 });
      }
      
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const rawBody = await request.text();
      console.log('Raw payload:', rawBody.substring(0, 1000));
      
      const params = new URLSearchParams(rawBody);
      recipient = params.get('recipient');
      sender = params.get('sender');
      subject = params.get('subject') || '(No Subject)';
      bodyPlain = params.get('body-plain') || '';
      bodyHtml = params.get('body-html') || '';
      messageId = params.get('Message-Id');
      timestamp = params.get('timestamp');
      token = params.get('token');
      signature = params.get('signature');
      
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      console.log('Parsed FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value.toString().substring(0, 100)}...`);
      }
      
      recipient = formData.get('recipient')?.toString();
      sender = formData.get('sender')?.toString();
      subject = formData.get('subject')?.toString() || '(No Subject)';
      bodyPlain = formData.get('body-plain')?.toString() || '';
      bodyHtml = formData.get('body-html')?.toString() || '';
      messageId = formData.get('Message-Id')?.toString();
      timestamp = formData.get('timestamp')?.toString();
      token = formData.get('token')?.toString();
      signature = formData.get('signature')?.toString();
      
      // Handle attachments
      const attCount = parseInt(formData.get('attachment-count') || '0');
      for (let i = 1; i <= attCount; i++) {
        const file = formData.get(`attachment-${i}`);
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          attachments.push({
            filename: file.name,
            contentType: file.type,
            data: buffer
          });
        }
      }
      
    } else {
      console.warn('Unsupported Content-Type - ignoring');
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    console.log('Extracted fields:', { from: sender, to: recipient, subject });

    // Check for invalid recipient (e.g., webhook URL)
    if (!recipient || recipient.includes('ngrok') || recipient.includes('/api/webhooks')) {
      console.log('Invalid recipient - ignoring:', recipient);
      return new NextResponse(null, { status: 204 });
    }

    if (!sender) {
      console.log('Missing sender - ignoring');
      return new NextResponse(null, { status: 204 });
    }

    // Verify timestamp
    if (timestamp) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timestampAge = currentTimestamp - parseInt(timestamp);
      if (timestampAge > 600) { // 10 minutes
        console.warn('Webhook timestamp too old:', { timestamp, currentTimestamp, timestampAge });
        return NextResponse.json({ error: 'Timestamp too old' }, { status: 400 });
      }
    }

    // Verify Mailgun signature
    const apiKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (apiKey && timestamp && token && signature) {
      const signatureData = timestamp + token;
      const computedSignature = crypto
        .createHmac('sha256', apiKey)
        .update(signatureData)
        .digest('hex');
      
      console.log('Signature verification:', {
        timestamp,
        token,
        signatureData,
        computedSignature,
        providedSignature: signature
      });
      
      if (computedSignature !== signature) {
        console.warn('Invalid signature - rejecting', {
          computedSignature,
          providedSignature: signature,
          timestamp,
          token,
          apiKeyUsed: apiKey.substring(0, 4) + '...' // Log partial key for debugging
        });
        return NextResponse.json({ error: 'Invalid signature', details: 'Check MAILGUN_WEBHOOK_SIGNING_KEY in .env and Mailgun dashboard' }, { status: 403 });
      }
      
      console.log('Signature verification passed');
    } else {
      console.warn('Missing signature components or webhook key - proceeding for testing');
      console.log('Signature components:', { apiKey: !!apiKey, timestamp, token, signature });
    }

    const client = await clientPromise;
    const db = client.db();

    // Extract local part of recipient
    const localPart = recipient.split('@')[0].toLowerCase();

    // Check if this is a reverse alias reply
    const reverseAlias = await db.collection('reverse_aliases').findOne({
      reverseId: localPart,
      isActive: true
    });

    if (reverseAlias) {
      console.log('Handling reverse alias reply from user');
      
      const alias = await db.collection('aliases').findOne({ _id: reverseAlias.aliasId });
      if (!alias) {
        console.log('Alias not found for reverse - ignoring');
        return new NextResponse(null, { status: 204 });
      }

      const originalRecipient = reverseAlias.recipientEmail;

      // Send masked reply
      const sendData = {
        from: alias.aliasEmail,
        to: originalRecipient,
        subject: subject,
        text: bodyPlain,
        html: bodyHtml,
        attachment: attachments
      };

      const mailgunResponse = await mg.messages.create(process.env.MAILGUN_DOMAIN, sendData);
      console.log('Reply sent via Mailgun:', mailgunResponse);

      // Store as sent email
      await db.collection('inbox').insertOne({
        aliasId: alias._id,
        userId: reverseAlias.userId,
        aliasEmail: alias.aliasEmail,
        from: alias.aliasEmail,
        to: originalRecipient,
        subject,
        bodyPlain,
        bodyHtml,
        messageId,
        receivedAt: new Date(),
        isRead: true,
        isSent: true,
        sentBy: reverseAlias.userId,
        isSpam: false,
        spamAction: 'none',
        attachments: attachments.map(a => ({ filename: a.filename, contentType: a.contentType, size: a.data.length }))
      });

      // Update stats
      await db.collection('aliases').updateOne({ _id: alias._id }, { $inc: { emailsSent: 1 } });
      await db.collection('reverse_aliases').updateOne({ _id: reverseAlias._id }, { $inc: { emailsReceived: 1 }, $set: { lastUsed: new Date() } });

      // Log activity if collaborative
      if (alias.isCollaborative) {
        await db.collection('shared_activities').insertOne({
          aliasId: alias._id,
          type: 'sent_reply',
          userId: reverseAlias.userId,
          data: { to: originalRecipient, subject, textPreview: bodyPlain.substring(0, 100) },
          createdAt: new Date()
        });
      }

      console.log('Reverse alias reply processed successfully');
      return NextResponse.json({ message: 'Reply processed' }, { status: 200 });
    }

    // Normal inbound handling (not reverse)
    // Fetch alias with owner and collaborators
    const aliasAgg = await db.collection('aliases').aggregate([
      {
        $match: { aliasEmail: recipient.toLowerCase() }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'collaborators.userId',
          foreignField: '_id',
          as: 'collaboratorDetails',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $addFields: {
          collaborators: {
            $map: {
              input: { $ifNull: ['$collaborators', []] },
              as: 'collab',
              in: {
                userId: '$$collab.userId',
                role: '$$collab.role',
                userDetails: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$collaboratorDetails',
                        cond: { $eq: ['$$this._id', '$$collab.userId'] }
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      }
    ]).toArray();

    if (aliasAgg.length === 0) {
      console.log('Alias not found - ignoring');
      return new NextResponse(null, { status: 204 });
    }

    const aliasData = aliasAgg[0];

    // Get spam settings (per alias)
    const spamSettings = aliasData.spamSettings || {
      enabled: true,
      sensitivity: 'medium',
      action: 'quarantine',
      notifications: true
    };

    // Classify spam
    const spamResult = await classifySpam(bodyPlain, subject, sender);
    console.log(`Email classified as: ${spamResult.isSpam ? 'SPAM' : 'CLEAN'} (Score: ${spamResult.score}, Reason: ${spamResult.reason})`);

    const spamAction = spamResult.isSpam ? spamSettings.action : 'none';

    // Insert into inbox
    const result = await db.collection('inbox').insertOne({
      userId: aliasData.ownerId,
      aliasId: aliasData._id,
      aliasEmail: recipient.toLowerCase(),
      realEmail: aliasData.owner[0].email, // Owner's email as fallback
      from: sender,
      to: recipient,
      subject,
      bodyPlain,
      bodyHtml,
      messageId,
      receivedAt: new Date(),
      isRead: false,
      isSpam: spamResult.isSpam,
      spamConfidence: spamResult.confidence,
      spamAction,
      spamReason: spamResult.reason,
      attachments: attachments.map(a => ({ filename: a.filename, contentType: a.contentType, size: a.data.length }))
    });

    // Determine forwardToUsers
    let forwardToUsers = [];
    if (aliasData.isCollaborative) {
      forwardToUsers.push(aliasData.owner[0].email);
      aliasData.collaborators.forEach(collab => {
        if (collab.role === 'member' && collab.userDetails?.email) {
          forwardToUsers.push(collab.userDetails.email);
        }
      });
    } else {
      forwardToUsers.push(aliasData.realEmail || aliasData.owner[0].email);
    }
    console.log('Forward to users:', forwardToUsers);

    if (spamAction === 'forward' || spamAction === 'tag') {
      // Create/get reverse alias (for masking replies)
      const reverseId = await createReverseAlias(db, aliasData._id, sender, aliasData.ownerId.toString(), recipient);
      const reverseAddress = `${reverseId}@${process.env.MAILGUN_DOMAIN}`;

      for (const userEmail of forwardToUsers) {
        try {
          await mg.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `${sender} <${reverseAddress}>`,
            to: userEmail,
            subject: spamAction === 'tag' ? `[SPAM] ${subject}` : subject,
            text: `Original sender: ${sender}\n\n${bodyPlain}`,
            html: spamAction === 'tag' ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ Potential Spam Detected</h3>
                <p style="margin: 0; color: #7f1d1d;">Reason: ${spamResult.reason}</p>
              </div>
              ${bodyHtml}
            ` : bodyHtml,
            'h:Reply-To': reverseAddress,
            'h:In-Reply-To': messageId,
            attachment: attachments
          });
        } catch (forwardError) {
          console.error(`Forward error to ${userEmail}:`, forwardError.message);
        }
      }

      await db.collection('inbox').updateOne(
        { _id: result.insertedId },
        { $set: { isForwarded: true, forwardedAt: new Date(), forwardedToCount: forwardToUsers.length } }
      );

      console.log('Email forwarded successfully');
    } else if (spamAction === 'quarantine') {
      console.log(`Email quarantined as spam: ${spamResult.reason}`);
      
      // Notify owner if enabled
      const ownerEmail = aliasData.owner[0].email;
      if (spamSettings.notifications) {
        try {
          await mg.messages.create(process.env.MAILGUN_DOMAIN, {
            from: `Spam Filter <noreply@${process.env.MAILGUN_DOMAIN}>`,
            to: ownerEmail,
            subject: `Spam Email Blocked for ${aliasData.aliasEmail}`,
            text: `A potential spam email was blocked for your alias ${aliasData.aliasEmail}.\n\nFrom: ${sender}\nSubject: ${subject}\nReason: ${spamResult.reason}\n\nYou can view quarantined emails in your dashboard spam folder.`,
            html: `
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #dc2626; margin: 0 0 8px 0;">🚫 Spam Email Blocked</h3>
                <p style="margin: 0; color: #7f1d1d;">A potential spam email was blocked for your alias <strong>${aliasData.aliasEmail}</strong>.</p>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 6px;">
                <p><strong>From:</strong> ${sender}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Reason:</strong> ${spamResult.reason}</p>
              </div>
              <p style="margin-top: 16px; color: #6b7280;">You can view and manage spam in your dashboard.</p>
            `
          });
        } catch (notificationError) {
          console.error('Notification error:', notificationError.message);
        }
      }
    }

    // Update alias stats
    await db.collection('aliases').updateOne(
      { _id: aliasData._id },
      { $inc: { emailsReceived: 1 } }
    );

    console.log('Webhook processing completed successfully');

    return NextResponse.json({ 
      message: spamAction === 'none' ? 'Email processed successfully' : `Email ${spamAction}ed as spam`,
      emailId: result.insertedId.toString(),
      spamDetected: spamResult.isSpam,
      spamAction: spamAction
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper to create/get reverse alias (reusable for send and webhook)
async function createReverseAlias(db, aliasId, recipientEmail, userId, originalAliasEmail) {
  try {
    let existingReverse = await db.collection('reverse_aliases').findOne({
      aliasId: new ObjectId(aliasId),
      recipientEmail: recipientEmail.toLowerCase()
    });

    if (existingReverse) {
      return existingReverse.reverseId;
    }

    const reverseId = generateReverseId();
    
    const reverseAlias = {
      reverseId,
      aliasId: new ObjectId(aliasId),
      userId: new ObjectId(userId),
      recipientEmail: recipientEmail.toLowerCase(),
      originalAliasEmail: originalAliasEmail.toLowerCase(),
      emailsSent: 0,
      emailsReceived: 0,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    await db.collection('reverse_aliases').insertOne(reverseAlias);
    return reverseId;

  } catch (error) {
    console.error('Error creating reverse alias:', error);
    throw error;
  }
}

// Generate unique reverse ID
function generateReverseId() {
  const randomPart = crypto.randomBytes(4).toString('hex');
  const timestampPart = Date.now().toString(36).slice(-6);
  return `ra_${randomPart}_${timestampPart}`;
}

// Improved spam classification
async function classifySpam(bodyPlain, subject, sender) {
  const fullText = `${subject || ''} ${bodyPlain || ''}`.toLowerCase();
  
  const spamIndicators = {
    highRisk: ['free money', 'win cash', 'urgent action', 'act now', 'limited time offer', 'click here now', 'congratulations you won', 'inheritance money', 'viagra', 'cialis', 'pharmacy', 'nigeria', 'prince', 'inheritance', 'lottery', 'casino', 'pills', 'enlarge', 'bitcoin investment'],
    mediumRisk: ['free','free free','spam', 'winner', 'prize', 'cash', 'money', 'urgent', 'click here', 'limited time', 'offer expires', 'guaranteed', 'investment opportunity', 'make money fast', 'work from home', 'credit card', 'verify account', 'update information', 'suspended account', 'password reset', 'security alert', 'bank transfer', 'wire money'],
    lowRisk: ['free','free free','deal', 'discount', 'save', 'buy now', 'order now', 'special offer', 'unsubscribe', 'marketing', 'newsletter', 'promotion']
  };
  
  let spamScore = 0;
  let reasons = [];
  
  spamIndicators.highRisk.forEach(keyword => {
    if (fullText.includes(keyword)) {
      spamScore += 3;
      reasons.push(`High-risk keyword: "${keyword}"`);
    }
  });
  
  spamIndicators.mediumRisk.forEach(keyword => {
    if (fullText.includes(keyword)) {
      spamScore += 2;
      reasons.push(`Medium-risk keyword: "${keyword}"`);
    }
  });
  
  spamIndicators.lowRisk.forEach(keyword => {
    if (fullText.includes(keyword)) {
      spamScore +=1;
      reasons.push(`Low-risk keyword: "${keyword}"`);
    }
  });
  
  // Additional heuristics
  if (subject && subject.toUpperCase() === subject && subject.length > 10) {
    spamScore += 1;
    reasons.push('All-caps subject line');
  }
  
  if ((bodyPlain || '').split('!').length > 5) {
    spamScore += 1;
    reasons.push('Excessive exclamation marks');
  }
  
  if (sender && (sender.includes('noreply') || sender.includes('no-reply'))) {
    spamScore += 1;
    reasons.push('No-reply sender');
  }

  // URL count
  const urlCount = (fullText.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 3) {
    spamScore += 2;
    reasons.push(`Excessive URLs (${urlCount})`);
  } else if (urlCount > 1) {
    spamScore += 1;
    reasons.push(`Multiple URLs (${urlCount})`);
  }

  // Caps ratio
  const capsRatio = fullText.split('').filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length / (fullText.length || 1);
  if (capsRatio > 0.3) {
    spamScore += 1.5;
    reasons.push('Excessive capital letters');
  }

  // Money symbols
  if (fullText.includes('$') || fullText.includes('€') || fullText.includes('£')) {
    spamScore += 0.5;
    reasons.push('Money symbols');
  }
  
  const isSpam = spamScore >= 2;
  const confidence = Math.min(spamScore / 10, 1);
  
  return {
    isSpam,
    confidence,
    reason: isSpam ? reasons.join(', ') : 'No spam indicators detected',
    score: spamScore
  };
}