// src/routes/index.js
import express from 'express';

import userRoute from './user.route.js';
import authRoute from './auth.route.js';
import destinationRoute from './destination.route.js';
import chatbotRoute from './chatbot.route.js';
import testRoute from './test.route.js';
import umkmRoute from './umkm.route.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).send({
    status: 200,
    message: 'Welcome to ManudBE API - Your Travel Companion Backend Service',
    description: 'A comprehensive backend API for travel and destination management',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      destinations: '/destinations',
      umkm: '/umkm',                           
      chatbot: '/chatbot',
    },
    documentation: 'Please check README.md for complete API documentation'
  });
});

const defaultRoutes = [
  { path: '/auth',        route: authRoute },
  { path: '/users',       route: userRoute },
  { path: '/destinations',route: destinationRoute },
  { path: '/umkm',        route: umkmRoute },
  { path: '/chatbot',     route: chatbotRoute },
  { path: '/test',        route: testRoute },
];

defaultRoutes.forEach((route) => router.use(route.path, route.route));

export default router;