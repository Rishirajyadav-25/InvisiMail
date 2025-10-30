import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const MODEL_NAMES = ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];

async function getAvailableModel() {
  for (const modelName of MODEL_NAMES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent("test");
      console.log(`✅ Model ${modelName} available`);
      return model;
    } catch (error) {
      console.log(`❌ Model ${modelName} not available`);
    }
  }
  return null;
}

// Helper functions for alias management
async function executeCreateAlias(userId, { alias, domain }) {
  const client = await clientPromise;
  const db = client.db();

  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  const aliasCount = await db.collection('aliases').countDocuments({ ownerId: new ObjectId(userId) });

  const isPro = user?.plan === 'pro';
  if (!isPro && aliasCount >= 5) {
    return { success: false, error: 'Free plan limited to 5 aliases. Upgrade to Pro for unlimited aliases.' };
  }

  const targetDomain = domain || process.env.NEXT_PUBLIC_MAILGUN_DOMAIN;
  const cleanAlias = alias.trim().toLowerCase();

  if (!/^[a-zA-Z0-9._-]+$/.test(cleanAlias)) {
    return { success: false, error: 'Invalid alias format. Use only letters, numbers, dots, hyphens and underscores.' };
  }

  if (cleanAlias.length < 2 || cleanAlias.length > 50) {
    return { success: false, error: 'Alias must be between 2 and 50 characters long' };
  }

  const reservedAliases = ['admin', 'administrator', 'root', 'postmaster', 'webmaster', 'hostmaster', 'abuse', 'noreply', 'no-reply', 'support', 'info', 'contact', 'sales', 'marketing', 'help', 'api'];

  if (reservedAliases.includes(cleanAlias)) {
    return { success: false, error: 'This is a reserved alias name. Please choose another.' };
  }

  const aliasEmail = `${cleanAlias}@${targetDomain}`;
  const existingAlias = await db.collection('aliases').findOne({ aliasEmail });

  if (existingAlias) {
    return { success: false, error: `Alias '${aliasEmail}' already exists. Please choose a different name.` };
  }

  const newAliasDoc = {
    userId: new ObjectId(userId),
    ownerId: new ObjectId(userId),
    isCollaborative: false,
    collaborators: [],
    aliasEmail,
    aliasName: cleanAlias,
    realEmail: user.email,
    isActive: true,
    emailsSent: 0,
    emailsReceived: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db.collection('aliases').insertOne(newAliasDoc);

  if (result.insertedId) {
    return {
      success: true,
      data: { ...newAliasDoc, _id: result.insertedId.toString() },
      message: `Successfully created alias: ${aliasEmail}`
    };
  }

  return { success: false, error: 'Failed to create alias in database.' };
}

async function executeDeleteAlias(userId, { aliasId, aliasAddress }) {
  const client = await clientPromise;
  const db = client.db();

  let query = { ownerId: new ObjectId(userId) };

  if (aliasId) {
    if (!ObjectId.isValid(aliasId)) {
      return { success: false, error: 'Invalid alias ID format.' };
    }
    query._id = new ObjectId(aliasId);
  } else if (aliasAddress) {
    query.aliasEmail = aliasAddress;
  } else {
    return { success: false, error: 'Please provide either alias ID or address.' };
  }

  const alias = await db.collection('aliases').findOne(query);

  if (!alias) {
    return { success: false, error: 'Alias not found or you do not have permission to delete it.' };
  }

  const result = await db.collection('aliases').deleteOne(query);

  if (result.deletedCount > 0) {
    return {
      success: true,
      message: `Successfully deleted alias: ${alias.aliasEmail}`
    };
  }

  return { success: false, error: 'Failed to delete alias.' };
}

async function executeListAliases(userId) {
  const client = await clientPromise;
  const db = client.db();

  const aliases = await db.collection('aliases')
    .find({
      $or: [
        { ownerId: new ObjectId(userId) },
        { 'collaborators.userId': new ObjectId(userId) }
      ]
    })
    .sort({ createdAt: -1 })
    .toArray();

  const formattedAliases = aliases.map(a => ({
    id: a._id.toString(),
    address: a.aliasEmail,
    status: a.isActive ? 'Active' : 'Inactive',
    emails: a.emailsReceived || 0,
    created: new Date(a.createdAt).toLocaleDateString(),
    isOwner: a.ownerId.toString() === userId
  }));

  return {
    success: true,
    data: formattedAliases,
    count: aliases.length,
    message: `Found ${aliases.length} alias(es).`
  };
}

function detectToolIntent(message) {
  const msg = message.toLowerCase().trim();

  // Navigation Intents (high priority)
  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?(main\s+)?dashboard/i)) {
    console.log('🎯 DETECTED: navigate_dashboard');
    return { tool: 'navigate_dashboard', confidence: 'high' };
  }

  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?create alias( page)?/i)) {
    console.log('🎯 DETECTED: navigate_create_alias');
    return { tool: 'navigate_create_alias', confidence: 'high' };
  }

  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?(all|my) aliases( page)?/i)) {
    console.log('🎯 DETECTED: navigate_aliases');
    return { tool: 'navigate_aliases', confidence: 'high' };
  }

  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?inbox/i)) {
    console.log('🎯 DETECTED: navigate_inbox');
    return { tool: 'navigate_inbox', confidence: 'high' };
  }

  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?compose( page)?/i)) {
    console.log('🎯 DETECTED: navigate_send');
    return { tool: 'navigate_send', confidence: 'high' };
  }

  if (msg.match(/(open|go to|navigate to|show|take me to)\s+(the\s+)?(custom )?domains( page)?/i)) {
    console.log('🎯 DETECTED: navigate_domains');
    return { tool: 'navigate_domains', confidence: 'high' };
  }

  // Tool Intents
  if (msg.match(/^(create|make|add|new)\s+(a\s+)?(new\s+)?(email\s+)?alias$/i)) {
    console.log('🎯 DETECTED: create_alias (needs name)');
    return { tool: 'create_alias', confidence: 'high', needsName: true };
  }

  if (msg.match(/create|make|add|new.*alias/i)) {
    console.log('🎯 DETECTED: create_alias');
    return { tool: 'create_alias', confidence: 'high' };
  }

  if (msg.match(/delete|remove|destroy.*alias/i)) {
    console.log('🎯 DETECTED: delete_alias');
    return { tool: 'delete_alias', confidence: 'high' };
  }

  if (msg.match(/list|show|display|get.*alias/i) || msg.match(/my aliases|all aliases/i)) {
    console.log('🎯 DETECTED: list_aliases');
    return { tool: 'list_aliases', confidence: 'high' };
  }

  console.log('🎯 NO INTENT DETECTED');
  return { tool: null, confidence: 'none' };
}

