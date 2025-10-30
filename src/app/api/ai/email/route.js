// src/app/api/ai/email/route.js
import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    // 1. Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    verifyToken(token);

    // 2. Check API key
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not configured');
      return NextResponse.json({ 
        error: 'AI service not configured. Please contact support.' 
      }, { status: 503 });
    }

    // 3. Parse request
    const { action, subject, body, recipient, prompt } = await req.json();

    console.log('\n========== EMAIL AI REQUEST ==========');
    console.log('Action:', action);
    console.log('Subject:', subject);
    console.log('Body length:', body?.length || 0);
    console.log('Prompt:', prompt);
    console.log('=====================================\n');

    if (!action) {
      return NextResponse.json({ error: 'Action is required (write or enhance)' }, { status: 400 });
    }

    // 4. Build prompt
    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'write') {
      if (!prompt || !prompt.trim()) {
        return NextResponse.json({ 
          error: 'Please provide a description of what you want to write' 
        }, { status: 400 });
      }

      systemPrompt = `You are a professional email writing assistant. Generate ONLY the email content without any explanations or additional text.`;
      
      userPrompt = `Write a professional email based on this request: ${prompt}

CRITICAL RULES:
1. Start EXACTLY with "Subject: [subject line]" 
2. Add ONE blank line
3. Then write the email body
4. NO greetings (Dear/Hi) unless specifically requested
5. NO signatures or closing remarks
6. NO explanations before or after the email
7. Be concise and professional

Generate the email now:`;

    } else if (action === 'enhance') {
      if (!subject && !body) {
        return NextResponse.json({ 
          error: 'Please provide a subject or message to improve' 
        }, { status: 400 });
      }

      systemPrompt = `You are a professional email improvement assistant. Improve the email by fixing grammar, improving clarity, and making it more professional. Output ONLY the improved email.`;
      
      userPrompt = `Improve this email:

${subject ? `Subject: ${subject}` : ''}
${body || ''}

CRITICAL RULES:
1. Start with "Subject: [improved subject]"
2. Add ONE blank line
3. Then write the improved body
4. Keep the same meaning
5. Fix grammar and spelling
6. Make it professional
7. NO greetings/signatures unless in original
8. NO explanations

Provide the improved version:`;

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "write" or "enhance"' 
      }, { status: 400 });
    }

    console.log('🤖 Calling Groq AI...');

    // 5. Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and accurate
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Groq API Error:', errorData);
      throw new Error(errorData.error?.message || 'AI service error');
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';

    console.log('✅ AI Response received:', generatedText.substring(0, 100) + '...');

    // 6. Return response
    if (action === 'write') {
      return NextResponse.json({
        writtenContent: generatedText,
        success: true
      });
    } else {
      return NextResponse.json({
        enhancedContent: generatedText,
        success: true
      });
    }

  } catch (error) {
    console.error('❌ EMAIL AI ERROR:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'AI service rate limit reached. Please try again in a moment.' 
      }, { status: 429 });
    }

    return NextResponse.json({
      error: 'Failed to process AI request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    }, { status: 500 });
  }
}