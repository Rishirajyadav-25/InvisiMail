// // src/app/api/ai/process/route.js - ENHANCED VERSION
// import { NextResponse } from 'next/server';
// import clientPromise from '../../../../lib/mongodb';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { verifyToken } from '../../../../lib/auth';
// import { ObjectId } from 'mongodb';

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// export async function GET(request) {
//   try {
//     const token = request.cookies.get('token')?.value;
//     if (!token) {
//       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
//     }

//     verifyToken(token); // Validate token

//     const { searchParams } = new URL(request.url);
//     const emailId = searchParams.get('emailId');
//     const action = searchParams.get('action'); // 'write', 'enhance', or 'summarize'
//     const subject = searchParams.get('subject') || '';
//     const body = searchParams.get('body') || '';
//     const recipient = searchParams.get('recipient') || '';
//     const prompt = searchParams.get('prompt') || ''; // New parameter for auto-writing

//     if (!action) {
//       return NextResponse.json({ error: 'action is required' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db();

//     if (action === 'summarize') {
//       if (!emailId) {
//         return NextResponse.json({ error: 'emailId is required for summarization' }, { status: 400 });
//       }
//       const email = await db.collection('inbox').findOne({ _id: new ObjectId(emailId) });
//       if (!email) {
//         return NextResponse.json({ error: 'Email not found' }, { status: 404 });
//       }
//       const summary = await generateSummary(email.bodyPlain || email.bodyHtml || email.subject);
//       await db.collection('inbox').updateOne(
//         { _id: new ObjectId(emailId) },
//         { $set: { summary } }
//       );
//       return NextResponse.json({ summary });
//     } else if (action === 'write') {
//       // Auto-write a mail based on prompt or minimal input
//       const writtenContent = await writeMail(subject, body, recipient, prompt);
//       return NextResponse.json({ writtenContent });
//     } else if (action === 'enhance') {
//       // Enhance existing mail content
//       const enhancedContent = await enhanceContent(subject, body, recipient);
//       return NextResponse.json({ enhancedContent });
//     }

//     return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

//   } catch (error) {
//     console.error('AI processing error:', error);
//     if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
//       return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
//     }
//     return NextResponse.json({ error: 'AI processing failed', details: error.message }, { status: 500 });
//   }
// }

// async function generateSummary(text) {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//     const prompt = `Summarize the following email content in 1-2 concise sentences, retaining all key points: ${text}`;
//     const result = await model.generateContent(prompt);
//     return result.response.text();
//   } catch (error) {
//     console.error('Summary generation error:', error);
//     return 'Unable to generate summary at this time.';
//   }
// }

// async function writeMail(subject, body, recipient, prompt) {
//   try {
//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-1.5-flash',
//       generationConfig: {
//         temperature: 0.7,
//         topK: 40,
//         topP: 0.95,
//         maxOutputTokens: 1024,
//       }
//     });

//     const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
    
//     let aiPrompt = '';
    
//     if (prompt && prompt.trim()) {
//       // Custom prompt provided - write email based on prompt
//       aiPrompt = `Write a professional email based on this request: "${prompt.trim()}"

// Requirements:
// - Subject: Create an appropriate subject line
// - Body: Write a complete, professional email
// - Tone: Professional but friendly
// - Structure: Include proper greeting, main content, and closing
// - Recipient: Address to ${recipientName}
// - Format: Return as plain text with clear sections

// The response should be structured as:
// Subject: [Your subject line]

// Dear ${recipientName},

// [Email body content]

// Best regards,
// [Your Name]`;
//     } else if (subject && body) {
//       // Both subject and body provided - enhance what's given
//       aiPrompt = `Create a professional email using the provided subject and body content.

// Subject provided: "${subject}"
// Body provided: "${body}"
// Recipient: ${recipientName}

// Please create a complete, professional email that:
// - Uses the provided subject (improve if needed)
// - Expands and improves the provided body content
// - Adds proper greeting and closing
// - Maintains professional tone
// - Is clear and well-structured

// Format the response as:
// Subject: [Final subject line]

// Dear ${recipientName},

// [Enhanced email body]

// Best regards,
// [Your Name]`;
//     } else if (subject) {
//       // Only subject provided - generate body
//       aiPrompt = `Write a professional email with the subject "${subject}" addressed to ${recipientName}.

