// src/app/api/ai/process/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 🔹 System restriction for chatbot
const systemPrompt = `
You are InvisiMail Assistant.
Only answer questions related to the InvisiMail project, including:
- email aliases
- inbox
- domains
- dashboard
- payments
- authentication
- project setup

If a question is unrelated, reply strictly with:
"I can only help with the InvisiMail project."
`;

// ==================================================
// GET Handler → Summarize, Write, Enhance Emails
// ==================================================
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    const action = searchParams.get('action'); // 'write', 'enhance', 'summarize'
    const subject = searchParams.get('subject') || '';
    const body = searchParams.get('body') || '';
    const recipient = searchParams.get('recipient') || '';
    const userPrompt = searchParams.get('prompt') || '';

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
    }

    if (action === 'write') {
      const writtenContent = await writeMail(subject, body, recipient, userPrompt);
      return NextResponse.json({ writtenContent });
    }

    if (action === 'enhance') {
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

// ==================================================
// POST Handler → Chatbot (Restricted to InvisiMail)
// ==================================================
export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2024,
      }
    });

    const finalPrompt = `${systemPrompt}\nUser: ${message}`;

    const result = await model.generateContent(finalPrompt);
    return NextResponse.json({ reply: result.response.text() });

  } catch (error) {
    console.error('POST AI processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==================================================
// Helper Functions
// ==================================================
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
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';

    let aiPrompt = '';

    if (prompt && prompt.trim()) {
      aiPrompt = `Write a professional email based on this request: "${prompt.trim()}".
      Requirements:
      - Subject
      - Body (complete, professional)
      - Proper greeting, closing
      - Address recipient: ${recipientName}`;
    } else if (subject && body) {
      aiPrompt = `Enhance this email:
      Subject: ${subject}
      Body: ${body}
      Recipient: ${recipientName}`;
    } else if (subject) {
      aiPrompt = `Write a professional email with subject "${subject}" addressed to ${recipientName}.`;
    } else {
      aiPrompt = `Write a generic professional email template addressed to ${recipientName}.`;
    }

    const result = await model.generateContent(aiPrompt);
    return result.response.text().trim();

  } catch (error) {
    console.error('Mail writing error:', error);
    const fallbackSubject = subject || 'Professional Inquiry';
    const fallbackBody = body || 'I hope this email finds you well.';
    return `Subject: ${fallbackSubject}\n\nDear ${recipient},\n\n${fallbackBody}\n\nBest regards,\n[Your Name]`;
  }
}

async function enhanceContent(subject, body, recipient) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';

    const enhancePrompt = `Enhance this email:
    Subject: ${subject}
    Body: ${body}
    Recipient: ${recipientName}`;

    const result = await model.generateContent(enhancePrompt);
    return result.response.text().trim();

  } catch (error) {
    console.error('Content enhancement error:', error);
    return `Subject: ${subject || 'Professional Email'}\n\nDear ${recipient},\n\n${body || 'Thank you for your time.'}\n\nBest regards,\n[Your Name]`;
  }
}
