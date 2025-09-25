// src/app/test-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyAxxxxxfIOWhV9pVS6lejP_ascfJ8yQWi4'; // Use env variable or hardcoded for testing

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Try a different model
    const result = await model.generateContent('Hello, summarize this: The meeting is scheduled for tomorrow at 10 AM.');
    console.log('Summary:', result.response.text());
  } catch (error) {
    console.error('Error:', error.message);
    if (error.status === 429) {
      console.log('Quota exceeded. Wait 6-7 seconds or enable billing to increase limits.');
    }
  }
}

testGemini();