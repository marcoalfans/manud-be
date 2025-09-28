/* eslint-disable no-useless-escape */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../utils/config.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { maxOutputTokens: 500 },
});

let chatHistory = [
  {
    role: 'user',
    parts: [{ text: 'You are a travel assistant chatbot for ManudBE, a comprehensive travel platform. Provide specific and detailed travel tips, destination recommendations, and travel information based on user questions. Offer recommendations on cultural experiences, local cuisine, accommodations, transportation, and practical travel tips for various destinations. Ensure your suggestions are easy to understand and practical for travelers. Write in a structured paragraph format. Focus on helpful travel advice and destination information. Do not respond to questions unrelated to travel, tourism, or destination information.' }],
  }, {
    role: 'model',
    parts: [{ text: 'Of course' }],
  },
];

export const giveRecommend = async (prompt) => {
  const chat = model.startChat({ history: chatHistory });

  const result = await chat.sendMessage(prompt);

  chatHistory = [
    ...chatHistory,
    { role: 'user', parts: [{ text: prompt }] },
    { role: 'model', parts: [{ text: result.response.text() }] },
  ];

  // Clean the response
  const cleanResponse = result.response
    .text()
    .replace(/\\n/g, ' ') // Replace \n with space
    .replace(/\*\*/g, '') // Remove **
    .replace(/\*/g, '') // Remove *
    .replace(/\\\"/g, '\"') // Replace escaped quotes
    .replace(/\n/g, ' ') // Replace actual newlines with space
    .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/^#+\s*/, '') // Remove leading #
    .trim();

  return cleanResponse;
};