// Create a complete email that:
// - Uses the exact subject: "${subject}"
// - Writes appropriate body content based on the subject
// - Includes proper greeting and closing
// - Maintains professional tone
// - Is concise but informative

// Format the response as:
// Subject: ${subject}

// Dear ${recipientName},

// [Email body content based on subject]

// Best regards,
// [Your Name]`;
//     } else {
//       // Fallback - generic professional email
//       aiPrompt = `Write a professional email template addressed to ${recipientName}.

// Create a general professional email that:
// - Has an appropriate subject line
// - Includes proper greeting and closing
// - Has placeholder content that can be customized
// - Maintains professional tone

// Format the response as:
// Subject: [Professional subject line]

// Dear ${recipientName},

// [Professional email body]

// Best regards,
// [Your Name]`;
//     }

//     const result = await model.generateContent(aiPrompt);
//     const generatedText = result.response.text();
    
//     // Clean up the response
//     return generatedText.trim();

//   } catch (error) {
//     console.error('Mail writing error:', error);
//     // Better fallback with proper formatting
//     const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
//     const fallbackSubject = subject || 'Professional Inquiry';
//     const fallbackBody = body || 'I hope this email finds you well. I wanted to reach out regarding [specific matter]. Please let me know if you would like to discuss this further.';
    
//     return `Subject: ${fallbackSubject}

// Dear ${recipientName},

// ${fallbackBody}

// Best regards,
// [Your Name]`;
//   }
// }

// async function enhanceContent(subject, body, recipient) {
//   try {
//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-1.5-flash',
//       generationConfig: {
//         temperature: 0.5,
//         topK: 40,
//         topP: 0.95,
//         maxOutputTokens: 1024,
//       }
//     });

//     const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
    
//     const enhancePrompt = `Please enhance and improve the following email content:

// Original Subject: "${subject}"
// Original Body: "${body}"
// Recipient: ${recipientName}

// Please improve this email by:
// - Correcting any grammar or spelling mistakes
// - Improving clarity and readability
// - Making the tone more professional yet friendly
// - Adding proper greeting and closing if missing
// - Ensuring proper email structure
// - Keeping the original intent and meaning
// - Making it more polished and professional

// Format the response as:
// Subject: [Enhanced subject line]

// Dear ${recipientName},

// [Enhanced email body with improved grammar, clarity, and professionalism]

// Best regards,
// [Your Name]`;

//     const result = await model.generateContent(enhancePrompt);
//     const enhancedText = result.response.text();
    
//     return enhancedText.trim();
    
//   } catch (error) {
//     console.error('Content enhancement error:', error);
//     // Better formatted fallback
//     const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
//     return `Subject: ${subject || 'Professional Email'}

// Dear ${recipientName},

// ${body || 'Thank you for your time and consideration. Please let me know if you need any additional information.'}

// Best regards,
// [Your Name]`;
//   }
// }

// // POST Handler for chat-based AI assistance
// export async function POST(req) {
//   try {
//     const { message, context } = await req.json();

//     if (!message) {
//       return NextResponse.json({ error: 'Message is required' }, { status: 400 });
//     }

//     const model = genAI.getGenerativeModel({ 
//       model: 'gemini-1.5-flash',
//       generationConfig: {
//         temperature: 0.7,
//         topK: 40,
//         topP: 0.95,
//         maxOutputTokens: 2024,
//       }
//     });

//     let prompt = message;
//     if (context) {
//       prompt = `Context: You are an email assistant helping with professional email composition and management.

// User message: ${message}

// Please provide a helpful, professional response related to email management, composition, or general assistance.`;
//     }

//     const result = await model.generateContent(prompt);
//     return NextResponse.json({ reply: result.response.text() });

//   } catch (error) {
//     console.error('POST AI processing error:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }



