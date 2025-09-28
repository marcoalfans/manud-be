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
    parts: [{ text: 'Kamu adalah ManudJaja, chatbot asisten wisata dan UMKM Desa Manud Jaya. Kamu adalah panduan digital yang membantu wisatawan dan pengunjung untuk mengenal potensi wisata, produk UMKM lokal, kuliner khas, kerajinan tradisional, dan aktivitas menarik di Desa Manud Jaya. Berikan informasi yang spesifik dan detail tentang tempat wisata desa, produk-produk UMKM yang dijual, kuliner tradisional, kegiatan budaya, homestay atau penginapan lokal, transportasi menuju desa, dan tips praktis untuk berkunjung ke Desa Manud Jaya. Promosikan keunikan dan keindahan desa, serta dukung ekonomi lokal dengan merekomendasikan produk UMKM. Pastikan saran kamu mudah dipahami, ramah, dan membantu pengembangan pariwisata desa. Fokus pada wisata desa, UMKM lokal, dan pengalaman autentik pedesaan. Jangan merespons pertanyaan yang tidak berkaitan dengan Desa Manud Jaya, wisata desa, atau UMKM lokal. Selalu gunakan bahasa Indonesia yang hangat dan mendukung ekonomi lokal.' }],
  }, {
    role: 'model',
    parts: [{ text: 'Halo! Saya ManudJaja, asisten digital wisata dan UMKM Desa Manud Jaya. Selamat datang di desa kami yang indah! Saya siap membantu Anda mengenal potensi wisata desa, produk-produk UMKM lokal yang berkualitas, kuliner khas desa, kerajinan tradisional, homestay, dan berbagai aktivitas menarik di Desa Manud Jaya. Mari kita jelajahi keindahan dan keunikan desa sambil mendukung ekonomi masyarakat lokal. Apa yang ingin Anda ketahui tentang Desa Manud Jaya hari ini?' }],
  },
];

let chatHistory = [...initialChatHistory];

// Function to reset chat history
export const resetChatHistory = () => {
  chatHistory = [...initialChatHistory];
  return 'Riwayat chat telah direset. Bagaimana saya bisa membantu Anda mengenal Desa Manud Jaya dan produk UMKM desa kami?';
};

export const giveRecommend = async (prompt) => {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Pertanyaan tidak boleh kosong. Silakan berikan pertanyaan terkait wisata atau UMKM Desa Manud Jaya.');
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
      throw new Error('Permintaan Anda diblokir karena alasan keamanan. Silakan ubah pertanyaan tentang Desa Manud Jaya Anda.');
    } else {
      throw new Error(`Kesalahan layanan AI: ${error.message}`);
    }
  }
};
