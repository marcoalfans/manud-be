/* eslint-disable no-useless-escape */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../utils/config.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { maxOutputTokens: 500 },
});

const initialChatHistory = [
  {
    role: 'user',
    parts: [{ text: 'You are a travel assistant chatbot for ManudBE, a comprehensive travel platform. Provide specific and detailed travel tips, destination recommendations, and travel information based on user questions. Offer recommendations on cultural experiences, local cuisine, accommodations, transportation, and practical travel tips for various destinations. Ensure your suggestions are easy to understand and practical for travelers. Write in a structured paragraph format. Focus on helpful travel advice and destination information. Do not respond to questions unrelated to travel, tourism, or destination information.' }],
  }, {
    role: 'model',
    parts: [{ text: 'Hello! I\'m your ManudBE travel assistant. I\'m here to help you with travel recommendations, destination information, cultural experiences, local cuisine suggestions, accommodation advice, transportation tips, and practical travel guidance. What travel destination or topic would you like to explore today?' }],
  },
];

let chatHistory = [...initialChatHistory];

// Function to reset chat history
export const resetChatHistory = () => {
  chatHistory = [...initialChatHistory];
  return 'Chat history has been reset. How can I help you with your travel plans?';
};

export const giveRecommend = async (prompt) => {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty. Please provide a travel-related question.');
    }

    const chat = model.startChat({ history: chatHistory });

    const result = await chat.sendMessage(prompt);

    if (!result.response) {
      throw new Error('No response received from Gemini API');
    }

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    chatHistory = [
      ...chatHistory,
      { role: 'user', parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: responseText }] },
    ];

    // Keep chat history under control (limit to last 10 exchanges)
    if (chatHistory.length > 22) { // 2 initial + 20 exchanges (10 pairs)
      chatHistory = [
        chatHistory[0], // Keep the system prompt
        chatHistory[1], // Keep the initial response
        ...chatHistory.slice(-20) // Keep last 20 messages (10 exchanges)
      ];
    }

    // Clean the response
    const cleanResponse = responseText
      .replace(/\\n/g, ' ') // Replace \n with space
      .replace(/\*\*/g, '') // Remove **
      .replace(/\*/g, '') // Remove *
      .replace(/\\\"/g, '\"') // Replace escaped quotes
      .replace(/\n/g, ' ') // Replace actual newlines with space
      .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/^#+\s*/, '') // Remove leading #
      .trim();

    return cleanResponse;

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('models/gemini-pro is not found')) {
      throw new Error('The AI model is currently unavailable. Please try again later.');
    } else if (error.message.includes('API key')) {
      throw new Error('AI service configuration error. Please contact support.');
    } else if (error.message.includes('quota')) {
      throw new Error('AI service quota exceeded. Please try again later.');
    } else if (error.message.includes('blocked')) {
      throw new Error('Your request was blocked due to safety concerns. Please rephrase your travel question.');
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
};