function extractAliasParams(message, conversationContext = {}) {
  const params = {};

  const commandKeywords = ['create', 'make', 'add', 'new', 'delete', 'remove', 'list', 'show', 'display', 'enable', 'disable', 'alias', 'aliases', 'my', 'a', 'an', 'the', 'help', 'please', 'can', 'you', 'i', 'want', 'need', 'to', 'email', 'yes', 'ok', 'okay', 'sure', 'called', 'named', 'name', 'open', 'go', 'navigate'];

  if (conversationContext.awaitingAliasName) {
    const cleanedMessage = message.trim().toLowerCase()
      .replace(/^(create|make|add|new|alias|called|named|name|yes|ok|okay|sure|it|is)\s+/gi, '')
      .replace(/['"]/g, '')
      .split(/\s+/)[0];

    if (cleanedMessage &&
      cleanedMessage.length >= 2 &&
      !commandKeywords.includes(cleanedMessage) &&
      /^[a-zA-Z0-9._-]+$/.test(cleanedMessage)) {
      params.alias = cleanedMessage;
      params.domain = conversationContext.pendingDomain;
    }
    return params;
  }

  const fullAddressMatch = message.match(/(\w+[-\w._]*)@([\w.-]+\.\w+)/i);
  if (fullAddressMatch && !commandKeywords.includes(fullAddressMatch[1].toLowerCase())) {
    params.alias = fullAddressMatch[1];
    params.domain = fullAddressMatch[2];
    params.aliasAddress = `${fullAddressMatch[1]}@${fullAddressMatch[2]}`;
    return params;
  }

  const aliasWithKeyword = message.match(/(?:alias|called?|named?|name)\s+['"]?(\w+[-\w._])['"]?(?!\s@)/i);
  if (aliasWithKeyword && !commandKeywords.includes(aliasWithKeyword[1].toLowerCase())) {
    params.alias = aliasWithKeyword[1];
  }

  if (!params.alias) {
    const words = message.trim().toLowerCase().split(/\s+/);
    const validWords = words.filter(w =>
      !commandKeywords.includes(w) &&
      /^[a-zA-Z0-9._-]+$/.test(w) &&
      w.length >= 2
    );

    if (validWords.length === 1) {
      params.alias = validWords[0];
    }
  }

  const numberMatch = message.match(/\b(\d+)\b/);
  if (numberMatch) {
    params.selectionNumber = parseInt(numberMatch[1]);
  }

  return params;
}

export async function POST(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    const userId = decodedToken.userId;

    const { message, conversationHistory = [], conversationContext = {} } = await req.json();

    console.log('\n========== INCOMING REQUEST ==========');
    console.log('Message:', message);
    console.log('Context:', JSON.stringify(conversationContext, null, 2));
    console.log('======================================\n');

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const newIntent = detectToolIntent(message);
    console.log('🔍 Detected Intent:', newIntent);

    let actionToExecute = null;

    if (conversationContext.awaitingAliasName) {
      actionToExecute = 'create_alias';
    } else if (conversationContext.tool) {
      actionToExecute = conversationContext.tool;
    } else if (newIntent.confidence === 'high') {
      actionToExecute = newIntent.tool;
    }

    console.log('⚡ Action to Execute:', actionToExecute);

    if (actionToExecute) {
      const params = extractAliasParams(message, conversationContext);
      let result;

      switch (actionToExecute) {
        // Navigation Cases
        case 'navigate_dashboard':
          console.log('🚀 NAVIGATION CASE HIT: dashboard');
          const dashboardResponse = {
            reply: "Taking you to the main dashboard...",
            navigationPath: '/dashboard',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(dashboardResponse, null, 2));
          return NextResponse.json(dashboardResponse);

        case 'navigate_create_alias':
          console.log('🚀 NAVIGATION CASE HIT: create-alias');
          const createAliasResponse = {
            reply: "Sure, opening the 'Create Alias' page...",
            navigationPath: '/dashboard/create-alias',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(createAliasResponse, null, 2));
          return NextResponse.json(createAliasResponse);

        case 'navigate_aliases':
          console.log('🚀 NAVIGATION CASE HIT: aliases');
          const aliasesResponse = {
            reply: "Navigating to your 'All Aliases' page...",
            navigationPath: '/dashboard/aliases',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(aliasesResponse, null, 2));
          return NextResponse.json(aliasesResponse);

        case 'navigate_inbox':
          console.log('🚀 NAVIGATION CASE HIT: inbox');
          const inboxResponse = {
            reply: "Opening your inbox...",
            navigationPath: '/dashboard/inbox',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(inboxResponse, null, 2));
          return NextResponse.json(inboxResponse);

        case 'navigate_send':
          console.log('🚀 NAVIGATION CASE HIT: send');
          const sendResponse = {
            reply: "Opening the 'Compose' page...",
            navigationPath: '/dashboard/send',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(sendResponse, null, 2));
          return NextResponse.json(sendResponse);

        case 'navigate_domains':
          console.log('🚀 NAVIGATION CASE HIT: domains');
          const domainsResponse = {
            reply: "Opening 'Custom Domains'...",
            navigationPath: '/dashboard/domains',
            conversationContext: {}
          };
          console.log('🚀 RETURNING RESPONSE:', JSON.stringify(domainsResponse, null, 2));
          return NextResponse.json(domainsResponse);

        // Tool Cases
        case 'create_alias':
          if (newIntent.needsName && !conversationContext.awaitingAliasName) {
            return NextResponse.json({
              reply: "I'd be happy to create an alias for you!\n\nWhat would you like to name your alias?\n\n*Example: 'support' or 'newsletter' or 'contact'*",
              conversationContext: {
                awaitingAliasName: true,
                tool: 'create_alias'
              }
            });
          }

          if (conversationContext.awaitingAliasName) {
            if (!params.alias) {
              return NextResponse.json({
                reply: "I didn't catch that. Please provide just the alias name.\n\n*For example: support*",
                conversationContext: {
                  awaitingAliasName: true,
                  tool: 'create_alias'
                }
              });
            }
            result = await executeCreateAlias(userId, params);
          }
          else if (params.alias) {
            result = await executeCreateAlias(userId, params);
          }
          else {
            return NextResponse.json({
              reply: "I can create an alias for you. What would you like to name it?",
              conversationContext: {
                awaitingAliasName: true,
                tool: 'create_alias'
              }
            });
          }
          break;

        case 'delete_alias':
          const deleteAliases = await executeListAliases(userId);
          if (!deleteAliases.success || deleteAliases.data.length === 0) {
            return NextResponse.json({
              reply: "You don't have any aliases to delete yet.",
              conversationContext: {}
            });
          }

          if (params.aliasAddress || params.selectionNumber) {
            if (params.selectionNumber) {
              const selectedAlias = deleteAliases.data[params.selectionNumber - 1];
              if (selectedAlias) {
                params.aliasAddress = selectedAlias.address;
                params.aliasId = selectedAlias.id;
              }
            }
            result = await executeDeleteAlias(userId, params);
          } else {
            const aliasList = deleteAliases.data.map((a, i) =>
              `${i + 1}. **${a.address}** (${a.status})`
            ).join('\n');
            return NextResponse.json({
              reply: `Here are your aliases:\n\n${aliasList}\n\nWhich one would you like to delete? Tell me the number or the address.`,
              conversationContext: { tool: 'delete_alias' }
            });
          }
          break;

        case 'list_aliases':
          result = await executeListAliases(userId);
          if (result.success && result.data.length > 0) {
            const aliasesText = result.data.map((a, i) =>
              `${i + 1}. **${a.address}**\n   Status: ${a.status === 'Active' ? '✅' : '❌'} ${a.status}\n   Emails: ${a.emails}\n   Created: ${a.created}`
            ).join('\n\n');
            return NextResponse.json({
              reply: `📧 Your Email Aliases (${result.count} total):\n\n${aliasesText}\n\nWould you like to create, delete, or modify any of these?`,
              conversationContext: {}
            });
          } else {
            return NextResponse.json({
              reply: "You don't have any aliases yet. Would you like me to create one for you?",
              conversationContext: {}
            });
          }

        default:
          console.log('⚠ DEFAULT CASE HIT - NO ACTION MATCHED');
          break;
      }

      if (result) {
        if (result.success) {
          return NextResponse.json({
            reply: `✅ ${result.message}`,
            toolData: result.data,
            refresh: true,
            conversationContext: {}
          });
        } else {
          return NextResponse.json({
            reply: `❌ ${result.error}`,
            error: result.error,
            conversationContext: {}
          });
        }
      }
    }

    // AI Fallback
    console.log('🤖 FALLING BACK TO AI');
    try {
      const model = await getAvailableModel();

      if (!model) {
        return NextResponse.json({
          reply: "I can help you with:\n\n• Creating email aliases\n• Deleting email aliases\n• Listing your aliases\n• Navigating to different pages\n\nWhat would you like to do?",
          conversationContext: {}
        });
      }

      const systemPrompt = "You are InvisiMail Assistant. Help users manage email aliases. Be brief and conversational.";
      let conversationText = systemPrompt + '\n\n';
      if (conversationHistory.length > 0) {
        conversationHistory.slice(-5).forEach(msg => {
          conversationText += `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
        });
      }
      conversationText += `\nUser: ${message}\nAssistant:`;

      const aiResult = await model.generateContent(conversationText);
      return NextResponse.json({
        reply: aiResult.response.text,
        conversationContext: {}
      });
    } catch (aiError) {
      console.error('🤖 AI ERROR:', aiError);
      return NextResponse.json({
        reply: "I can help you with:\n\n• 'Create a new alias'\n• 'List my aliases'\n• 'Delete an alias'\n• 'Open create alias page'\n\nWhat would you like to do?",
        conversationContext: {}
      });
    }

  } catch (error) {
    console.error('❌ POST ERROR:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({
      error: 'Processing failed',
      reply: "Sorry, something went wrong. Please try again.",
      conversationContext: {}
    }, { status: 500 });
  }
}