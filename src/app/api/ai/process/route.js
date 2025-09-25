// src/app/api/ai/process/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    verifyToken(token); // Validate token

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const action = searchParams.get('action'); // 'write', 'enhance', or 'summarize'
    const subject = searchParams.get('subject') || '';
    const body = searchParams.get('body') || '';
    const recipient = searchParams.get('recipient') || '';
    const prompt = searchParams.get('prompt') || ''; // New parameter for auto-writing

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    if (action === 'summarize') {
      if (!emailId) {
        return NextResponse.json({ error: 'emailId is required for summarization' }, { status: 400 });
      }
      const email = await db.collection('inbox').findOne({ _id: new ObjectId(emailId) });
      if (!email) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
      const summary = await generateSummary(email.bodyPlain || email.bodyHtml || email.subject);
      await db.collection('inbox').updateOne(
        { _id: new ObjectId(emailId) },
        { $set: { summary } }
      );
      return NextResponse.json({ summary });
    } else if (action === 'write') {
      // Auto-write a mail based on prompt or minimal input
      const writtenContent = await writeMail(subject, body, recipient, prompt);
      return NextResponse.json({ writtenContent });
    } else if (action === 'enhance') {
      // Enhance existing mail content
      const enhancedContent = await enhanceContent(subject, body, recipient);
      return NextResponse.json({ enhancedContent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('AI processing error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'AI processing failed', details: error.message }, { status: 500 });
  }
}

async function generateSummary(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Summarize the following email content in 1-2 concise sentences, retaining all key points: ${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'Unable to generate summary at this time.';
  }
}

async function writeMail(subject, body, recipient, prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const recipientName = recipient.split('<')[0].trim() || 'Recipient';
    const fullPrompt = prompt || `Write a professional email with the subject '${subject}' and body '${body}'. If no body is provided, create a generic professional email. Address the recipient as ${recipientName} and include a proper salutation and closing.`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Mail writing error:', error);
    return `Subject: ${subject || 'No Subject'}\n\nDear ${recipientName},\n${body || 'Please find the details in the attachment.'}\n\nBest regards,\nYour Name`;
  }
}

async function enhanceContent(subject, body, recipient) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const recipientName = recipient.split('<')[0].trim() || 'Recipient';
    const prompt = `Enhance the following email content by fixing grammar, improving clarity, and formatting it professionally. Include a proper salutation (e.g., 'Dear [Recipient Name],') and closing (e.g., 'Best regards, [Your Name]'). Use the provided subject and body:\n\nSubject: ${subject}\nBody: ${body}\n\nOutput the enhanced version as a single formatted text block.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Content enhancement error:', error);
    return `Subject: ${subject}\n\nDear ${recipientName},\n${body}\n\nBest regards,\nYour Name`;
  }
}

// --------------------- POST Handler (new) ---------------------
export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use Gemini model to generate a reply
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(message);

    return NextResponse.json({ reply: result.response.text() });
  } catch (error) {
    console.error('POST AI processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}