// src/app/api/ai/process/route.js - ENHANCED VERSION
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
    return await getModelResponse(model, prompt); // Using retry logic
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
      aiPrompt = `Write a professional email based on this request: "${prompt.trim()}"\nRequirements:\n- Subject: Create an appropriate subject line\n- Body: Write a complete, professional email\n- Tone: Professional but friendly\n- Structure: Include proper greeting, main content, and closing\n- Recipient: Address to ${recipientName}\nFormat: Return as plain text with clear sections\nThe response should be structured as:\nSubject: [Your subject line]\n\nDear ${recipientName},\n\n[Email body content]\n\nBest regards,\n[Your Name]`;
    } else if (subject && body) {
      aiPrompt = `Create a professional email using the provided subject and body content.\nSubject provided: "${subject}"\nBody provided: "${body}"\nRecipient: ${recipientName}\nPlease create a complete, professional email that:\n- Uses the provided subject (improve if needed)\n- Expands and improves the provided body content\n- Adds proper greeting and closing\n- Maintains professional tone\n- Is clear and well-structured\nFormat the response as:\nSubject: [Final subject line]\n\nDear ${recipientName},\n\n[Enhanced email body]\n\nBest regards,\n[Your Name]`;
    } else if (subject) {
      aiPrompt = `Write a professional email with the subject "${subject}" addressed to ${recipientName}.\nCreate a complete email that:\n- Uses the exact subject: "${subject}"\n- Writes appropriate body content based on the subject\n- Includes proper greeting and closing\n- Maintains professional tone\n- Is concise but informative\nFormat the response as:\nSubject: ${subject}\n\nDear ${recipientName},\n\n[Email body content based on subject]\n\nBest regards,\n[Your Name]`;
    } else {
      aiPrompt = `Write a professional email template addressed to ${recipientName}.\nCreate a general professional email that:\n- Has an appropriate subject line\n- Includes proper greeting and closing\n- Has placeholder content that can be customized\n- Maintains professional tone\nFormat the response as:\nSubject: [Professional subject line]\n\nDear ${recipientName},\n\n[Professional email body]\n\nBest regards,\n[Your Name]`;
    }

    return await getModelResponse(model, aiPrompt); // Using retry logic
  } catch (error) {
    console.error('Mail writing error:', error);
    const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
    const fallbackSubject = subject || 'Professional Inquiry';
    const fallbackBody = body || 'I hope this email finds you well. I wanted to reach out regarding [specific matter]. Please let me know if you would like to discuss this further.';
    return `Subject: ${fallbackSubject}\n\nDear ${recipientName},\n\n${fallbackBody}\n\nBest regards,\n[Your Name]`;
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
    
    const enhancePrompt = `Please enhance and improve the following email content:\n\nOriginal Subject: "${subject}"\nOriginal Body: "${body}"\nRecipient: ${recipientName}\nPlease improve this email by:\n- Correcting any grammar or spelling mistakes\n- Improving clarity and readability\n- Making the tone more professional yet friendly\n- Adding proper greeting and closing if missing\n- Ensuring proper email structure\n- Keeping the original intent and meaning\n- Making it more polished and professional\nFormat the response as:\nSubject: [Enhanced subject line]\n\nDear ${recipientName},\n\n[Enhanced email body with improved grammar, clarity, and professionalism]\n\nBest regards,\n[Your Name]`;

    return await getModelResponse(model, enhancePrompt); // Using retry logic
  } catch (error) {
    console.error('Content enhancement error:', error);
    const recipientName = recipient ? recipient.split('<')[0].trim() || recipient.split('@')[0] : 'Recipient';
    return `Subject: ${subject || 'Professional Email'}\n\nDear ${recipientName},\n\n${body || 'Thank you for your time and consideration. Please let me know if you need any additional information.'}\n\nBest regards,\n[Your Name]`;
  }
}

// Helper function for retrying the model request in case of a 503 error
async function getModelResponse(model, prompt, retries = 3, delay = 2000) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (retries > 0 && error.status === 503) {
      console.log('Service unavailable. Retrying...');
      await new Promise(res => setTimeout(res, delay)); // Wait before retry
      return getModelResponse(model, prompt, retries - 1, delay); // Retry
    }
    throw error; // Throw the error if not a 503 or out of retries
  }
}

// POST Handler for chat-based AI assistance
export async function POST(req) {
  try {
    const { message, context } = await req.json();

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

    let prompt = message;
    if (context) {
      prompt = `Context: You are an email assistant helping with professional email composition and management.\n\nUser message: ${message}\n\nPlease provide a helpful, professional response related to email management, composition, or general assistance.`;
    }

    const result = await getModelResponse(model, prompt); // Using retry logic
    return NextResponse.json({ reply: result });

  } catch (error) {
    console.error('POST AI processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
