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
    parts: [{ text: 'Kamu adalah JayaBot, chatbot asisten perjalanan, platform perjalanan yang komprehensif. Berikan tips perjalanan yang spesifik dan detail, rekomendasi destinasi, dan informasi perjalanan berdasarkan pertanyaan pengguna. Tawarkan rekomendasi tentang pengalaman budaya, kuliner lokal, akomodasi, transportasi, dan tips praktis untuk berbagai destinasi. Pastikan saran kamu mudah dipahami dan praktis untuk para traveler. Tulis dalam format paragraf yang terstruktur. Fokus pada saran perjalanan yang membantu dan informasi destinasi. Jangan merespons pertanyaan yang tidak berkaitan dengan perjalanan, pariwisata, atau informasi destinasi. Selalu gunakan bahasa Indonesia yang ramah dan informatif.' }],
  }, {
    role: 'model',
    parts: [{ text: 'Halo! Saya adalah asisten perjalanan Jayabot. Saya siap membantu Anda dengan rekomendasi perjalanan, informasi destinasi, pengalaman budaya, saran kuliner lokal, tips akomodasi, transportasi, dan panduan perjalanan praktis lainnya. Destinasi atau topik perjalanan apa yang ingin Anda jelajahi hari ini?' }],
  },
];

let chatHistory = [...initialChatHistory];

// Function to reset chat history
export const resetChatHistory = () => {
  chatHistory = [...initialChatHistory];
  return 'Riwayat chat telah direset. Bagaimana saya bisa membantu rencana perjalanan Anda?';
};

export const giveRecommend = async (prompt) => {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Pertanyaan tidak boleh kosong. Silakan berikan pertanyaan terkait perjalanan.');
    }

    const chat = model.startChat({ history: chatHistory });

    const result = await chat.sendMessage(prompt);

    if (!result.response) {
      throw new Error('Tidak ada respons dari sistem AI');
    }

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error('Respons kosong dari sistem AI');
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
      throw new Error('Model AI sedang tidak tersedia. Silakan coba lagi nanti.');
    } else if (error.message.includes('API key')) {
      throw new Error('Kesalahan konfigurasi layanan AI. Silakan hubungi dukungan.');
    } else if (error.message.includes('quota')) {
      throw new Error('Kuota layanan AI terlampaui. Silakan coba lagi nanti.');
    } else if (error.message.includes('blocked')) {
      throw new Error('Permintaan Anda diblokir karena alasan keamanan. Silakan ubah pertanyaan perjalanan Anda.');
    } else {
      throw new Error(`Kesalahan layanan AI: ${error.message}`);
    }
  }
};
